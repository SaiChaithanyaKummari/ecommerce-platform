import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div>
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to LuxeMart
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your one-stop shop for everything you need
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/products"
            className="lm-btn-register flex items-center space-x-2"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="card text-center">
          <ShoppingCart className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
          <p className="text-gray-600">
            Browse through thousands of products across multiple categories
          </p>
        </div>
        <div className="card text-center">
          <ShoppingCart className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
          <p className="text-gray-600">
            Safe and secure payment processing with Stripe
          </p>
        </div>
        <div className="card text-center">
          <ShoppingCart className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">
            Quick and reliable delivery to your doorstep
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
