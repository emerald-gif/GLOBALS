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
   DEPOSIT: verify-payment
   ======================= */
app.post("/api/verify-payment", async (req, res) => {
  try {
    // decode token (header preferred, fallback to body.idToken)
    let decoded;
    try {
      decoded = await verifyIdTokenFromHeaderOrBody(req);
    } catch (tokenErr) {
      console.warn('verify-payment token error', tokenErr.message, tokenErr.detail || '');
      return res.status(401).json({ status: "fail", message: tokenErr.message });
    }
    const uid = decoded.uid;
    if (!uid) return res.status(401).json({ status: "fail", message: "Invalid token (no uid)" });

    const { reference, amount } = req.body || {};
    const amountNum = Number(amount);
    if (!reference || !isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid reference or amount" });
    }

    // verify transaction with Paystack
    const verifyResp = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const paymentData = verifyResp.data?.data;
    if (!paymentData || paymentData.status !== "success") {
      console.warn('verify-payment: paystack says not success', paymentData || {});
      return res.status(400).json({ status: "fail", message: "Payment not successful", detail: paymentData || null });
    }

    const paidNaira = Number(paymentData.amount) / 100;

    // Prevent double-processing — transactional write
    const paymentDocRef = dbAdmin.collection("payments").doc(reference);
    await dbAdmin.runTransaction(async (tx) => {
      const pSnap = await tx.get(paymentDocRef);
      if (pSnap.exists) return;
      const userRef = dbAdmin.collection("users").doc(uid);
      const userSnap = await tx.get(userRef);
      let currentBalance = 0;
      if (userSnap.exists) {
        const cur = userSnap.data().balance;
        currentBalance = (typeof cur === "number") ? cur : Number(cur) || 0;
      }
      const newBalance = currentBalance + paidNaira;

      tx.set(paymentDocRef, {
        reference,
        uid,
        amount: paidNaira,
        status: "verified",
        paystack: paymentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      tx.set(userRef, { balance: newBalance }, { merge: true });
    });

    return res.json({ status: "success" });

  } catch (err) {
    console.error("verify-payment error:", err.response?.data || err.message || err);
    return res.status(500).json({ status: "fail", message: "Server error verifying payment", detail: err.response?.data || err.message || null });
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










// ✅ Keep this last (do not move)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* Start server */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));





