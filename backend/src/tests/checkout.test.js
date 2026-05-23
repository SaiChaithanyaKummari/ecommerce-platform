const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { generateAccessToken } = require('../utils/jwt');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'succeeded'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded'
      })
    }
  }));
});

describe('Checkout & Order API', () => {
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
    await Order.deleteMany({});

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

  describe('POST /api/orders/checkout - Create payment intent', () => {
    it('should create payment intent with valid cart', async () => {
      // Create cart with items
      await Cart.create({
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
          price: product.price,
          name: product.name
        }]
      });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ idempotencyKey: 'test-key-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBeDefined();
      expect(response.body.data.paymentIntentId).toBeDefined();
    });

    it('should reject checkout with empty cart', async () => {
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ idempotencyKey: 'test-key-123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('empty');
    });
  });

  describe('POST /api/orders/verify-payment - Verify payment and create order', () => {
    it('should create order with valid payment', async () => {
      // Create cart with items
      await Cart.create({
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

      const response = await request(app)
        .post('/api/orders/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_test_123',
          idempotencyKey: 'test-key-123',
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.orderStatus).toBe('paid');
      expect(response.body.data.order.items).toHaveLength(1);

      // Check stock decreased
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(48);
      expect(updatedProduct.reservedStock).toBe(0);
    });

    it('should decrease actual stock and release reservation', async () => {
      // Create cart with items
      await Cart.create({
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

      await request(app)
        .post('/api/orders/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_test_123',
          idempotencyKey: 'test-key-456',
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        })
        .expect(201);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(47); // 50 - 3
      expect(updatedProduct.reservedStock).toBe(0); // Released
    });
  });
});
