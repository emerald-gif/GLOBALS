const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/api/get-banks", async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

app.post("/api/verify-account", async (req, res) => {
  const { account_number, bank_code } = req.body;

  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to verify account" });
  }
});

app.post("/api/initiate-transfer", async (req, res) => {
  const { amount, recipient_code } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount,
        recipient: recipient_code,
        reason: "Payment from Globals"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate transfer" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});