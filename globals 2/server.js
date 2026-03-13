// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Capture raw body for webhook signature verification and parse JSON
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || '';
if (!PAYSTACK_SECRET) {
  console.warn('⚠ PAYSTACK_SECRET not set in environment!');
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON))
      });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
      admin.initializeApp(); // still try default
    }
  } else {
    admin.initializeApp();
  }
}
const dbAdmin = admin.firestore();

/**
 * Helper: extract & verify Firebase ID token (from Authorization header "Bearer ..." OR req.body.idToken)
 * Returns decoded token or throws (with code property).
 */
async function verifyIdTokenFromHeaderOrBody(req) {
  const authHeader = req.headers.authorization || "";
  let idToken = null;
  if (authHeader.startsWith("Bearer ")) {
    idToken = authHeader.split("Bearer ")[1];
  } else if (req.body && req.body.idToken) {
    idToken = req.body.idToken;
  }

  if (!idToken) {
    const e = new Error('Missing ID token');
    e.code = 'NO_TOKEN';
    throw e;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    const e = new Error('Invalid ID token');
    e.code = 'INVALID_TOKEN';
    // attach original error message for logs
    e.detail = err.message || err;
    throw e;
  }
}

/* =======================
   GET BANKS
   ======================= */
app.get("/api/get-banks", async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    return res.json(response.data.data);
  } catch (err) {
    console.error('get-banks error', err.response?.data || err.message || err);
    return res.status(500).json({ error: "Failed to fetch banks" });
  }
});

/* =======================
   VERIFY ACCOUNT (resolve)
   ======================= */
app.post("/api/verify-account", async (req, res) => {
  const { accNum, bankCode } = req.body || {};
  if (!accNum || !bankCode) {
    return res.status(400).json({ status: "fail", error: "Missing account number or bank code" });
  }
  try {
    const verify = await axios.get("https://api.paystack.co/bank/resolve", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      params: { account_number: accNum, bank_code: bankCode }
    });

    if (verify.data && verify.data.status && verify.data.data) {
      return res.json({ status: "success", account_name: verify.data.data.account_name });
    } else {
      return res.json({ status: "fail" });
    }
  } catch (err) {
    console.error('verify-account error', err.response?.data || err.message || err);
    return res.status(500).json({ status: "fail", error: "Account verification failed" });
  }
});





