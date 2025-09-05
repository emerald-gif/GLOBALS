const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

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
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = doc.data();

    // ✅ Check PIN
    if (pin !== userData.pin) {
      return res.status(403).json({ error: 'Invalid PIN' });
    }

    const userBalance = userData.balance || 0;
    if (amount > userBalance) {
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
        UserID: "YOUR_CLUBKONNECT_USERID",
        APIKey: "YOUR_CLUBKONNECT_APIKEY",
        MobileNetwork: mappedNetwork,
        Amount: amount,
        MobileNumber: phone,
        RequestID: Date.now().toString()
      }
    });

    if (response.data && response.data.status === "ORDER_RECEIVED") {
      // Deduct balance
      await userRef.update({
        balance: userBalance - amount
      });

      return res.json({ success: true, message: "Airtime purchase successful" });
    } else {
      return res.status(400).json({ error: "Airtime purchase failed", details: response.data });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Fetch balance
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

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
