// server.js (updated with fixes)
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
  try {
    const verify = await axios.get("https://api.paystack.co/bank/resolve", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      params: { account_number: accNum, bank_code: bankCode }
    });

    if (verify.data.status) {
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
   WITHDRAWAL (with PIN)
   ======================= */
app.post("/api/initiate-transfer", async (req, res) => {
  const { accNum, bankCode, account_name, amount, uid, pin } = req.body;

  try {
    // 1. Check PIN
    const userRef = dbAdmin.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(400).json({ status: "fail", message: "User not found" });
    }

    const userData = userSnap.data();
    if (!userData.pin) {
      return res.status(400).json({ status: "fail", message: "Set payment pin first" });
    }
    if (String(userData.pin) !== String(pin)) {
      return res.status(400).json({ status: "fail", message: "Invalid PIN" });
    }

    const balance = Number(userData.balance) || 0;
    if (amount > balance) {
      return res.status(400).json({ status: "fail", message: "Insufficient balance" });
    }

    // 2. Create recipient
    const recipient = await axios.post("https://api.paystack.co/transferrecipient", {
      type: "nuban",
      name: account_name,
      account_number: accNum,
      bank_code: bankCode,
      currency: "NGN"
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    if (!recipient.data.status) {
      return res.json({ status: "fail", message: "Recipient creation failed" });
    }

    const recipient_code = recipient.data.data.recipient_code;

    // 3. Initiate transfer
    const transfer = await axios.post("https://api.paystack.co/transfer", {
      source: "balance",
      reason: "User Withdrawal",
      amount: Math.round(Number(amount) * 100),
      recipient: recipient_code
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    if (transfer.data.status) {
      // Deduct balance
      await userRef.update({
        balance: balance - amount
      });
      res.json({ status: "success" });
    } else {
      res.json({ status: "fail", message: transfer.data.message });
    }

  } catch (err) {
    console.error('initiate-transfer error', err.response?.data || err.message || err);
    res.status(500).json({ status: "fail", error: "Transfer failed" });
  }
});

/* =======================
   DEPOSIT - verify payment
   ======================= */
app.post("/api/verify-payment", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : (req.body.idToken || null);

    if (!idToken) return res.status(401).json({ status: "fail", message: "Missing ID token" });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('verify-idToken failed', err.message);
      return res.status(401).json({ status: "fail", message: "Invalid ID token" });
    }
    const uid = decoded.uid;

    const { reference, amount } = req.body;
    const amountNum = Number(amount);
    if (!reference || !isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid reference or amount" });
    }

    const verifyResp = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const paymentData = verifyResp.data?.data;
    if (!paymentData || paymentData.status !== "success") {
      return res.status(400).json({ status: "fail", message: "Payment not successful" });
    }

    const paidNaira = paymentData.amount / 100;
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
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      tx.update(userRef, { balance: newBalance });
    });

    return res.json({ status: "success" });
  } catch (err) {
    console.error("verify-payment error:", err.response?.data || err.message || err);
    return res.status(500).json({ status: "fail", message: "Server error verifying payment" });
  }
});

/* =======================
   Webhook
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
    if (event && (event.event === 'charge.success' || event.event === 'transaction.success')) {
      const incoming = event.data;
      // same transaction verify & balance update logic as above...
    }

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
