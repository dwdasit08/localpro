const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create booking (customer can be guest or authenticated; we'll create customer user)
router.post('/create', async (req, res) => {
  try {
    const { serviceId, date, time, paymentMethod, isCOD, customerName, customerPhone, customerPincode, customerEmail } = req.body;
    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    // Find or create customer user
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      // Create a customer user with a random password
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(customerPhone + 'defaultpass', salt); // just a placeholder
      customer = new User({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        password: hashedPassword,
        role: 'customer',
        pincode: customerPincode
      });
      await customer.save();
    }
    // Create booking
    const booking = new Booking({
      customerId: customer._id,
      sellerId: service.sellerId,
      serviceId: service._id,
      date,
      time,
      status: 'Pending',
      paymentMethod,
      amount: service.price,
      isCOD: isCOD || false,
      customerName,
      customerPhone,
      customerPincode
    });
    await booking.save();
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for a seller (protected)
router.get('/seller', auth, async (req, res) => {
  try {
    const sellerId = req.userId;
    // Ensure user is seller
    const user = await User.findById(sellerId);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const bookings = await Booking.find({ sellerId }).populate('customerId', 'name phone').populate('serviceId', 'category price');
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for a customer (by customer email/phone or by customerId)
// We'll allow fetching by customer phone or email via query
router.get('/customer', async (req, res) => {
  try {
    const { phone, email } = req.query;
    let customer = null;
    if (email) {
      customer = await User.findOne({ email });
    } else if (phone) {
      customer = await User.findOne({ phone });
    }
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const bookings = await Booking.find({ customerId: customer._id }).populate('sellerId', 'name').populate('serviceId', 'category price');
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (accept/reject) - seller only
router.patch('/:bookingId/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected' or 'Completed'
    const bookingId = req.params.bookingId;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    // Check if seller owns this booking
    if (booking.sellerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    booking.status = status;
    await booking.save();
    res.json({ message: 'Booking updated', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;