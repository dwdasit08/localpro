const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Completed', 'Cancelled', 'Rejected'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'COD'], required: true },
  amount: { type: Number, required: true },
  isCOD: { type: Boolean, default: false },
  transactionId: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerPincode: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);