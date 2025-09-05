const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');

// ✅ Load Firebase service account from Render env variable
if (!process.env.FIREBASE_CONFIG) {
  console.error("❌ Missing FIREBASE_CONFIG environment variable");
  process.exit(1);
}
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const dbAdmin = admin.firestore();
const app = express();
app.use(bodyParser.json());

// ✅ Network mapping
const networkMap = {
  "01": "MTN",
  "02": "GLO",
  "04": "Airtel",
  "03": "9mobile"
};

// Airtime purchase
app.post('/purchase-airtime', async (req, res) => {
  const { network, phone, amount, pin, userId } = req.body;

  if (!network || !phone || !amount || !pin || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userRef = dbAdmin.collection('users').doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });

    const userData = doc.data();
    const userBalance = userData.balance || 0;

    // ✅ PIN check
    if (pin !== userData.pin) {
      return res.status(403).json({ error: 'Invalid PIN' });
    }

    // ✅ Balance check
    if (Number(amount) > Number(userBalance)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // ✅ Map network
    const mappedNetwork = networkMap[network];
    if (!mappedNetwork) {
      return res.status(400).json({ error: 'Invalid network' });
    }

    // ✅ Call ClubKonnect API
    const apiUrl = "https://www.nellobytesystems.com/APIAirtimeV1.asp";
    const response = await axios.post(apiUrl, null, {
      params: {
        UserID: process.env.CLUBKONNECT_USERID,
        APIKey: process.env.CLUBKONNECT_APIKEY,
        MobileNetwork: mappedNetwork,
        Amount: amount,
        MobileNumber: phone,
        RequestID: Date.now().toString()
      }
    });

    if (response.data && response.data.status === "ORDER_RECEIVED") {
      // ✅ Deduct balance
      await userRef.update({
        balance: userBalance - Number(amount)
      });

      return res.json({
        success: true,
        message: "Airtime purchase successful",
        newBalance: userBalance - Number(amount)
      });
    } else {
      return res.status(400).json({
        error: "Airtime purchase failed",
        details: response.data
      });
    }

  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Fetch user balance
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
    console.error("❌ Balance fetch error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
