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

describe('Idempotency Tests', () => {
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

  describe('Payment Idempotency', () => {
    it('should prevent duplicate charges with same idempotency key', async () => {
      const idempotencyKey = 'unique-key-123';

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

      // First request - should create order
      const firstResponse = await request(app)
        .post('/api/orders/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_test_123',
          idempotencyKey,
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        })
        .expect(201);

      expect(firstResponse.body.success).toBe(true);
      const firstOrderId = firstResponse.body.data.order._id;

      // Second request with same idempotency key - should return existing order
      const secondResponse = await request(app)
        .post('/api/orders/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_test_123',
          idempotencyKey,
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        })
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.message).toContain('already processed');
      expect(secondResponse.body.data.order._id).toBe(firstOrderId);

      // Verify only one order was created
      const orderCount = await Order.countDocuments({ idempotencyKey });
      expect(orderCount).toBe(1);
    });

    it('should allow different idempotency keys for different orders', async () => {
      // Create cart with items
      await Cart.create({
        user: user._id,
        items: [{
          product: product._id,
          quantity: 1,
          reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
          price: product.price,
          name: product.name
        }]
      });

      product.reservedStock = 1;
      await product.save();

      // First order
      await request(app)
        .post('/api/orders/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_test_123',
          idempotencyKey: 'key-1',
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        })
        .expect(201);

      // Recreate cart for second order
      await Cart.findOneAndUpdate(
        { user: user._id },
        {
          items: [{
            product: product._id,
            quantity: 1,
            reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
            price: product.price,
            name: product.name
          }]
        }
      );

      product.stock = 49;
      product.reservedStock = 1;
      await product.save();

      // Second order with different idempotency key
      await request(app)
        .post('/api/orders/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_test_456',
          idempotencyKey: 'key-2',
          shippingAddress: {
            street: '456 Oak St',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            country: 'USA'
          }
        })
        .expect(201);

      // Verify two orders were created
      const orderCount = await Order.countDocuments({ user: user._id });
      expect(orderCount).toBe(2);
    });

    it('should handle checkout idempotency correctly', async () => {
      const idempotencyKey = 'checkout-key-123';

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

      // First checkout request
      const firstResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ idempotencyKey })
        .expect(200);

      expect(firstResponse.body.success).toBe(true);

      // Create order with this idempotency key
      await Order.create({
        user: user._id,
        items: [{
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 2
        }],
        totalAmount: 199.98,
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'stripe',
        paymentResult: { id: 'pi_test_123', status: 'succeeded' },
        orderStatus: 'paid',
        idempotencyKey,
        paidAt: new Date()
      });

      // Second checkout request with same idempotency key
      const secondResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ idempotencyKey })
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.message).toContain('already exists');
    });
  });
});