/* =======================
REQUEST WITHDRAWAL (Manual Firestore Record Only)
======================= */
app.post("/api/request-withdrawal", async (req, res) => {
  try {
    // ✅ 1. Verify Firebase user
    let decoded;
    try {
      decoded = await verifyIdTokenFromHeaderOrBody(req);
    } catch (tokenErr) {
      console.warn("request-withdrawal token error", tokenErr.message, tokenErr.detail || "");
      return res.status(401).json({ status: "fail", message: tokenErr.message });
    }

    const userId = decoded.uid;
    if (!userId)
      return res.status(401).json({ status: "fail", message: "Invalid token (no userId)" });

    // ✅ 2. Extract and validate fields
    const { accNum, bankCode, bankName, account_name, amount, pin } = req.body || {};
    if (!accNum || !bankName || !account_name || !amount || !pin) {
      return res
        .status(400)
        .json({ status: "fail", message: "Missing required withdrawal fields" });
    }

    const amtNum = Number(amount);
    if (!isFinite(amtNum) || amtNum < 500) {
      return res.status(400).json({ status: "fail", message: "Minimum withdrawal is ₦500" });
    }

    // ✅ 3. Get user data
    const userRef = dbAdmin.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists)
      return res.status(404).json({ status: "fail", message: "User not found" });

    const userData = userSnap.data() || {};

    // ✅ 4. Verify PIN
    if (!userData.pin)
      return res.status(400).json({ status: "fail", message: "Set your payment PIN first" });
    if (String(userData.pin) !== String(pin))
      return res.status(400).json({ status: "fail", message: "Invalid PIN" });

    // ✅ 5. Check balance
    const balance = Number(userData.balance) || 0;
    if (amtNum > balance)
      return res.status(400).json({ status: "fail", message: "Insufficient balance" });

    // ✅ 6. Write to Firestore: Withdraw + Transaction
    const withdrawRef = dbAdmin.collection("Withdraw").doc();
    const transactionRef = dbAdmin.collection("Transaction").doc();

    await dbAdmin.runTransaction(async (tx) => {
      tx.update(userRef, { balance: balance - amtNum });
      tx.set(withdrawRef, {
        userId,
        accNum,
        bankName,
        account_name,
        amount: amtNum,
        status: "processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.set(transactionRef, {
        userId,
        accNum,
        bankName,
        account_name,
        amount: amtNum,
        type: "Withdraw",
        status: "processing",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.json({
      status: "success",
      message: "Withdrawal request recorded successfully (manual approval needed)",
    });
  } catch (err) {
    console.error("request-withdrawal error:", err);
    return res.status(500).json({ status: "fail", message: "Server error during withdrawal" });
  }
});









/* =======================
   DEPOSIT: verify-payment (with Firestore records)
   ======================= */
app.post("/api/verify-payment", async (req, res) => {
  try {
    // ✅ Verify Firebase token
    let decoded;
    try {
      decoded = await verifyIdTokenFromHeaderOrBody(req);
    } catch (tokenErr) {
      console.warn("verify-payment token error", tokenErr.message, tokenErr.detail || "");
      return res.status(401).json({ status: "fail", message: tokenErr.message });
    }

    const uid = decoded.uid;
    if (!uid) return res.status(401).json({ status: "fail", message: "Invalid token (no uid)" });

    const { reference, amount } = req.body || {};
    const amountNum = Number(amount);
    if (!reference || !isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid reference or amount" });
    }

    // ✅ Verify transaction with Paystack
    const verifyResp = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const paymentData = verifyResp.data?.data;
    if (!paymentData || paymentData.status !== "success") {
      console.warn("verify-payment: paystack says not success", paymentData || {});
      return res
        .status(400)
        .json({ status: "fail", message: "Payment not successful", detail: paymentData || null });
    }

    const paidNaira = Number(paymentData.amount) / 100;

    // ✅ Write to Firestore: payments + Deposit + Transaction + update balance
    const paymentDocRef = dbAdmin.collection("payments").doc(reference);
    const depositRef = dbAdmin.collection("Deposit").doc();
    const transactionRef = dbAdmin.collection("Transaction").doc();
    const userRef = dbAdmin.collection("users").doc(uid);

    await dbAdmin.runTransaction(async (tx) => {
      const pSnap = await tx.get(paymentDocRef);
      if (pSnap.exists) return; // prevent double-processing

      // Current balance
      const userSnap = await tx.get(userRef);
      let currentBalance = 0;
      if (userSnap.exists) {
        const cur = userSnap.data().balance;
        currentBalance = typeof cur === "number" ? cur : Number(cur) || 0;
      }

      const newBalance = currentBalance + paidNaira;

      // ✅ Update balance
      tx.set(userRef, { balance: newBalance }, { merge: true });

      // ✅ Add Deposit record
      tx.set(depositRef, {
        userId: uid,
        amount: paidNaira,
        status: "successful",
        reference,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ Add Transaction record
      tx.set(transactionRef, {
        userId: uid,
        amount: paidNaira,
        type: "Deposit",
        status: "successful",
        reference,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ Add to payments record (for traceability)
      tx.set(paymentDocRef, {
        reference,
        uid,
        amount: paidNaira,
        status: "verified",
        paystack: paymentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.json({ status: "success" });
  } catch (err) {
    console.error("verify-payment error:", err.response?.data || err.message || err);
    return res.status(500).json({
      status: "fail",
      message: "Server error verifying payment",
      detail: err.response?.data || err.message || null,
    });
  }
});






/* =======================
   PAYSTACK WEBHOOK (optional redundancy)
   ======================= */
app.post('/webhook/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] || '';
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex');
    if (hash !== signature) {
      console.warn('Invalid Paystack webhook signature');
      return res.status(400).send('Invalid signature');
    }

    // For reliability: you can process paystack events here similarly to verify-payment
    return res.status(200).send('ok');
  } catch (err) {
    console.error('webhook error:', err.response?.data || err.message || err);
    return res.status(500).send('server error');
  }
});












/* =====================================================================
   VTU — AIRTIME & DATA (VTPass)
   ===================================================================== */

// VTPass config — toggle sandbox/live via env var
const VTPASS_ENV  = process.env.VTPASS_ENV || 'sandbox';
const VTPASS_BASE = VTPASS_ENV === 'live'
  ? 'https://api.vtpass.com/api'
  : 'https://sandbox.vtpass.com/api';
// VTPass uses custom headers — NOT Basic Auth (that was the 401 bug)
const VTPASS_HEADERS_POST = {
  'api-key':      process.env.VTPASS_API_KEY    || '',
  'secret-key':   process.env.VTPASS_SECRET_KEY || '',
  'Content-Type': 'application/json',
};
const VTPASS_HEADERS_GET = {
  'api-key':    process.env.VTPASS_API_KEY    || '',
  'public-key': process.env.VTPASS_PUBLIC_KEY || '',
};

// Your profit margin on data (%). Set in Render env as VTU_MARKUP_PCT.
// e.g. 5 = VTPass charges ₦300, you charge user ₦315.
// Airtime has no markup — VTPass discounts you automatically.
const MARKUP_PCT = Number(process.env.VTU_MARKUP_PCT || 5);

// Your network codes → VTPass serviceIDs
const AIRTIME_SVC = { '01':'mtn', '02':'glo', '04':'airtel', '03':'etisalat' };
const DATA_SVC    = { '01':'mtn-data', '02':'glo-sme-data', '04':'airtel-data', '03':'etisalat-data' };
const NET_LABEL   = { '01':'MTN', '02':'GLO', '04':'Airtel', '03':'9mobile' };

const _plansCache = {};

function makeVTRequestId() {
  // VTpass requires Africa/Lagos time (UTC+1) for the first 12 digits
  const n = new Date(Date.now() + 3600000); // offset to UTC+1
  const p = v => String(v).padStart(2,'0');
  return `${n.getUTCFullYear()}${p(n.getUTCMonth()+1)}${p(n.getUTCDate())}` +
         `${p(n.getUTCHours())}${p(n.getUTCMinutes())}${p(n.getUTCSeconds())}` +
         uuidv4().replace(/-/g,'').slice(0,8).toUpperCase();
}

async function callVTPass(payload) {
  const r = await axios.post(`${VTPASS_BASE}/pay`, payload, { headers: VTPASS_HEADERS_POST, timeout: 35000 });
  return r.data;
}

async function _markSuccess(billRef, txnRef, vtRef) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const b = dbAdmin.batch();
  b.update(billRef, { status:'success', vtpassRef:vtRef, processed:true, updatedAt:now });
  b.update(txnRef,  { status:'success', vtpassRef:vtRef, updatedAt:now });
  await b.commit();
}

async function _markPending(billRef, txnRef, vtRef) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const b = dbAdmin.batch();
  b.update(billRef, { status:'pending', vtpassRef:vtRef, updatedAt:now });
  b.update(txnRef,  { status:'pending', vtpassRef:vtRef, updatedAt:now });
  await b.commit();
}

async function _refundAndFail(userRef, billRef, txnRef, amount, reason) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const b = dbAdmin.batch();
  b.update(userRef, { balance: admin.firestore.FieldValue.increment(amount) });
  b.update(billRef, { status:'failed', failReason:reason, refunded:true, updatedAt:now });
  b.update(txnRef,  { status:'failed', failReason:reason, refunded:true, updatedAt:now });
  await b.commit();
}

/* ---------- POST /api/vtu/airtime ---------- */
app.post('/api/vtu/airtime', async (req, res) => {
  let decoded;
  try { decoded = await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }

  const uid = decoded.uid;
  const { networkCode, phone, amount, pin } = req.body || {};

  if (!AIRTIME_SVC[networkCode])
    return res.status(400).json({ status:'fail', message:'Invalid network' });
  if (!phone || !/^0\d{10}$/.test(phone))
    return res.status(400).json({ status:'fail', message:'Invalid phone number' });
  const numAmount = Number(amount);
  if (!isFinite(numAmount) || numAmount < 50 || numAmount > 50000)
    return res.status(400).json({ status:'fail', message:'Amount must be ₦50–₦50,000' });
  if (!pin)
    return res.status(400).json({ status:'fail', message:'PIN is required' });

  const requestId = makeVTRequestId();
  const userRef   = dbAdmin.collection('users').doc(uid);
  const billRef   = dbAdmin.collection('bill_submissions').doc(requestId);
  const txnRef    = dbAdmin.collection('Transaction').doc(requestId);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  // Verify PIN + deduct balance atomically
  try {
    await dbAdmin.runTransaction(async tx => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw Object.assign(new Error('User not found'), { code:404 });
      const u = uSnap.data();
      if (!u.pin) throw Object.assign(new Error('Payment PIN not set — go to Account → Set PIN'), { code:400 });
      if (String(u.pin) !== String(pin)) throw Object.assign(new Error('Incorrect PIN'), { code:400 });
      const bal = Number(u.balance || 0);
      if (bal < numAmount) throw Object.assign(new Error('Insufficient balance'), { code:400 });

      tx.update(userRef, { balance: bal - numAmount });
      tx.set(billRef, {
        requestId, userId:uid, type:'airtime',
        networkCode, network:NET_LABEL[networkCode],
        phone, amount:numAmount,
        status:'processing', source:'auto-vtu', processed:false,
        createdAt:now, updatedAt:now,
      });
      tx.set(txnRef, {
        requestId, userId:uid, type:'Airtime',
        network:NET_LABEL[networkCode], phone, amount:numAmount,
        status:'processing', timestamp:now, updatedAt:now,
      });
    });
  } catch (err) {
    return res.status(err.code || 400).json({ status:'fail', message: err.message });
  }

  // Respond immediately — user sees "processing"
  res.json({ status:'success', requestId, message:'Order placed — processing…' });

  // Call VTPass async
  let vtRes;
  try { vtRes = await callVTPass({ request_id:requestId, serviceID:AIRTIME_SVC[networkCode], amount:numAmount, phone }); }
  catch (e) {
    console.error('[VTPass] airtime error:', e.message);
    await _refundAndFail(userRef, billRef, txnRef, numAmount, 'VTPass service error — wallet refunded');
    return;
  }

  const code = vtRes?.code, vtRef = vtRes?.content?.transactions?.transactionId || requestId;
  if      (code === '000') { await _markSuccess(billRef, txnRef, vtRef); console.log(`[VTU] Airtime ✅ ${phone} ₦${numAmount}`); }
  else if (code === '099') { await _markPending(billRef, txnRef, vtRef); console.log(`[VTU] Airtime ⏳ ${phone}`); }
  else { await _refundAndFail(userRef, billRef, txnRef, numAmount, vtRes?.response_description || 'Failed — wallet refunded'); }
});

/* ---------- POST /api/vtu/data ---------- */
app.post('/api/vtu/data', async (req, res) => {
  let decoded;
  try { decoded = await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }

  const uid = decoded.uid;
  const { networkCode, phone, variationCode, amount, planLabel, pin } = req.body || {};

  if (!DATA_SVC[networkCode])
    return res.status(400).json({ status:'fail', message:'Invalid network' });
  if (!phone || !/^0\d{10}$/.test(phone))
    return res.status(400).json({ status:'fail', message:'Invalid phone number' });
  if (!variationCode)
    return res.status(400).json({ status:'fail', message:'variationCode required' });
  const numAmount = Number(amount);
  if (!isFinite(numAmount) || numAmount < 10)
    return res.status(400).json({ status:'fail', message:'Invalid amount' });
  if (!pin)
    return res.status(400).json({ status:'fail', message:'PIN is required' });

  const requestId = makeVTRequestId();
  const userRef   = dbAdmin.collection('users').doc(uid);
  const billRef   = dbAdmin.collection('bill_submissions').doc(requestId);
  const txnRef    = dbAdmin.collection('Transaction').doc(requestId);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  try {
    await dbAdmin.runTransaction(async tx => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw Object.assign(new Error('User not found'), { code:404 });
      const u = uSnap.data();
      if (!u.pin) throw Object.assign(new Error('Payment PIN not set'), { code:400 });
      if (String(u.pin) !== String(pin)) throw Object.assign(new Error('Incorrect PIN'), { code:400 });
      const bal = Number(u.balance || 0);
      if (bal < numAmount) throw Object.assign(new Error('Insufficient balance'), { code:400 });

      tx.update(userRef, { balance: bal - numAmount });
      tx.set(billRef, {
        requestId, userId:uid, type:'data',
        networkCode, network:NET_LABEL[networkCode],
        phone, variationCode, planLabel:planLabel||variationCode,
        amount:numAmount, status:'processing', source:'auto-vtu', processed:false,
        createdAt:now, updatedAt:now,
      });
      tx.set(txnRef, {
        requestId, userId:uid, type:'Data',
        network:NET_LABEL[networkCode], phone,
        planLabel:planLabel||variationCode,
        amount:numAmount, status:'processing', timestamp:now, updatedAt:now,
      });
    });
  } catch (err) {
    return res.status(err.code || 400).json({ status:'fail', message: err.message });
  }

  res.json({ status:'success', requestId, message:'Order placed — processing…' });

  let vtRes;
  try { vtRes = await callVTPass({ request_id:requestId, serviceID:DATA_SVC[networkCode], billersCode:phone, variation_code:variationCode, amount:numAmount, phone }); }
  catch (e) {
    console.error('[VTPass] data error:', e.message);
    await _refundAndFail(userRef, billRef, txnRef, numAmount, 'VTPass service error — wallet refunded');
    return;
  }

  const code = vtRes?.code, vtRef = vtRes?.content?.transactions?.transactionId || requestId;
  if      (code === '000') { await _markSuccess(billRef, txnRef, vtRef); console.log(`[VTU] Data ✅ ${phone} ${planLabel}`); }
  else if (code === '099') { await _markPending(billRef, txnRef, vtRef); console.log(`[VTU] Data ⏳ ${phone}`); }
  else { await _refundAndFail(userRef, billRef, txnRef, numAmount, vtRes?.response_description || 'Failed — wallet refunded'); }
});

/* ---------- GET /api/vtu/plans/:networkCode ---------- */
app.get('/api/vtu/plans/:networkCode', async (req, res) => {
  const { networkCode } = req.params;
  if (!DATA_SVC[networkCode])
    return res.status(400).json({ error:'Invalid network code' });

  if (_plansCache[networkCode])
    return res.json({ plans: _plansCache[networkCode] });

  try {
    const resp = await axios.get(
      `${VTPASS_BASE}/service-variations?serviceID=${DATA_SVC[networkCode]}`,
      { headers: VTPASS_HEADERS_GET, timeout: 15000 }
    );
    const raw = resp.data?.content?.varations || resp.data?.content?.variations || [];
    const plans = raw.map(p => ({
      variation_code:   p.variation_code,
      name:             p.name,
      vtpass_amount:    Number(p.variation_amount),
      // User is charged this (with your markup applied)
      variation_amount: Math.ceil(Number(p.variation_amount) * (1 + MARKUP_PCT / 100)),
    }));
    _plansCache[networkCode] = plans;
    return res.json({ plans });
  } catch (err) {
    console.error('[VTU/plans]', err.message);
    return res.status(500).json({ error:'Could not fetch plans. Try again.' });
  }
});

/* ---------- POST /api/vtu/requery (admin tool) ---------- */
app.post('/api/vtu/requery', async (req, res) => {
  try { await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }

  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ error:'requestId required' });

  try {
    const r = await axios.post(`${VTPASS_BASE}/requery`, { request_id: requestId }, { headers: VTPASS_HEADERS_POST, timeout: 15000 });
    return res.json({ result: r.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* =====================================================================
   END VTU
   ===================================================================== */




/**
 * ══════════════════════════════════════════════════════════════
 *  GLOBALS LUDO — SERVER.JS ADDITIONS
 *  Add this to your existing server.js (Express + Firebase Admin)
 * ══════════════════════════════════════════════════════════════
 *
 *  STEP 1: Install Firebase Admin SDK if not done:
 *    npm install firebase-admin
 *
 *  STEP 2: Initialize Firebase Admin at the TOP of server.js
 *    (if not already done):
 *
 *    const admin = require('firebase-admin');
 *    const serviceAccount = require('./serviceAccountKey.json');
 *    if (!admin.apps.length) {
 *      admin.initializeApp({
 *        credential: admin.credential.cert(serviceAccount),
 *        databaseURL: "https://globals-17bf7.firebaseio.com"
 *      });
 *    }
 *    const adminDb = admin.firestore();
 *
 *  STEP 3: Paste the routes below into your server.js
 *
 *  STEP 4: Add Firestore Security Rules (shown at bottom of this file)
 *
 *  STEP 5: Serve Ludo.html:
 *    app.use('/ludo', express.static(path.join(__dirname, 'public/ludo')));
 *    — OR —
 *    app.get('/ludo', (req, res) => res.sendFile(path.join(__dirname, 'Ludo.html')));
 */

// ──────────────────────────────────────────────────────────────
//  MIDDLEWARE: Verify Firebase Auth Token
// ──────────────────────────────────────────────────────────────

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// ──────────────────────────────────────────────────────────────
//  SERVE LUDO PAGES
// ──────────────────────────────────────────────────────────────

// Add this near your other static/route declarations:
// app.get('/ludo', (req, res) => res.sendFile(path.join(__dirname, 'Ludo.html')));
// app.get('/ludo.js', (req, res) => res.sendFile(path.join(__dirname, 'Ludo.js')));

// ──────────────────────────────────────────────────────────────
//  ROUTE: Verify & Credit Bet Winner (server-side secure)
// ──────────────────────────────────────────────────────────────

/**
 * POST /api/ludo/claim-win
 * Body: { roomId, idToken }
 * Verifies the winner from Firestore and credits winnings securely.
 * The client should call this AFTER the game room is updated with a winner.
 */
app.post('/api/ludo/claim-win', verifyToken, async (req, res) => {
  const { roomId } = req.body;
  const uid = req.uid;

  if (!roomId) return res.status(400).json({ error: 'Missing roomId' });

  try {
    const roomRef = adminDb.collection('ludo_bet_rooms').doc(roomId);
    const claimRef = adminDb.collection('ludo_claims').doc(roomId);

    await adminDb.runTransaction(async tx => {
      const roomSnap = await tx.get(roomRef);
      const claimSnap = await tx.get(claimRef);

      if (!roomSnap.exists) throw new Error('Room not found');
      if (claimSnap.exists) throw new Error('Winnings already claimed');

      const room = roomSnap.data();
      if (room.status !== 'completed' && room.status !== 'forfeit') {
        throw new Error('Game not yet complete');
      }
      if (room.winnerUid !== uid) {
        throw new Error('You are not the winner of this game');
      }

      const winAmount = room.winAmount;
      if (!winAmount || winAmount <= 0) throw new Error('Invalid win amount');

      // Credit winner balance
      const balRef = adminDb.collection('balance').doc(uid);
      tx.update(balRef, {
        amount: admin.firestore.FieldValue.increment(winAmount)
      });

      // Record transaction
      const txRef = adminDb.collection('ludo_transactions').doc();
      tx.set(txRef, {
        uid,
        roomId,
        type: 'ludo_win',
        amount: winAmount,
        stake: room.stake,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processed: true
      });

      // Mark as claimed
      tx.set(claimRef, {
        uid,
        roomId,
        claimedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return res.json({ success: true, message: 'Winnings credited successfully' });
  } catch (err) {
    console.error('[LUDO] Claim win error:', err.message);
    return res.status(400).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
//  ROUTE: Start Matchmaking (server-side deduction + queue)
// ──────────────────────────────────────────────────────────────

/**
 * POST /api/ludo/start-match
 * Body: { stake }
 * Deducts stake from user balance and adds to matchmaking queue.
 * Returns: { queued: true } or { matched: true, roomId, role }
 */
app.post('/api/ludo/start-match', verifyToken, async (req, res) => {
  const { stake } = req.body;
  const uid = req.uid;
  const validStakes = [50, 100, 200, 500, 1000, 2000];
  const winMap = { 50:80, 100:150, 200:350, 500:900, 1000:1800, 2000:3600 };

  if (!validStakes.includes(Number(stake))) {
    return res.status(400).json({ error: 'Invalid stake amount' });
  }

  const stakeNum = Number(stake);
  const winAmount = winMap[stakeNum];

  try {
    // Deduct balance
    await adminDb.runTransaction(async tx => {
      const balRef = adminDb.collection('balance').doc(uid);
      const balSnap = await tx.get(balRef);
      const bal = balSnap.data()?.amount || 0;
      if (bal < stakeNum) throw new Error('Insufficient balance');
      tx.update(balRef, {
        amount: admin.firestore.FieldValue.increment(-stakeNum)
      });
    });

    // Try to find an opponent in queue
    const cutoff = new Date(Date.now() - 60000);
    const queueSnap = await adminDb.collection('ludo_matchmaking')
      .where('stake', '==', stakeNum)
      .where('status', '==', 'searching')
      .orderBy('createdAt', 'asc')
      .get();

    const candidates = queueSnap.docs.filter(d =>
      d.id !== uid && d.data().createdAt?.toDate() > cutoff
    );

    if (candidates.length > 0) {
      // Match found!
      const opponent = candidates[0];
      const oppData = opponent.data();
      const roomId = 'bet_' + Date.now() + '_' + uid.slice(0,4);

      // Get username
      const myProfile = await adminDb.collection('users').doc(uid).get();
      const myUsername = myProfile.data()?.username || 'Player';

      await adminDb.runTransaction(async tx => {
        const oppRef = adminDb.collection('ludo_matchmaking').doc(opponent.id);
        const oppSnap = await tx.get(oppRef);
        if (!oppSnap.exists || oppSnap.data().status !== 'searching') {
          throw new Error('Opponent no longer available');
        }

        const roomRef = adminDb.collection('ludo_bet_rooms').doc(roomId);
        tx.set(roomRef, {
          p1: opponent.id, p1Name: oppData.username,
          p2: uid, p2Name: myUsername,
          stake: stakeNum, winAmount,
          status: 'playing',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          winner: null, gameState: null
        });

        tx.update(oppRef, { status: 'matched', roomId, role: 'p1', winAmount });
        tx.set(adminDb.collection('ludo_matchmaking').doc(uid), {
          uid, username: myUsername, stake: stakeNum,
          status: 'matched', roomId, role: 'p2', winAmount,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return res.json({ matched: true, roomId, role: 'p2', winAmount });
    } else {
      // Queue this user
      const myProfile = await adminDb.collection('users').doc(uid).get();
      const myUsername = myProfile.data()?.username || 'Player';

      await adminDb.collection('ludo_matchmaking').doc(uid).set({
        uid, username: myUsername, stake: stakeNum,
        status: 'searching',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        roomId: null
      });

      return res.json({ queued: true, message: 'Added to matchmaking queue' });
    }
  } catch (err) {
    // Refund on error
    try {
      await adminDb.collection('balance').doc(uid).update({
        amount: admin.firestore.FieldValue.increment(stakeNum)
      });
    } catch(e) {}
    console.error('[LUDO] Match error:', err.message);
    return res.status(400).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
//  ROUTE: Cancel Matchmaking & Refund
// ──────────────────────────────────────────────────────────────

/**
 * POST /api/ludo/cancel-match
 * Cancels matchmaking and refunds stake if still searching.
 */
app.post('/api/ludo/cancel-match', verifyToken, async (req, res) => {
  const uid = req.uid;
  try {
    const queueRef = adminDb.collection('ludo_matchmaking').doc(uid);
    const queueSnap = await queueRef.get();

    if (!queueSnap.exists) return res.json({ success: true, refunded: false });
    const data = queueSnap.data();

    if (data.status !== 'searching') {
      return res.json({ success: true, refunded: false, message: 'Already matched' });
    }

    const stake = data.stake;
    await adminDb.runTransaction(async tx => {
      tx.delete(queueRef);
      tx.update(adminDb.collection('balance').doc(uid), {
        amount: admin.firestore.FieldValue.increment(stake)
      });
    });

    return res.json({ success: true, refunded: true, amount: stake });
  } catch (err) {
    console.error('[LUDO] Cancel match error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
//  ROUTE: Get Ludo Leaderboard
// ──────────────────────────────────────────────────────────────

app.get('/api/ludo/leaderboard', async (req, res) => {
  try {
    const snap = await adminDb.collection('ludo_transactions')
      .where('type', '==', 'ludo_win')
      .orderBy('amount', 'desc')
      .limit(20)
      .get();

    const board = snap.docs.map(d => ({
      username: d.data().username || 'Anonymous',
      amount: d.data().amount,
      stake: d.data().stake,
      timestamp: d.data().timestamp?.toDate()?.toISOString()
    }));

    res.json({ leaderboard: board });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
//  ROUTE: Forfeit Game (opponent disconnected cleanup)
// ──────────────────────────────────────────────────────────────

app.post('/api/ludo/forfeit', verifyToken, async (req, res) => {
  const { roomId } = req.body;
  const uid = req.uid;
  if (!roomId) return res.status(400).json({ error: 'Missing roomId' });

  try {
    const roomRef = adminDb.collection('ludo_bet_rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) return res.status(404).json({ error: 'Room not found' });
    const room = roomSnap.data();
    if (room.status === 'completed') return res.json({ success: true, message: 'Already completed' });

    const quitterRole = room.p1 === uid ? 'p1' : 'p2';
    const winnerRole = quitterRole === 'p1' ? 'p2' : 'p1';
    const winnerUid = winnerRole === 'p1' ? room.p1 : room.p2;

    await adminDb.runTransaction(async tx => {
      tx.update(roomRef, {
        status: 'forfeit', winner: winnerRole, winnerUid,
        quitter: uid, endedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      // Credit winner
      tx.update(adminDb.collection('balance').doc(winnerUid), {
        amount: admin.firestore.FieldValue.increment(room.winAmount)
      });
      // Log transaction
      const txRef = adminDb.collection('ludo_transactions').doc();
      tx.set(txRef, {
        uid: winnerUid,
        roomId,
        type: 'ludo_win_forfeit',
        amount: room.winAmount,
        stake: room.stake,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return res.json({ success: true, winnerUid });
  } catch (err) {
    console.error('[LUDO] Forfeit error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});





module.exports = {}; // Placeholder — paste route code into server.js directly










// ✅ Clean URL routing — no .html in browser URL
const HTML_ROUTES = {
  '/':           'dashboard.html',
  '/dashboard':  'dashboard.html',
  '/task':       'task.html',
  '/tasks':      'task.html',
  '/ludo':       'Ludo.html',
  '/affiliate':  'affiliate.html',
  '/overview':   'overview.html',
};
Object.entries(HTML_ROUTES).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    const fp = path.join(__dirname, file);
    if (require('fs').existsSync(fp)) return res.sendFile(fp);
    // Fallback to public folder
    res.sendFile(path.join(__dirname, 'public', file), err => {
      if (err) res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });
  });
});

// Catch-all: for any unmatched route, serve dashboard
app.get("*", (req, res) => {
  // Don't serve HTML for API or asset requests
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

/* Start server */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // Start the pending-orders auto-requery after server is up
  startPendingOrdersRequery();
});

/* =====================================================================
   PENDING ORDERS AUTO-REQUERY
   Runs every 5 minutes. Finds any VTU orders stuck on "pending"
   and re-asks VTPass for the real status. Resolves them automatically.
   ===================================================================== */
function startPendingOrdersRequery() {
  const INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

  async function requeryPending() {
    try {
      // Find all VTU orders that are still "pending" (VTPass returned 099)
      const snap = await dbAdmin.collection('bill_submissions')
        .where('status', '==', 'pending')
        .where('source', '==', 'auto-vtu')
        .limit(20) // process max 20 at a time per cycle
        .get();

      if (snap.empty) return;

      console.log(`[PendingRequery] Checking ${snap.docs.length} pending order(s)…`);

      for (const doc of snap.docs) {
        const order = doc.data();
        const requestId = order.requestId || doc.id;

        try {
          const resp = await axios.post(
            `${VTPASS_BASE}/requery`,
            { request_id: requestId },
            { headers: VTPASS_HEADERS_POST, timeout: 15000 }
          );

          const code  = resp.data?.code;
          const vtRef = resp.data?.content?.transactions?.transactionId || requestId;
          const desc  = resp.data?.response_description || '';

          const userRef = dbAdmin.collection('users').doc(order.userId);
          const billRef = dbAdmin.collection('bill_submissions').doc(requestId);
          const txnRef  = dbAdmin.collection('Transaction').doc(requestId);

          if (code === '000') {
            await _markSuccess(billRef, txnRef, vtRef);
            console.log(`[PendingRequery] ✅ Resolved ${requestId} — SUCCESS`);
          } else if (code === '016' || (desc && desc.toLowerCase().includes('fail'))) {
            // Code 016 = transaction failed on VTPass end
            await _refundAndFail(userRef, billRef, txnRef, order.amount, 'VTPass failed — wallet refunded');
            console.log(`[PendingRequery] ❌ Resolved ${requestId} — FAILED + refunded ₦${order.amount}`);
          } else {
            // Still pending (unlikely after 5+ mins but possible) — leave it
            console.log(`[PendingRequery] ⏳ Still pending ${requestId} — code:${code}`);
          }
        } catch (err) {
          console.error(`[PendingRequery] Error on ${requestId}:`, err.message);
        }

        // Small delay between requests to avoid hammering VTPass
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error('[PendingRequery] Cycle error:', err.message);
    }
  }

  // Run once after 30 seconds, then every 5 minutes
  setTimeout(requeryPending, 30000);
  setInterval(requeryPending, INTERVAL_MS);
  console.log('🔁 Pending orders requery started (every 5 min)');
}
/* =====================================================================
   END PENDING REQUERY
   ===================================================================== */








/* =====================================================================
   VTU EXTRAS — Electricity, TV, Betting, Education
   ===================================================================== */

const ELEC_LABELS = {
  'ikeja-electric':'Ikeja Electric (IKEDC)',
  'eko-electric':'Eko Electric (EKEDC)',
  'kano-electric':'Kano Electric (KEDCO)',
  'phed':'Port Harcourt Electric (PHED)',
  'jos-electric':'Jos Electric (JED)',
  'ibadan-electric':'Ibadan Electric (IBEDC)',
  'kaduna-electric':'Kaduna Electric (KAEDCO)',
  'abuja-electric':'Abuja Electric (AEDC)',
  'enugu-electric':'Enugu Electric (EEDC)',
  'benin-electric':'Benin Electric (BEDC)',
  'aba-electric':'ABA Electric',
  'yola-electric':'Yola Electric (YEDC)',
};
const TV_LABELS = { 'dstv':'DSTV','gotv':'GOtv','startimes':'Startimes','showmax':'Showmax' };
const BET_LABELS = {
  'bet9ja':'Bet9ja','sportybet':'SportyBet','betway':'Betway',
  '1xbet':'1xBet','betking':'BetKing','nairabet':'NairaBet',
  'merrybet':'MerryBet','parimatch':'PariMatch','accessbet':'AccessBet',
  'bangbet':'BangBet','msport':'MSport','cloudbet':'CloudBet',
  '22bet':'22Bet','goldenbet':'GoldenBet','betlion':'BetLion',
  'lionsbet':'LionsBet','surebet':'SureBet247','supabets':'Supabets',
  'betfast':'BetFast','premierbet':'PremierBet',
};
const EDU_LABELS = {
  'waec':'WAEC Result Checker',
  'waec-registration':'WAEC Registration',
  'jamb':'JAMB',
};

/* ---------- POST /api/vtu/verify-meter ---------- */
app.post('/api/vtu/verify-meter', async (req, res) => {
  try { await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }
  const { meterNumber, serviceID, meterType } = req.body || {};
  if (!meterNumber || !serviceID || !meterType)
    return res.status(400).json({ status:'fail', message:'meterNumber, serviceID and meterType required' });
  try {
    const r = await axios.post(`${VTPASS_BASE}/merchant-verify`,
      { billersCode: String(meterNumber).trim(), serviceID, type: meterType || 'prepaid' },
      { headers:VTPASS_HEADERS_POST, timeout:25000 });
    const vtData = r.data || {};
    console.log('[verify-meter] VTPass response code:', vtData.code, '| content keys:', Object.keys(vtData.content || {}));
    // Normalize response for client
    const success = vtData.code === '000' || vtData.code === '00' ||
                    !!(vtData.content?.Customer_Name || vtData.content?.name);
    if (!success) {
      return res.json({ code: vtData.code, status:'fail',
        response_description: vtData.response_description || vtData.content?.error || 'Meter not found. Check number and distributor.',
        content: vtData.content });
    }
    return res.json({ code: '000', status:'success', content: vtData.content });
  } catch (e) {
    console.error('[verify-meter] error:', e.message);
    return res.status(500).json({ status:'fail', message:'Verification service unavailable. Try again.' });
  }
});

/* ---------- POST /api/vtu/verify-smartcard ---------- */
app.post('/api/vtu/verify-smartcard', async (req, res) => {
  try { await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }
  const { smartcard, serviceID } = req.body || {};
  if (!smartcard || !serviceID)
    return res.status(400).json({ status:'fail', message:'smartcard and serviceID required' });
  try {
    const r = await axios.post(`${VTPASS_BASE}/merchant-verify`,
      { billersCode: String(smartcard).trim(), serviceID },
      { headers:VTPASS_HEADERS_POST, timeout:25000 });
    const vtData = r.data || {};
    console.log('[verify-smartcard] VTPass response code:', vtData.code, '| content keys:', Object.keys(vtData.content || {}));
    const success = vtData.code === '000' || vtData.code === '00' ||
                    !!(vtData.content?.Customer_Name || vtData.content?.name);
    if (!success) {
      return res.json({ code: vtData.code, status:'fail',
        response_description: vtData.response_description || vtData.content?.error || 'Smartcard not found. Check number and provider.',
        content: vtData.content });
    }
    return res.json({ code: '000', status:'success', content: vtData.content });
  } catch (e) {
    console.error('[verify-smartcard] error:', e.message);
    return res.status(500).json({ status:'fail', message:'Verification service unavailable. Try again.' });
  }
});

/* ---------- GET /api/vtu/service-plans/:serviceID ---------- */
app.get('/api/vtu/service-plans/:serviceID', async (req, res) => {
  const { serviceID } = req.params;
  const key = 'svc_' + serviceID;
  if (_plansCache[key]) return res.json({ plans: _plansCache[key] });
  try {
    const resp = await axios.get(
      `${VTPASS_BASE}/service-variations?serviceID=${serviceID}`,
      { headers:VTPASS_HEADERS_GET, timeout:15000 });
    const vtData = resp.data || {};
    // VTPass spells it 'varations' (typo in their API)
    const raw = vtData.content?.varations || vtData.content?.variations || [];
    console.log('[service-plans]', serviceID, '→', raw.length, 'plans. code:', vtData.code);
    _plansCache[key] = raw;
    return res.json({ plans: raw });
  } catch (e) {
    console.error('[service-plans] error:', serviceID, e.message);
    return res.status(500).json({ error: e.message });
  }
});

/* ---------- POST /api/vtu/electricity ---------- */
app.post('/api/vtu/electricity', async (req, res) => {
  let decoded;
  try { decoded = await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }
  const uid = decoded.uid;
  const { serviceID, meterNumber, meterType, amount, customerName, phone, pin } = req.body || {};

  if (!ELEC_LABELS[serviceID])
    return res.status(400).json({ status:'fail', message:'Invalid electricity service' });
  if (!meterNumber || meterNumber.length < 6)
    return res.status(400).json({ status:'fail', message:'Invalid meter number' });
  if (!['prepaid','postpaid'].includes(meterType))
    return res.status(400).json({ status:'fail', message:'meterType must be prepaid or postpaid' });
  const numAmount = Number(amount);
  if (!isFinite(numAmount) || numAmount < 500)
    return res.status(400).json({ status:'fail', message:'Minimum electricity amount is ₦500' });
  if (!pin) return res.status(400).json({ status:'fail', message:'PIN is required' });

  const requestId = makeVTRequestId();
  const userRef   = dbAdmin.collection('users').doc(uid);
  const billRef   = dbAdmin.collection('bill_submissions').doc(requestId);
  const txnRef    = dbAdmin.collection('Transaction').doc(requestId);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  try {
    await dbAdmin.runTransaction(async tx => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw Object.assign(new Error('User not found'), {code:404});
      const u = uSnap.data();
      if (!u.pin) throw Object.assign(new Error('Payment PIN not set'), {code:400});
      if (String(u.pin) !== String(pin)) throw Object.assign(new Error('Incorrect PIN'), {code:400});
      const bal = Number(u.balance||0);
      if (bal < numAmount) throw Object.assign(new Error('Insufficient balance'), {code:400});
      tx.update(userRef, { balance: bal - numAmount });
      tx.set(billRef, { requestId, userId:uid, type:'electricity', serviceID,
        distro:ELEC_LABELS[serviceID]||serviceID, meterNumber, meterType,
        customerName:customerName||'', phone:phone||meterNumber, amount:numAmount,
        status:'processing', source:'auto-vtu', processed:false, createdAt:now, updatedAt:now });
      tx.set(txnRef, { requestId, userId:uid, type:'Electricity',
        serviceID, distro:ELEC_LABELS[serviceID]||serviceID,
        meterNumber, meterType, customerName:customerName||'',
        amount:numAmount, status:'processing', timestamp:now, updatedAt:now });
    });
  } catch (err) { return res.status(err.code||400).json({ status:'fail', message:err.message }); }

  res.json({ status:'success', requestId, message:'Processing electricity payment…' });

  let vtRes;
  try {
    vtRes = await callVTPass({
      request_id:requestId, serviceID, billersCode:meterNumber,
      variation_code:meterType, amount:numAmount, phone:phone||meterNumber,
    });
  } catch (e) {
    console.error('[VTPass] electricity error:', e.message);
    await _refundAndFail(userRef, billRef, txnRef, numAmount, 'VTPass error — wallet refunded');
    return;
  }

  const code  = vtRes?.code;
  const vtRef = vtRes?.content?.transactions?.transactionId || requestId;
  const token = vtRes?.content?.transactions?.token || vtRes?.purchased_code || '';

  if (code === '000') {
    const b = dbAdmin.batch(), ts = admin.firestore.FieldValue.serverTimestamp();
    b.update(billRef, { status:'success', vtpassRef:vtRef, token, processed:true, updatedAt:ts });
    b.update(txnRef,  { status:'success', vtpassRef:vtRef, token, updatedAt:ts });
    await b.commit();
    console.log(`[VTU] Electricity ✅ ${meterNumber} token:${token}`);
  } else if (code === '099') {
    await _markPending(billRef, txnRef, vtRef);
  } else {
    await _refundAndFail(userRef, billRef, txnRef, numAmount, vtRes?.response_description||'Failed — wallet refunded');
  }
});

/* ---------- POST /api/vtu/tv ---------- */
app.post('/api/vtu/tv', async (req, res) => {
  let decoded;
  try { decoded = await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }
  const uid = decoded.uid;
  const { serviceID, smartcard, variationCode, amount, customerName, planLabel, phone, pin } = req.body || {};

  if (!TV_LABELS[serviceID])
    return res.status(400).json({ status:'fail', message:'Invalid TV service' });
  if (!smartcard || smartcard.length < 5)
    return res.status(400).json({ status:'fail', message:'Invalid smartcard/IUC number' });
  if (!variationCode)
    return res.status(400).json({ status:'fail', message:'Plan required' });
  const numAmount = Number(amount);
  if (!isFinite(numAmount) || numAmount < 100)
    return res.status(400).json({ status:'fail', message:'Invalid amount' });
  if (!pin) return res.status(400).json({ status:'fail', message:'PIN is required' });

  const requestId = makeVTRequestId();
  const userRef   = dbAdmin.collection('users').doc(uid);
  const billRef   = dbAdmin.collection('bill_submissions').doc(requestId);
  const txnRef    = dbAdmin.collection('Transaction').doc(requestId);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  try {
    await dbAdmin.runTransaction(async tx => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw Object.assign(new Error('User not found'), {code:404});
      const u = uSnap.data();
      if (!u.pin) throw Object.assign(new Error('Payment PIN not set'), {code:400});
      if (String(u.pin) !== String(pin)) throw Object.assign(new Error('Incorrect PIN'), {code:400});
      const bal = Number(u.balance||0);
      if (bal < numAmount) throw Object.assign(new Error('Insufficient balance'), {code:400});
      tx.update(userRef, { balance: bal - numAmount });
      tx.set(billRef, { requestId, userId:uid, type:'tv', serviceID,
        provider:TV_LABELS[serviceID]||serviceID, smartcard, variationCode,
        planLabel:planLabel||variationCode, customerName:customerName||'',
        phone:phone||smartcard, amount:numAmount,
        status:'processing', source:'auto-vtu', processed:false, createdAt:now, updatedAt:now });
      tx.set(txnRef, { requestId, userId:uid, type:'TV',
        serviceID, provider:TV_LABELS[serviceID]||serviceID,
        smartcard, variationCode, planLabel:planLabel||variationCode,
        customerName:customerName||'',
        amount:numAmount, status:'processing', timestamp:now, updatedAt:now });
    });
  } catch (err) { return res.status(err.code||400).json({ status:'fail', message:err.message }); }

  res.json({ status:'success', requestId, message:'Processing TV subscription…' });

  let vtRes;
  try {
    vtRes = await callVTPass({
      request_id:requestId, serviceID, billersCode:smartcard,
      variation_code:variationCode, amount:numAmount,
      phone:phone||smartcard,
      subscription_type: subscriptionType || 'change',
    });
  } catch (e) {
    console.error('[VTPass] tv error:', e.message);
    await _refundAndFail(userRef, billRef, txnRef, numAmount, 'VTPass error — wallet refunded');
    return;
  }

  const code  = vtRes?.code;
  const vtRef = vtRes?.content?.transactions?.transactionId || requestId;
  if      (code === '000') { await _markSuccess(billRef, txnRef, vtRef); console.log(`[VTU] TV ✅ ${smartcard}`); }
  else if (code === '099') { await _markPending(billRef, txnRef, vtRef); }
  else { await _refundAndFail(userRef, billRef, txnRef, numAmount, vtRes?.response_description||'Failed — wallet refunded'); }
});

/* ---------- POST /api/vtu/betting ---------- */
app.post('/api/vtu/betting', async (req, res) => {
  let decoded;
  try { decoded = await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }
  const uid = decoded.uid;
  const { serviceID, customerID, amount, customerName, phone, pin } = req.body || {};

  if (!BET_LABELS[serviceID])
    return res.status(400).json({ status:'fail', message:'Invalid betting platform' });
  if (!customerID || customerID.length < 2)
    return res.status(400).json({ status:'fail', message:'Invalid customer/user ID' });
  const numAmount = Number(amount);
  if (!isFinite(numAmount) || numAmount < 100)
    return res.status(400).json({ status:'fail', message:'Minimum betting fund is ₦100' });
  if (!pin) return res.status(400).json({ status:'fail', message:'PIN is required' });

  const requestId = makeVTRequestId();
  const userRef   = dbAdmin.collection('users').doc(uid);
  const billRef   = dbAdmin.collection('bill_submissions').doc(requestId);
  const txnRef    = dbAdmin.collection('Transaction').doc(requestId);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  try {
    await dbAdmin.runTransaction(async tx => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw Object.assign(new Error('User not found'), {code:404});
      const u = uSnap.data();
      if (!u.pin) throw Object.assign(new Error('Payment PIN not set'), {code:400});
      if (String(u.pin) !== String(pin)) throw Object.assign(new Error('Incorrect PIN'), {code:400});
      const bal = Number(u.balance||0);
      if (bal < numAmount) throw Object.assign(new Error('Insufficient balance'), {code:400});
      tx.update(userRef, { balance: bal - numAmount });
      tx.set(billRef, { requestId, userId:uid, type:'betting', serviceID,
        platform:BET_LABELS[serviceID]||serviceID, customerID,
        customerName:customerName||'', amount:numAmount,
        status:'processing', source:'auto-vtu', processed:false, createdAt:now, updatedAt:now });
      tx.set(txnRef, { requestId, userId:uid, type:'Betting',
        serviceID, platform:BET_LABELS[serviceID]||serviceID,
        customerID, customerName:customerName||'',
        amount:numAmount, status:'processing', timestamp:now, updatedAt:now });
    });
  } catch (err) { return res.status(err.code||400).json({ status:'fail', message:err.message }); }

  res.json({ status:'success', requestId, message:'Processing betting fund…' });

  let vtRes;
  try {
    vtRes = await callVTPass({
      request_id:requestId, serviceID,
      billersCode:customerID, amount:numAmount,
      phone: phone || customerID,
    });
  } catch (e) {
    console.error('[VTPass] betting error:', e.message);
    await _refundAndFail(userRef, billRef, txnRef, numAmount, 'VTPass error — wallet refunded');
    return;
  }

  const code  = vtRes?.code;
  const vtRef = vtRes?.content?.transactions?.transactionId || requestId;
  if      (code === '000') { await _markSuccess(billRef, txnRef, vtRef); console.log(`[VTU] Betting ✅ ${serviceID} ${customerID}`); }
  else if (code === '099') { await _markPending(billRef, txnRef, vtRef); }
  else { await _refundAndFail(userRef, billRef, txnRef, numAmount, vtRes?.response_description||'Failed — wallet refunded'); }
});

/* ---------- POST /api/vtu/education ---------- */
app.post('/api/vtu/education', async (req, res) => {
  let decoded;
  try { decoded = await verifyIdTokenFromHeaderOrBody(req); }
  catch (e) { return res.status(401).json({ status:'fail', message: e.message }); }
  const uid = decoded.uid;
  const { serviceID, variationCode, phone, quantity, amount, planLabel, pin } = req.body || {};

  if (!EDU_LABELS[serviceID])
    return res.status(400).json({ status:'fail', message:'Invalid education service' });
  if (!variationCode)
    return res.status(400).json({ status:'fail', message:'Product required' });
  const numAmount = Number(amount);
  if (!isFinite(numAmount) || numAmount < 100)
    return res.status(400).json({ status:'fail', message:'Invalid amount' });
  if (!pin) return res.status(400).json({ status:'fail', message:'PIN is required' });

  const requestId = makeVTRequestId();
  const userRef   = dbAdmin.collection('users').doc(uid);
  const billRef   = dbAdmin.collection('bill_submissions').doc(requestId);
  const txnRef    = dbAdmin.collection('Transaction').doc(requestId);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  try {
    await dbAdmin.runTransaction(async tx => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw Object.assign(new Error('User not found'), {code:404});
      const u = uSnap.data();
      if (!u.pin) throw Object.assign(new Error('Payment PIN not set'), {code:400});
      if (String(u.pin) !== String(pin)) throw Object.assign(new Error('Incorrect PIN'), {code:400});
      const bal = Number(u.balance||0);
      if (bal < numAmount) throw Object.assign(new Error('Insufficient balance'), {code:400});
      tx.update(userRef, { balance: bal - numAmount });
      tx.set(billRef, { requestId, userId:uid, type:'education', serviceID,
        examType:EDU_LABELS[serviceID]||serviceID, variationCode,
        planLabel:planLabel||variationCode, phone:phone||'',
        quantity:Number(quantity||1), amount:numAmount,
        status:'processing', source:'auto-vtu', processed:false, createdAt:now, updatedAt:now });
      tx.set(txnRef, { requestId, userId:uid, type:'Education',
        serviceID, examType:EDU_LABELS[serviceID]||serviceID,
        variationCode, planLabel:planLabel||variationCode,
        phone:phone||'', quantity:Number(quantity||1),
        amount:numAmount, status:'processing', timestamp:now, updatedAt:now });
    });
  } catch (err) { return res.status(err.code||400).json({ status:'fail', message:err.message }); }

  res.json({ status:'success', requestId, message:'Processing education purchase…' });

  let vtRes;
  try {
    const eduPayload = {
      request_id:requestId, serviceID,
      variation_code:variationCode, amount:numAmount,
      phone:phone||'08011111111', quantity:Number(quantity||1),
    };
    if (phone) eduPayload.billersCode = phone;
    vtRes = await callVTPass(eduPayload);
  } catch (e) {
    console.error('[VTPass] education error:', e.message);
    await _refundAndFail(userRef, billRef, txnRef, numAmount, 'VTPass error — wallet refunded');
    return;
  }

  const code  = vtRes?.code;
  const vtRef = vtRes?.content?.transactions?.transactionId || requestId;
  const eduPin = vtRes?.content?.transactions?.pin || vtRes?.purchased_code || '';

  if (code === '000') {
    const b = dbAdmin.batch(), ts = admin.firestore.FieldValue.serverTimestamp();
    b.update(billRef, { status:'success', vtpassRef:vtRef, eduPin, processed:true, updatedAt:ts });
    b.update(txnRef,  { status:'success', vtpassRef:vtRef, eduPin, updatedAt:ts });
    await b.commit();
    console.log(`[VTU] Education ✅ ${serviceID}`);
  } else if (code === '099') {
    await _markPending(billRef, txnRef, vtRef);
  } else {
    await _refundAndFail(userRef, billRef, txnRef, numAmount, vtRes?.response_description||'Failed — wallet refunded');
  }
});


/* =====================================================================
   CLEAN URL ROUTING — serve pages without .html extension
   ===================================================================== */
const _fs = require('fs');
const _htmlPages = ['dashboard','tasks','ludo','affiliate','checkin'];

// Explicit named routes first
_htmlPages.forEach(page => {
  app.get('/' + page, (req, res) => {
    const f = require('path').join(__dirname, 'public', page + '.html');
    if (_fs.existsSync(f)) return res.sendFile(f);
    res.status(404).send('Page not found');
  });
});

// Generic catch-all: /anypage -> /anypage.html
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (!page || !/^[a-zA-Z0-9_-]+$/.test(page)) return next();
  if (page.includes('.')) return next(); // skip if has extension
  const f = require('path').join(__dirname, 'public', page + '.html');
  if (_fs.existsSync(f)) return res.sendFile(f);
  next();
});
