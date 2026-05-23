const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const redisClient = require('../config/redis');

const RESERVATION_DURATION = 15 * 60 * 1000; // 15 minutes

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Filter out expired reservations
    const now = new Date();
    cart.items = cart.items.filter(item => new Date(item.reservedUntil) > now);
    await cart.save();

    res.status(200).json({
      success: true,
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check available stock (actual stock - reserved stock)
    const availableStock = product.stock - product.reservedStock;
    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items available for reservation`
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    const reservedUntil = new Date(Date.now() + RESERVATION_DURATION);

    if (existingItemIndex > -1) {
      // Update existing item
      const currentQuantity = cart.items[existingItemIndex].quantity;
      const newQuantity = currentQuantity + quantity;

      if (availableStock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available for reservation`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].reservedUntil = reservedUntil;
      cart.items[existingItemIndex].price = product.price;
      cart.items[existingItemIndex].name = product.name;
      cart.items[existingItemIndex].image = product.images[0]?.url || null;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        reservedUntil,
        price: product.price,
        name: product.name,
        image: product.images[0]?.url || null
      });
    }

    // Update product reserved stock
    product.reservedStock += quantity;
    await product.save();

    await cart.save();

    // Store reservation in Redis for quick access (ioredis syntax)
    await redisClient.set(
      `reservation:${cart._id}:${productId}`,
      JSON.stringify({ quantity, reservedUntil }),
      'EX',
      Math.floor(RESERVATION_DURATION / 1000)
    );

    res.status(200).json({
      success: true,
      message: 'Item added to cart with reservation',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const item = cart.items[itemIndex];
    const product = await Product.findById(item.product);

    const oldQuantity = item.quantity;
    const quantityDiff = quantity - oldQuantity;
    const availableStock = product.stock - product.reservedStock + oldQuantity;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items available`
      });
    }

    // Update item
    item.quantity = quantity;
    item.reservedUntil = new Date(Date.now() + RESERVATION_DURATION);

    // Update product reserved stock
    product.reservedStock += quantityDiff;
    await product.save();

    await cart.save();

    // Update Redis reservation (ioredis syntax)
    await redisClient.set(
      `reservation:${cart._id}:${item.product}`,
      JSON.stringify({ quantity, reservedUntil: item.reservedUntil }),
      'EX',
      Math.floor(RESERVATION_DURATION / 1000)
    );

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const item = cart.items[itemIndex];

    // Release reserved stock
    const product = await Product.findById(item.product);
    if (product) {
      product.reservedStock = Math.max(0, product.reservedStock - item.quantity);
      await product.save();
    }

    // Remove from Redis
    await redisClient.del(`reservation:${cart._id}:${item.product}`);

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiry: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate cart total
    const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cartTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ${coupon.minPurchaseAmount} required`
      });
    }

    // Calculate discount
    let discountAmount;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    cart.couponCode = coupon.code;
    cart.totalAfterDiscount = Math.max(0, cartTotal - discountAmount);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        cart,
        discount: discountAmount,
        originalTotal: cartTotal
      }
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Release all reserved stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.reservedStock = Math.max(0, product.reservedStock - item.quantity);
        await product.save();
      }
      await redisClient.del(`reservation:${cart._id}:${item.product}`);
    }

    cart.items = [];
    cart.couponCode = null;
    cart.totalAfterDiscount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  clearCart
};
