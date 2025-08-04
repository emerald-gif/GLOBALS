// vtpassController.js
const axios = require('axios');

const VT_API_KEY = 'e8c868ace9f6f29f2f43d0dd687f26a1';
const VT_SECRET_KEY = 'SK_754070d823fdf57fd4ece1b6267148b3d20eab38af2';
const VT_PUBLIC_KEY = 'PK_755e1b6d4b062cbec98d0af4d08d84d74c62f334d69';

exports.purchaseAirtime = async (req, res) => {
  const { phone, amount, serviceID } = req.body;

  try {
    const response = await axios.post('https://sandbox.vtpass.com/api/pay', {
      request_id: `airtime_${Date.now()}`,
      serviceID,
      amount,
      phone
    }, {
      headers: {
        'api-key': VT_API_KEY,
        'secret-key': VT_SECRET_KEY,
        'public-key': VT_PUBLIC_KEY,
        'Content-Type': 'application/json'
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'VTpass airtime error' });
  }
};

exports.getDataPackages = async (req, res) => {
  const { serviceID } = req.query;

  try {
    const response = await axios.get(`https://sandbox.vtpass.com/api/service-variations?serviceID=${serviceID}`, {
      headers: {
        'api-key': VT_API_KEY,
        'secret-key': VT_SECRET_KEY,
        'public-key': VT_PUBLIC_KEY
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get data variations' });
  }
};
