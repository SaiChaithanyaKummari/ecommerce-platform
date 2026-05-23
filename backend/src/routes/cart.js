const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  clearCart
} = require('../controllers/cart');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);

router.post('/', protect, [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], addToCart);

router.put('/:itemId', protect, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], updateCartItem);

router.delete('/:itemId', protect, removeCartItem);

router.post('/apply-coupon', protect, [
  body('code').trim().notEmpty().withMessage('Coupon code is required')
], applyCoupon);

router.delete('/clear', protect, clearCart);

module.exports = router;
