// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');

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










// ✅ Keep this last (do not move)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* Start server */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));







