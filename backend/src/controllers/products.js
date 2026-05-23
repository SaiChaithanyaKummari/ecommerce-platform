const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 16
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match stage for aggregation
    const matchStage = {};

    if (search) {
      matchStage.$text = { $search: search };
    }

    if (category) {
      matchStage.category = category;
    }

    const hasMinPrice = minPrice !== undefined && minPrice !== '';
    const hasMaxPrice = maxPrice !== undefined && maxPrice !== '';
    const hasMinRating = minRating !== undefined && minRating !== '';

    if (hasMinPrice || hasMaxPrice) {
      matchStage.price = {};
      if (hasMinPrice) {
        const parsedMinPrice = parseFloat(minPrice);
        if (!Number.isNaN(parsedMinPrice)) {
          matchStage.price.$gte = parsedMinPrice;
        }
      }
      if (hasMaxPrice) {
        const parsedMaxPrice = parseFloat(maxPrice);
        if (!Number.isNaN(parsedMaxPrice)) {
          matchStage.price.$lte = parsedMaxPrice;
        }
      }
      if (Object.keys(matchStage.price).length === 0) {
        delete matchStage.price;
      }
    }

    if (hasMinRating) {
      const parsedMinRating = parseFloat(minRating);
      if (!Number.isNaN(parsedMinRating)) {
        matchStage.ratingsAverage = { $gte: parsedMinRating };
      }
    }

    // Build sort stage
    const sortStage = {};
    const validSortFields = ['price', 'createdAt', 'ratingsAverage', 'ratingsQuantity', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortStage[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      { $sort: sortStage },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          price: 1,
          stock: 1,
          images: 1,
          category: 1,
          ratingsAverage: 1,
          ratingsQuantity: 1,
          createdAt: 1,
          seller: {
            id: '$seller._id',
            name: '$seller.name',
            avatar: '$seller.avatar'
          },
          score: search ? { $meta: 'textScore' } : '$$REMOVE'
        }
      }
    ];

    // Add text score sorting if searching
    if (search) {
      pipeline.splice(1, 0, { $sort: { score: { $meta: 'textScore' } } });
    }

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Product.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const resultsPipeline = [...pipeline, { $skip: skip }, { $limit: parseInt(limit) }];
    const products = await Product.aggregate(resultsPipeline);

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

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('seller', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, images } = req.body;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      stock,
      category,
      images,
      seller: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
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

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
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

const getProductCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories
};
