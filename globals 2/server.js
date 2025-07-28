// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (like dashboard.html, main.js, etc.)
app.use(express.static(path.join(__dirname, "public"))); // <-- put all frontend files in a folder called "public"

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// ========== PAYSTACK ENDPOINTS ==========

// GET list of banks
app.get("/api/get-banks", async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

// POST verify bank account
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
    res.status(500).json({ status: "fail", error: "Account verification failed" });
  }
});

// POST initiate transfer
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

  } catch (err) {
    res.status(500).json({ status: "fail", error: "Transfer failed" });
  }
});

// ========== CATCH ALL ROUTES ==========
// For preventing "Cannot GET /dashboard.html"
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
