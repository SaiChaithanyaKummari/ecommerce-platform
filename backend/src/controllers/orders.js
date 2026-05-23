const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailQueue = require('../jobs/emailQueue');
const redisClient = require('../config/redis');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { idempotencyKey } = req.body;

    // Check for existing order with same idempotency key
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already exists for this request',
        data: { order: existingOrder }
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate reservations
    const now = new Date();
    const expiredItems = cart.items.filter(
      item => new Date(item.reservedUntil) <= now
    );

    if (expiredItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some items in your cart have expired reservations',
        data: { expiredItems: expiredItems.map(i => i.name) }
      });
    }

    // Calculate total
    const totalAmount = cart.totalAfterDiscount || cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user.id.toString(),
        cartId: cart._id.toString(),
        idempotencyKey: idempotencyKey || ''
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, idempotencyKey, shippingAddress } = req.body;

    // Check for existing order with same idempotency key
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already processed',
        data: { order: existingOrder }
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate reservations
    const now = new Date();
    const expiredItems = cart.items.filter(
      item => new Date(item.reservedUntil) <= now
    );

    if (expiredItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some items in your cart have expired reservations',
        data: { expiredItems: expiredItems.map(i => i.name) }
      });
    }

    // Start MongoDB transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Create order
      const order = await Order.create([{
        user: req.user.id,
        items: cart.items.map(item => ({
          product: item.product._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: cart.totalAfterDiscount || cart.items.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        ),
        shippingAddress,
        paymentMethod: 'stripe',
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString()
        },
        couponApplied: cart.couponCode ? {
          code: cart.couponCode,
          discountAmount: cart.items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
          ) - cart.totalAfterDiscount
        } : undefined,
        orderStatus: 'paid',
        idempotencyKey,
        paidAt: new Date()
      }], { session });

      // Update product stock
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          {
            $inc: {
              stock: -item.quantity,
              reservedStock: -item.quantity
            }
          },
          { session }
        );
      }

      // Update coupon usage if applied
      if (cart.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: cart.couponCode },
          { $inc: { usedCount: 1 } },
          { session }
        );
      }

      // Clear cart
      await Cart.findByIdAndUpdate(
        cart._id,
        { items: [], couponCode: null, totalAfterDiscount: 0 },
        { session }
      );

      // Clear Redis reservations
      for (const item of cart.items) {
        await redisClient.del(`reservation:${cart._id}:${item.product._id}`);
      }

      await session.commitTransaction();
      session.endSession();

      // Send order confirmation email (async)
      await emailQueue.add('send-order-confirmation', {
        email: req.user.email,
        name: req.user.name,
        orderId: order[0]._id,
        totalAmount: order[0].totalAmount
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: order[0] }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.status(200).json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Can only cancel pending or paid orders
    if (!['pending', 'paid'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Start transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      // Update order status
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Webhook signature verification failed' });
    }

    // Handle webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Payment already verified by client, just log
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        // Could send notification to user
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  stripeWebhook
};
