const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const getSellerDashboard = async (req, res, next) => {
  try {
    // Check if user is an approved seller
    if (req.user.role !== 'seller' || !req.user.isSellerApproved) {
      return res.status(403).json({
        success: false,
        message: 'You are not an approved seller'
      });
    }

    // Get seller's products
    const totalProducts = await Product.countDocuments({ seller: req.user.id });
    const lowStockProducts = await Product.countDocuments({
      seller: req.user.id,
      stock: { $lt: 10 }
    });

    // Get orders containing seller's products
    const sellerProducts = await Product.find({ seller: req.user.id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIds }
    });

    // Calculate revenue from seller's products
    let totalRevenue = 0;
    let totalOrders = 0;
    const recentOrders = [];

    for (const order of orders) {
      for (const item of order.items) {
        if (productIds.includes(item.product)) {
          totalRevenue += item.price * item.quantity;
        }
      }
      totalOrders++;
      if (recentOrders.length < 10) {
        recentOrders.push(order);
      }
    }

    // Revenue by month
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          'items.product': { $in: productIds },
          orderStatus: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.product': { $in: productIds }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          'items.product': { $in: productIds },
          orderStatus: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.product': { $in: productIds }
        }
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProducts,
          lowStockProducts,
          totalOrders,
          totalRevenue
        },
        recentOrders: recentOrders.slice(0, 10),
        revenueByMonth,
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSellerProducts = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller' || !req.user.isSellerApproved) {
      return res.status(403).json({
        success: false,
        message: 'You are not an approved seller'
      });
    }

    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({ seller: req.user.id })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Product.countDocuments({ seller: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSellerOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller' || !req.user.isSellerApproved) {
      return res.status(403).json({
        success: false,
        message: 'You are not an approved seller'
      });
    }

    const sellerProducts = await Product.find({ seller: req.user.id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      'items.product': { $in: productIds }
    };

    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('user', 'name email');

    // Filter orders to only include items from this seller
    const filteredOrders = orders.map(order => {
      const sellerItems = order.items.filter(item =>
        productIds.includes(item.product)
      );
      return {
        ...order.toObject(),
        items: sellerItems
      };
    });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders: filteredOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateSellerProduct = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'You are not a seller'
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const { name, description, price, stock, category, images } = req.body;

    if (name) {
      product.name = name;
      product.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category) product.category = category;
    if (images) product.images = images;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const deleteSellerProduct = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'You are not a seller'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSellerDashboard,
  getSellerProducts,
  getSellerOrders,
  updateSellerProduct,
  deleteSellerProduct
};
