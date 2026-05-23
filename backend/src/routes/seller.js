const express = require('express');
const router = express.Router();
const {
  getSellerDashboard,
  getSellerProducts,
  getSellerOrders,
  updateSellerProduct,
  deleteSellerProduct
} = require('../controllers/seller');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('seller'), getSellerDashboard);

router.get('/products', protect, authorize('seller'), getSellerProducts);

router.get('/orders', protect, authorize('seller'), getSellerOrders);

router.put('/products/:id', protect, authorize('seller'), updateSellerProduct);

router.delete('/products/:id', protect, authorize('seller'), deleteSellerProduct);

module.exports = router;
