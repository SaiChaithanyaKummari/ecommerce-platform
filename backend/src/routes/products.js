const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories
} = require('../controllers/products');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProducts);

router.get('/categories', getProductCategories);

router.get('/slug/:slug', getProductBySlug);

router.get('/:id', getProductById);

router.post('/', protect, authorize('admin', 'seller'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category').isIn(['electronics', 'clothing', 'books', 'home', 'sports', 'toys', 'other']).withMessage('Invalid category'),
  body('images').isArray().withMessage('Images must be an array')
], createProduct);

router.put('/:id', protect, authorize('admin', 'seller'), updateProduct);

router.delete('/:id', protect, authorize('admin', 'seller'), deleteProduct);

module.exports = router;
