// server.js (updated)
// Requires: process.env.PAYSTACK_SECRET, GOOGLE_SERVICE_ACCOUNT_JSON or Firebase configured env
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');

const app = express();

// Capture raw body for webhook signature verification while still parsing JSON
app.use(cors());
// IMPORTANT: capture raw body buffer for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
if (!PAYSTACK_SECRET) {
  console.warn('PAYSTACK_SECRET not set in environment!');
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
   PAYSTACK WITHDRAWAL
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

app.post("/api/initiate-transfer", async (req, res) => {
  const { accNum, bankCode, account_name, amount } = req.body;

  try {
    const recipient = await axios.post("https://api.paystack.co/transferrecipient", {
      type: "nuban",
      name: account_name,
      account_number: accNum,
      bank_code: bankCode,
      currency: "NGN"
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    if (!recipient.data.status) {
      return res.json({ status: "fail", message: "Recipient creation failed" });
    }

    const recipient_code = recipient.data.data.recipient_code;

    const transfer = await axios.post("https://api.paystack.co/transfer", {
      source: "balance",
      reason: "User Withdrawal",
      amount: Math.round(Number(amount) * 100),
      recipient: recipient_code
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    if (transfer.data.status) {
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
   PAYSTACK DEPOSIT - verify-payment (client -> server)
   ======================= */
app.post("/api/verify-payment", async (req, res) => {
  try {
    // 1) Authenticate user with Firebase ID token (passed in Authorization header)
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : (req.body.idToken || null);

    if (!idToken) return res.status(401).json({ status: "fail", message: "Missing ID token" });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('verify-idToken failed', err && err.message ? err.message : err);
      return res.status(401).json({ status: "fail", message: "Invalid ID token" });
    }
    const uid = decoded.uid;

    // 2) Validate request body
    const { reference, amount } = req.body;
    const amountNum = Number(amount);
    if (!reference || !isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid reference or amount" });
    }

    // 3) Verify transaction with Paystack
    const verifyResp = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const paymentData = verifyResp.data?.data;
    if (!paymentData || paymentData.status !== "success") {
      return res.status(400).json({ status: "fail", message: "Payment not successful" });
    }

    // NEW: verify Paystack transaction email matches the authenticated token email (if available)
    const payEmail = (paymentData.customer?.email || '').toLowerCase();
    const tokenEmail = (decoded.email || '').toLowerCase();
    if (tokenEmail && payEmail && payEmail !== tokenEmail) {
      console.warn('Email mismatch — token:', tokenEmail, 'paystack:', payEmail);
      return res.status(400).json({ status: "fail", message: "Payment email does not match authenticated user" });
    }

    const paidNaira = paymentData.amount / 100;
    if (Math.abs(paidNaira - amountNum) > 0.01) {
      return res.status(400).json({ status: "fail", message: "Amount mismatch" });
    }
    if ((paymentData.currency || "").toUpperCase() !== "NGN") {
      return res.status(400).json({ status: "fail", message: "Invalid currency" });
    }

    // 4) Firestore transaction (prevent double-credit)
    const paymentDocRef = dbAdmin.collection("payments").doc(reference);
    await dbAdmin.runTransaction(async (tx) => {
      const pSnap = await tx.get(paymentDocRef);
      if (pSnap.exists) return;

      const userRef = dbAdmin.collection("users").doc(uid);
      const userSnap = await tx.get(userRef);

      let currentBalance = 0;
      if (userSnap.exists) {
        const cur = userSnap.data().balance;
        currentBalance = (typeof cur === "number" && isFinite(cur)) ? cur : Number(cur) || 0;
      } else {
        tx.set(userRef, { balance: 0 }, { merge: true });
      }

      const newBalance = currentBalance + amountNum;

      tx.set(paymentDocRef, {
        reference,
        uid,
        amount: amountNum,
        status: "verified",
        paystack: paymentData,
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
   Optional: initialize transaction server-side (recommended)
   Client can call this to get an authorization_url (server should verify ID token)
   ======================= */
app.post('/api/init-transaction', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;
    if (!idToken) return res.status(401).json({ status: 'fail', message: 'Missing ID token' });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ status: 'fail', message: 'Invalid ID token' });
    }

    const { amount } = req.body;
    const amtNum = Number(amount);
    if (!isFinite(amtNum) || amtNum <= 0) return res.status(400).json({ status: 'fail', message: 'Invalid amount' });

    const initResp = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: decoded.email,
      amount: Math.round(amtNum * 100),
      metadata: { uid: decoded.uid }
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' }
    });

    return res.json(initResp.data);
  } catch (err) {
    console.error('init-transaction error:', err.response?.data || err.message || err);
    return res.status(500).json({ status: 'fail', message: 'Could not initialize transaction' });
  }
});

/* =======================
   Webhook: Paystack event handler (verifies signature)
   Register this URL in Paystack dashboard: https://YOURDOMAIN/webhook/paystack
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
    // Only interested in successful charges
    if (event && (event.event === 'charge.success' || event.event === 'transaction.success' || event.event === 'payment.success')) {
      const incoming = event.data; // transaction object
      // Double-check via Paystack verify endpoint (defensive)
      const verifyResp = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(incoming.reference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      });

      const payData = verifyResp.data?.data;
      if (!payData || payData.status !== 'success') {
        console.warn('Webhook: transaction verify failed for', incoming.reference);
        return res.status(400).send('Transaction not successful');
      }

      // try to determine uid (preferred: metadata.uid)
      let uid = payData.metadata?.uid || null;

      // fallback: try to find user by email if no uid
      if (!uid && payData.customer?.email) {
        const email = (payData.customer.email || '').toLowerCase();
        const q = await dbAdmin.collection('users').where('email', '==', email).limit(1).get();
        if (!q.empty) uid = q.docs[0].id;
      }

      // If we found a uid, credit the user (idempotent via payments collection)
      if (uid) {
        const reference = payData.reference;
        const paidNaira = payData.amount / 100;

        const paymentDocRef = dbAdmin.collection('payments').doc(reference);
        await dbAdmin.runTransaction(async (tx) => {
          const pSnap = await tx.get(paymentDocRef);
          if (pSnap.exists) return;

          const userRef = dbAdmin.collection('users').doc(uid);
          const userSnap = await tx.get(userRef);

          let currentBalance = 0;
          if (userSnap.exists) {
            const cur = userSnap.data().balance;
            currentBalance = (typeof cur === "number" && isFinite(cur)) ? cur : Number(cur) || 0;
          } else {
            tx.set(userRef, { balance: 0 }, { merge: true });
          }

          const newBalance = currentBalance + paidNaira;

          tx.set(paymentDocRef, {
            reference,
            uid,
            amount: paidNaira,
            status: "verified",
            paystack: payData,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          tx.update(userRef, { balance: newBalance });
        });

        // Respond OK to Paystack
        return res.status(200).send('ok');
      } else {
        // No uid mapping — store the webhook event for manual reconciliation
        console.warn('Webhook: could not map transaction to user (no uid, no email match). reference:', payData.reference);
        // Optionally save to a collection for manual processing
        await dbAdmin.collection('paystack_unmapped').doc(payData.reference).set({
          payData,
          receivedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(200).send('ok');
      }
    }

    // For other events, just acknowledge
    return res.status(200).send('ok');
  } catch (err) {
    console.error('webhook error:', err.response?.data || err.message || err);
    return res.status(500).send('server error');
  }
});







/* =======================
   Airtime Purchase (ClubKonnect)
   ======================= */
app.post('/purchase-airtime', async (req, res) => {
  const { network, phone, amount, pin, userId } = req.body;

  if (!network || !phone || !amount || !pin || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userRef = dbAdmin.collection('users').doc(userId); // dynamic userId
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = doc.data();

    // ✅ Check if PIN matches
    if (pin !== userData.pin) {
      return res.status(403).json({ error: 'Invalid PIN' });
    }

    const userBalance = userData.balance;

    if (amount > userBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const requestId = 'TX' + Math.floor(Math.random() * 1000000);
    const callbackUrl = 'https://yourdomain.com/callback';

    // Call ClubKonnect API
    const response = await axios.get('https://www.nellobytesystems.com/APIAirtimeV1.asp', {
      params: {
        UserID: process.env.USER_ID,
        APIKey: process.env.API_KEY,
        MobileNetwork: network,
        Amount: amount,
        MobileNumber: phone,
        RequestID: requestId,
        CallBackURL: callbackUrl
      }
    });

    if (response.data.Status === 'Success') {
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(-amount)
      });
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Airtime purchase failed' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




// Get user balance
app.get('/get-balance', async (req, res) => {
try {
const userId = req.query.userId;
if (!userId) return res.status(400).json({ error: 'Missing userId' });

const userRef = dbAdmin.collection('users').doc(userId);  
const doc = await userRef.get();  
if (!doc.exists) return res.status(404).json({ error: 'User not found' });  

const balance = doc.data().balance || 0;  
res.json({ balance });

} catch (err) {
console.error(err);
res.status(500).json({ error: 'Internal server error' });
}
});





  




/* Catch-all route (serve dashboard) */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* Start server */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


