const express = require('express');
const router = express.Router();

// Simulate payment (UPI/Card)
router.post('/simulate', (req, res) => {
  const { amount, method, otp } = req.body;
  // For demo, any OTP '1234' works, or just accept
  if (method === 'UPI' || method === 'Card') {
    if (otp !== '1234') {
      return res.status(400).json({ message: 'Invalid OTP. Use 1234 for demo.' });
    }
  }
  // Generate fake transaction ID
  const txnId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  res.json({ success: true, transactionId: txnId, message: 'Payment successful' });
});

module.exports = router;