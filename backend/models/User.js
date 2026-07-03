const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  phone: { type: String, required: true },
  role: { type: String, enum: ['customer', 'seller'], default: 'customer' },
  pincode: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  address: { type: String },
  category: { type: String }, // for sellers: Electrician, Plumber, etc.
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  bio: { type: String }, // experience etc.
  profilePhoto: { type: String } // base64 or URL
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);