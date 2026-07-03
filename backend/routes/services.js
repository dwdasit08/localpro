const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const User = require('../models/User');
const auth = require('../middleware/auth'); // we'll define middleware below

// Helper: Haversine distance (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// GET services with filter by pincode, category, and lat/lng for distance
router.get('/', async (req, res) => {
  try {
    const { pincode, category, lat, lng } = req.query;
    let filter = {};
    if (pincode) filter.pincode = pincode;
    if (category) filter.category = category;
    // Also filter only available services? We'll include availability: true by default
    filter.availability = true;

    let services = await Service.find(filter).populate('sellerId', 'name rating totalReviews profilePhoto');
    // If lat/lng provided, compute distance and attach
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      services = services.map(service => {
        const dist = haversine(userLat, userLng, service.lat, service.lng);
        return { ...service._doc, distance: dist };
      });
    } else {
      services = services.map(s => ({ ...s._doc, distance: null }));
    }
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /add - protected (seller only)
router.post('/add', auth, async (req, res) => {
  try {
    const { category, price, availability, lat, lng, pincode, description } = req.body;
    // Ensure user is seller
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Only sellers can add services.' });
    }
    const newService = new Service({
      sellerId: req.userId,
      category,
      price,
      availability: availability !== undefined ? availability : true,
      lat,
      lng,
      pincode,
      description
    });
    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /seller/:sellerId - get services by seller (for dashboard)
router.get('/seller/:sellerId', auth, async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    // Ensure the requesting user is the same seller (or admin)
    if (req.userId !== sellerId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const services = await Service.find({ sellerId });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;