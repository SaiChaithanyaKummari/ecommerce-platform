const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllProducts,
  adminDeleteProduct,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon
} = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);

router.get('/orders', protect, authorize('admin'), getAllOrders);

router.put('/orders/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status')
], updateOrderStatus);

router.get('/users', protect, authorize('admin'), getAllUsers);

router.put('/users/:id', protect, authorize('admin'), [
  body('role').optional().isIn(['customer', 'seller', 'admin']).withMessage('Invalid role')
], updateUserRole);

router.put('/users/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

router.get('/products', protect, authorize('admin'), getAllProducts);

router.delete('/products/:id', protect, authorize('admin'), adminDeleteProduct);

router.post('/coupons', protect, authorize('admin'), [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isNumeric().withMessage('Discount value must be a number'),
  body('expiry').isISO8601().withMessage('Invalid expiry date'),
  body('usageLimit').isInt({ min: 1 }).withMessage('Usage limit must be at least 1')
], createCoupon);

router.get('/coupons', protect, authorize('admin'), getAllCoupons);

router.put('/coupons/:id', protect, authorize('admin'), updateCoupon);

router.delete('/coupons/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
