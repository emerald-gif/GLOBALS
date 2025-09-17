// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');

const app = express();

// Capture raw body for webhook signature verification
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// PAYSTACK secret must be in env
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
if (!PAYSTACK_SECRET) {
  console.warn('⚠ PAYSTACK_SECRET not set in environment!');
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON))
    });
  } else {
    admin.initializeApp();
  }
}
const dbAdmin = admin.firestore();

/* -------------------------------------------------
   Helper: extract & verify Firebase ID token
   Returns decoded token object or throws
   ------------------------------------------------- */
async function verifyIdTokenFromHeader(req) {
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ")
    ? authHeader.split("Bearer ")[1]
    : null;
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
    throw e;
  }
}

/* =======================
   BANKS / ACCOUNT VERIFY
   ======================= */
app.get("/api/get-banks", async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    res.json(response.data.data);
  } catch (err) {
    console.error('get-banks error', err.response?.data || err.message || err);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

app.post("/api/verify-account", async (req, res) => {
  const { accNum, bankCode } = req.body;
  if (!accNum || !bankCode) {
    return res.status(400).json({ status: "fail", error: "Missing account number or bank code" });
  }
  try {
    const verify = await axios.get("https://api.paystack.co/bank/resolve", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      params: { account_number: accNum, bank_code: bankCode }
    });

    if (verify.data && verify.data.status) {
      res.json({ status: "success", account_name: verify.data.data.account_name });
    } else {
      res.json({ status: "fail" });
    }
  } catch (err) {
    console.error('verify-account error', err.response?.data || err.message || err);
    res.status(500).json({ status: "fail", error: "Account verification failed" });
  }
});

/* =======================
   WITHDRAWAL (with PIN + auth)
   ======================= */
app.post("/api/request-withdrawal", async (req, res) => {
  try {
    // 1) Verify token -> get uid
    let decoded;
    try {
      decoded = await verifyIdTokenFromHeader(req);
    } catch (tokenErr) {
      const code = tokenErr.code === 'NO_TOKEN' ? 401 : 401;
      return res.status(code).json({ status: "fail", message: tokenErr.message });
    }
    const uid = decoded.uid;

    // 2) read body
    const { accNum, bankCode, account_name, amount, pin } = req.body;

    if (!accNum || !bankCode || !account_name || !amount || !pin) {
      return res.status(400).json({ status: "fail", message: "Missing required withdrawal fields" });
    }

    const amtNum = Number(amount);
    if (!isFinite(amtNum) || amtNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid amount" });
    }

    // 3) fetch user document
    const userRef = dbAdmin.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    const userData = userSnap.data();

    // 4) pin check
    if (!userData.pin) {
      return res.status(400).json({ status: "fail", message: "Set payment pin first" });
    }
    if (String(userData.pin) !== String(pin)) {
      return res.status(400).json({ status: "fail", message: "Invalid PIN" });
    }

    // 5) balance check
    const balance = Number(userData.balance) || 0;
    if (amtNum > balance) {
      return res.status(400).json({ status: "fail", message: "Insufficient balance" });
    }

    // 6) create recipient
    const recipient = await axios.post("https://api.paystack.co/transferrecipient", {
      type: "nuban",
      name: account_name,
      account_number: accNum,
      bank_code: bankCode,
      currency: "NGN"
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    if (!recipient.data || !recipient.data.status) {
      console.error('recipient creation failed', recipient.data || {});
      return res.status(400).json({ status: "fail", message: "Recipient creation failed", detail: recipient.data || null });
    }

    const recipient_code = recipient.data.data.recipient_code;

    // 7) initiate transfer (kobo)
    const transfer = await axios.post("https://api.paystack.co/transfer", {
      source: "balance",
      reason: "User Withdrawal",
      amount: Math.round(amtNum * 100),
      recipient: recipient_code
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    if (transfer.data && transfer.data.status) {
      // 8) deduct balance (safe update)
      await userRef.update({
        balance: balance - amtNum
      });
      return res.json({ status: "success", message: "Transfer initiated" });
    } else {
      console.error('transfer failed', transfer.data || {});
      return res.status(400).json({ status: "fail", message: transfer.data?.message || "Transfer failed", detail: transfer.data || null });
    }

  } catch (err) {
    console.error('request-withdrawal error', err.response?.data || err.message || err);
    return res.status(500).json({ status: "fail", message: "Server error during withdrawal", detail: err.response?.data || err.message || null });
  }
});

/* =======================
   DEPOSIT - verify payment
   ======================= */
app.post("/api/verify-payment", async (req, res) => {
  try {
    // verify token from header first (deposit flow expects idToken in header)
    let decoded;
    try {
      decoded = await verifyIdTokenFromHeader(req);
    } catch (tokenErr) {
      return res.status(401).json({ status: "fail", message: tokenErr.message });
    }
    const uid = decoded.uid;

    const { reference, amount } = req.body;
    const amountNum = Number(amount);
    if (!reference || !isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid reference or amount" });
    }

    // Check Paystack transaction
    const verifyResp = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const paymentData = verifyResp.data?.data;
    if (!paymentData || paymentData.status !== "success") {
      return res.status(400).json({ status: "fail", message: "Payment not successful", detail: paymentData || null });
    }

    // compute paid amount in naira
    const paidNaira = Number(paymentData.amount) / 100;

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

      // create/merge user doc and set balance
      tx.set(userRef, { balance: newBalance }, { merge: true });
    });

    return res.json({ status: "success" });
  } catch (err) {
    console.error("verify-payment error:", err.response?.data || err.message || err);
    return res.status(500).json({ status: "fail", message: "Server error verifying payment", detail: err.response?.data || err.message || null });
  }
});

/* =======================
   Webhook (optional)
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

    const event = req.body;
    // optionally handle charge.success / transaction.success for redundancy
    // (you could reuse verify logic above)
    return res.status(200).send('ok');
  } catch (err) {
    console.error('webhook error:', err.response?.data || err.message || err);
    return res.status(500).send('server error');
  }
});

/* Catch-all route */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* Start server */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
