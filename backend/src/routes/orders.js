const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPaymentIntent,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  stripeWebhook
} = require('../controllers/orders');
const { protect } = require('../middleware/auth');

router.post('/checkout', protect, [
  body('idempotencyKey').optional().isString().withMessage('Invalid idempotency key')
], createPaymentIntent);

router.post('/verify-payment', protect, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('idempotencyKey').notEmpty().withMessage('Idempotency key is required'),
  body('shippingAddress').isObject().withMessage('Shipping address is required')
], verifyPayment);

router.get('/my-orders', protect, getMyOrders);

router.get('/:id', protect, getOrderById);

router.put('/:id/cancel', protect, cancelOrder);

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
