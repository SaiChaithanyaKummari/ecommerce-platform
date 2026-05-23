require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    // Connect to Database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.');

    // Clear existing data (optional but good for clean state)
    console.log('Clearing existing products and users...');
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Data cleared.');

    // Seed Users
    console.log('Seeding users...');
    const users = await User.create([
      {
        name: 'Demo Customer',
        email: 'customer@example.com',
        password: 'password123',
        role: 'customer',
        isActive: true
      },
      {
        name: 'Demo Seller',
        email: 'seller@example.com',
        password: 'password123',
        role: 'seller',
        isActive: true,
        isSellerApproved: true
      },
      {
        name: 'Demo Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        isActive: true
      }
    ]);
    console.log('Users seeded successfully.');

    const seller = users.find(u => u.role === 'seller');

    // Seed Products
    console.log('Seeding products...');
    const products = [
      {
        name: 'Wireless Noise-Canceling Headphones',
        slug: 'wireless-noise-canceling-headphones',
        description: 'Immerse yourself in rich, high-fidelity audio with these premium wireless over-ear noise-canceling headphones. Features up to 40 hours of battery life, quick charge, and comfortable memory foam earcups.',
        price: 199.99,
        stock: 50,
        category: 'electronics',
        seller: seller._id,
        ratingsAverage: 4.8,
        ratingsQuantity: 120,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            public_id: 'headphones_img'
          }
        ]
      },
      {
        name: 'UltraWide Curved Gaming Monitor',
        slug: 'ultrawide-curved-gaming-monitor',
        description: 'Take your gaming and productivity to the next level with a stunning 34-inch curved gaming monitor. Boasts a 144Hz refresh rate, 1ms response time, and dynamic HDR support for gorgeous visuals.',
        price: 349.99,
        stock: 25,
        category: 'electronics',
        seller: seller._id,
        ratingsAverage: 4.6,
        ratingsQuantity: 85,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
            public_id: 'monitor_img'
          }
        ]
      },
      {
        name: 'Premium Cotton Hoodie',
        slug: 'premium-cotton-hoodie',
        description: 'Stay cozy and stylish in this high-quality, ultra-soft cotton fleece hoodie. Perfect for casual wear, features a front pouch pocket and a comfortable, relaxed fit.',
        price: 49.99,
        stock: 100,
        category: 'clothing',
        seller: seller._id,
        ratingsAverage: 4.5,
        ratingsQuantity: 64,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
            public_id: 'hoodie_img'
          }
        ]
      },
      {
        name: 'Classic Leather Jacket',
        slug: 'classic-leather-jacket',
        description: 'Crafted from 100% genuine full-grain leather, this classic motorcycle jacket offers timeless style and rugged durability. Complete with multiple zipper pockets and a soft inner lining.',
        price: 129.99,
        stock: 15,
        category: 'clothing',
        seller: seller._id,
        ratingsAverage: 4.7,
        ratingsQuantity: 42,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
            public_id: 'jacket_img'
          }
        ]
      },
      {
        name: 'Introduction to Algorithms',
        slug: 'introduction-to-algorithms',
        description: 'The standard textbook and essential guide for understanding and designing computer science algorithms. Covers basic data structures, dynamic programming, and greedy algorithms.',
        price: 89.99,
        stock: 80,
        category: 'books',
        seller: seller._id,
        ratingsAverage: 4.9,
        ratingsQuantity: 310,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
            public_id: 'book_img'
          }
        ]
      },
      {
        name: 'Smart Robotic Vacuum Cleaner',
        slug: 'smart-robotic-vacuum-cleaner',
        description: 'Experience effortless floor cleaning with this intelligent robotic vacuum cleaner. Equipped with smart navigation, powerful suction, automatic self-charging, and app/voice control integrations.',
        price: 219.99,
        stock: 30,
        category: 'home',
        seller: seller._id,
        ratingsAverage: 4.4,
        ratingsQuantity: 95,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
            public_id: 'vacuum_img'
          }
        ]
      },
      {
        name: 'Adjustable Dumbbells Set',
        slug: 'adjustable-dumbbells-set',
        description: 'Maximize your home workouts with this versatile, space-saving adjustable dumbbell set. Quickly change weight from 5 to 52.5 lbs with a simple turn of a dial.',
        price: 159.99,
        stock: 40,
        category: 'sports',
        seller: seller._id,
        ratingsAverage: 4.7,
        ratingsQuantity: 150,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=600&q=80',
            public_id: 'dumbbells_img'
          }
        ]
      },
      {
        name: 'Remote Control Toy Drone',
        slug: 'remote-control-toy-drone',
        description: 'The perfect drone for beginners and hobbyists alike. Features a built-in HD camera, altitude hold, one-key return, and real-time FPV transmission to your smartphone.',
        price: 39.99,
        stock: 120,
        category: 'toys',
        seller: seller._id,
        ratingsAverage: 4.3,
        ratingsQuantity: 210,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80',
            public_id: 'drone_img'
          }
        ]
      }
    ];

    await Product.create(products);
    console.log('Products seeded successfully.');

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
