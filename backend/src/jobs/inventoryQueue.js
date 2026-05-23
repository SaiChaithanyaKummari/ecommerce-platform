const Queue = require('bull');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const redisClient = require('../config/redis');
const emailQueue = require('./emailQueue');

const inventoryQueue = new Queue('inventory', process.env.REDIS_URL || 'redis://localhost:6379', {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
});

// Release expired reservations
inventoryQueue.process('release-expired-reservations', async (job) => {
  try {
    const now = new Date();
    
    // Find all carts with expired reservations
    const carts = await Cart.find({
      'items.reservedUntil': { $lte: now }
    });

    for (const cart of carts) {
      for (const item of cart.items) {
        if (new Date(item.reservedUntil) <= now) {
          // Release reserved stock
          const product = await Product.findById(item.product);
          if (product) {
            product.reservedStock = Math.max(0, product.reservedStock - item.quantity);
            await product.save();
          }
          
          // Remove from Redis
          await redisClient.del(`reservation:${cart._id}:${item.product}`);
        }
      }

      // Remove expired items from cart
      cart.items = cart.items.filter(
        item => new Date(item.reservedUntil) > now
      );
      await cart.save();
    }

    console.log(`Released expired reservations for ${carts.length} carts`);
  } catch (error) {
    console.error('Error releasing expired reservations:', error);
    throw error;
  }
});

// Check for low stock and send alerts
inventoryQueue.process('check-low-stock', async (job) => {
  try {
    const products = await Product.find({ stock: { $lt: 10 } }).populate('seller');
    
    for (const product of products) {
      if (product.seller && product.seller.email) {
        await emailQueue.add('send-low-stock-alert', {
          productName: product.name,
          currentStock: product.stock,
          sellerEmail: product.seller.email
        });
      }
    }

    console.log(`Checked low stock for ${products.length} products`);
  } catch (error) {
    console.error('Error checking low stock:', error);
    throw error;
  }
});

inventoryQueue.on('completed', (job) => {
  console.log(`Inventory job completed: ${job.name}`);
});

inventoryQueue.on('failed', (job, err) => {
  console.error(`Inventory job failed: ${job.name}`, err);
});

module.exports = inventoryQueue;
