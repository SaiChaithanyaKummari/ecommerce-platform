const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    reservedUntil: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    name: String,
    image: String
  }],
  couponCode: {
    type: String,
    default: null
  },
  totalAfterDiscount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
cartSchema.index({ 'items.reservedUntil': 1 });

module.exports = mongoose.model('Cart', cartSchema);
