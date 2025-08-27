require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (like dashboard.html, main.js, etc.)
app.use(express.static(path.join(__dirname, "public")));

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// ✅ Initialize Firebase Admin
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
   🔹 PAYSTACK WITHDRAWAL
   ======================= */
app.get("/api/get-banks", async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    res.json(response.data.data);
  } catch {
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
  } catch {
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
      amount: amount * 100,
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

  } catch {
    res.status(500).json({ status: "fail", error: "Transfer failed" });
  }
});



/* =======================
   🔹 PAYSTACK DEPOSIT
   ======================= */
app.post("/api/verify-payment", async (req, res) => {
  try {
    // 1) Authenticate user with Firebase ID token
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : (req.body.idToken || null);
    if (!idToken) return res.status(401).json({ status: "fail", message: "Missing ID token" });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ status: "fail", message: "Invalid ID token" });
    }
    const uid = decoded.uid;

    // 2) Validate request
    const { reference, amount } = req.body;
    const amountNum = Number(amount);
    if (!reference || !isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ status: "fail", message: "Invalid reference or amount" });
    }

    // 3) Verify with Paystack
    const verifyResp = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      }
    );

    const paymentData = verifyResp.data?.data;
    if (!paymentData || paymentData.status !== "success") {
      return res.status(400).json({ status: "fail", message: "Payment not successful" });
    }

    // === NEW CHECK: make sure the Paystack transaction email matches the authenticated user's email ===
    const payEmail = (paymentData.customer?.email || '').toLowerCase();
    const tokenEmail = (decoded.email || '').toLowerCase();
    if (tokenEmail && payEmail && payEmail !== tokenEmail) {
      console.warn('Email mismatch — token:', tokenEmail, 'paystack:', payEmail);
      return res.status(400).json({ status: "fail", message: "Payment email does not match authenticated user" });
    }
    // ====================================================================================================

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
   🔹 CATCH ALL ROUTES
   ======================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* =======================
   🔹 START SERVER
   ======================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`)); 

