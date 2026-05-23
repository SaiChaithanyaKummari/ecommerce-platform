# E-Commerce Platform

A production-ready, full-stack e-commerce platform with advanced features including inventory reservation, idempotent payment handling, and automated inventory reconciliation.

## Tech Stack

### Backend

- **Node.js + Express** - REST API server
- **MongoDB + Mongoose** - Database with aggregation pipelines
- **Redis** - Inventory reservations and caching
- **Bull** - Job queues for async operations
- **Stripe** - Payment processing
- **Nodemailer** - Transactional emails
- **Cloudinary** - File uploads
- **JWT** - Authentication with refresh tokens

### Frontend

- **React 18** - UI framework
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Stripe Elements** - Payment UI

## Features

### Core Features

- **User Authentication** - JWT access + refresh tokens, password reset via email
- **Product Management** - Advanced search, filters, sorting, pagination with MongoDB aggregation
- **Shopping Cart** - Persistent storage with 15-minute inventory reservation system
- **Checkout & Orders** - MongoDB transactions for atomicity, idempotent payment handling
- **Admin Panel** - Dashboard metrics, product/order/user management
- **Seller Panel** - Product management, order tracking, revenue analytics

### Advanced Features

- **Inventory Reservation System** - Items reserved for 15 minutes when added to cart
- **Idempotent Payment Handling** - Prevents duplicate charges using idempotency keys
- **Automated Inventory Reconciliation** - Bull queue job releases expired reservations every 5 minutes
- **Email Notifications** - Order confirmations, password resets, low stock alerts
- **Coupon System** - Percentage and fixed discounts with expiry and usage limits

## Project Structure

```
ecommerce-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and Redis configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth and validation middleware
│   │   ├── utils/           # JWT, crypto utilities
│   │   ├── services/        # Email, payment, cloudinary services
│   │   ├── jobs/            # Bull queue jobs
│   │   ├── app.js           # Express app configuration
│   │   └── server.js        # Server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── features/        # Redux slices
│   │   ├── store/           # Redux store configuration
│   │   ├── utils/           # Axios configuration
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Redis server (local or cloud)
- Stripe account
- Cloudinary account
- Email service (e.g., Gmail with app password)

### Backend Setup

1. **Navigate to backend directory**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@ecommerce.com

# Client
CLIENT_URL=http://localhost:3000
```

4. **Start the server**

```bash
npm run dev
```

### Frontend Setup

1. **Navigate to frontend directory**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment file**

```bash
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key" > .env
```

4. **Start the development server**

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Documentation

### Authentication

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Products

#### Get Products (with filters, sort, pagination)

```http
GET /api/products?search=laptop&category=electronics&minPrice=500&maxPrice=2000&sortBy=price&sortOrder=asc&page=1&limit=10
```

#### Get Product by ID

```http
GET /api/products/:id
```

#### Create Product (Admin/Seller)

```http
POST /api/products
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 50,
  "category": "electronics",
  "images": [{"url": "image_url", "public_id": "cloudinary_id"}]
}
```

### Cart

#### Get Cart

```http
GET /api/cart
Authorization: Bearer <access_token>
```

#### Add to Cart (with reservation)

```http
POST /api/cart
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 2
}
```

#### Update Cart Item

```http
PUT /api/cart/:itemId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart

```http
DELETE /api/cart/:itemId
Authorization: Bearer <access_token>
```

#### Apply Coupon

```http
POST /api/cart/apply-coupon
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "SAVE20"
}
```

### Orders

#### Create Payment Intent

```http
POST /api/orders/checkout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "idempotencyKey": "unique_key"
}
```

#### Verify Payment

```http
POST /api/orders/verify-payment
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx",
  "idempotencyKey": "unique_key",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Get My Orders

```http
GET /api/orders/my-orders
Authorization: Bearer <access_token>
```

### Admin

#### Get Dashboard Stats

```http
GET /api/admin/dashboard
Authorization: Bearer <access_token>
```

#### Get All Orders

```http
GET /api/admin/orders?status=paid&page=1&limit=20
Authorization: Bearer <access_token>
```

#### Update Order Status

```http
PUT /api/admin/orders/:id/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "shipped"
}
```

### Seller

#### Get Seller Dashboard

```http
GET /api/seller/dashboard
Authorization: Bearer <access_token>
```

#### Get Seller Products

```http
GET /api/seller/products?page=1&limit=20
Authorization: Bearer <access_token>
```

## Demo Video Script

### Introduction

"I built a complete e-commerce backend handling 1000+ concurrent requests, with idempotent payment handling and automated inventory reconciliation."

### Key Features to Demonstrate

1. **Inventory Reservation System**
   - Add product to cart
   - Show 15-minute countdown timer
   - Explain how reservations work with Redis
   - Demonstrate automatic release after expiration

2. **Idempotent Payment Handling**
   - Start checkout process
   - Generate unique idempotency key
   - Complete payment with Stripe
   - Show how duplicate requests are handled

3. **Admin Dashboard**
   - Show real-time metrics (sales, orders, products, users)
   - Display low stock alerts
   - Demonstrate order status updates

4. **Seller Dashboard**
   - Show revenue analytics
   - Display top-selling products
   - Demonstrate product management

5. **Advanced MongoDB Queries**
   - Show product search with text index
   - Demonstrate faceted filters (category, price, rating)
   - Show aggregation pipeline for dashboard stats

### Performance Demonstration

- Run load test with 1000+ concurrent requests
- Show response times and throughput
- Demonstrate Redis caching effectiveness
- Show Bull queue job processing

## Performance & Quality

- **MongoDB Aggregation Pipelines** - Used for complex queries to avoid N+1 problem
- **Request Validation** - Express-validator for input validation
- **Rate Limiting** - Applied to auth endpoints
- **Security** - Helmet, CORS, compression middleware
- **Error Handling** - Comprehensive error handling with proper status codes
- **Logging** - Structured logging for debugging and monitoring

## Load Testing

To test performance with 1000+ concurrent requests:

```bash
# Install autocannon
npm install -g autocannon

# Test product listing endpoint
autocannon -c 1000 -d 30 http://localhost:5000/api/products

# Test cart endpoint
autocannon -c 1000 -d 30 http://localhost:5000/api/cart -H "Authorization: Bearer <token>"
```

## Troubleshooting

### Redis Connection Issues

- Ensure Redis server is running: `redis-server`
- Check REDIS_URL in .env file

### MongoDB Connection Issues

- Verify MONGO_URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### Stripe Webhook Issues

- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:5000/api/orders/webhook`
- Update STRIPE_WEBHOOK_SECRET in .env

### Email Not Sending

- For Gmail, enable 2FA and generate app password
- Check EMAIL_HOST and EMAIL_PORT settings
- Verify email credentials

## License

ISC

## Author

Built as a production-ready e-commerce platform demonstrating advanced backend architecture and modern frontend practices.
