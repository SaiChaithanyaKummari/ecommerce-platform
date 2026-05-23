const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { generateAccessToken } = require('../utils/jwt');

describe('Cart API', () => {
  let user, product, token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});

    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer'
    });

    // Create test product
    product = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      price: 99.99,
      stock: 50,
      category: 'electronics',
      seller: user._id,
      images: [{ url: 'http://example.com/image.jpg', public_id: 'test_id' }]
    });

    token = generateAccessToken(user._id);
  });

  describe('POST /api/cart - Add to cart with reservation', () => {
    it('should add item to cart and reserve inventory', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id, quantity: 2 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);

      // Check inventory reservation
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.reservedStock).toBe(2);
    });

    it('should reject adding item if insufficient stock', async () => {
      product.stock = 1;
      await product.save();

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id, quantity: 5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('available');
    });

    it('should update quantity if item already exists in cart', async () => {
      // Add item first
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id, quantity: 1 });

      // Update quantity
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id, quantity: 3 })
        .expect(200);

      expect(response.body.data.cart.items[0].quantity).toBe(3);
    });
  });

  describe('PUT /api/cart/:itemId - Update cart item', () => {
    it('should update item quantity and adjust reservation', async () => {
      // Add item first
      const cart = await Cart.create({
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
          price: product.price,
          name: product.name
        }]
      });

      product.reservedStock = 2;
      await product.save();

      const itemId = cart.items[0]._id;

      const response = await request(app)
        .put(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.data.cart.items[0].quantity).toBe(5);

      // Check inventory reservation updated
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.reservedStock).toBe(5);
    });
  });

  describe('DELETE /api/cart/:itemId - Remove from cart', () => {
    it('should remove item and release inventory reservation', async () => {
      // Add item first
      const cart = await Cart.create({
        user: user._id,
        items: [{
          product: product._id,
          quantity: 3,
          reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
          price: product.price,
          name: product.name
        }]
      });

      product.reservedStock = 3;
      await product.save();

      const itemId = cart.items[0]._id;

      const response = await request(app)
        .delete(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);

      // Check inventory reservation released
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.reservedStock).toBe(0);
    });
  });
});
