import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon, clearCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { Trash2, Clock, Tag, ShoppingCart } from 'lucide-react';
import { formatIndianCurrency } from '../utils/currency';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, couponCode, totalAfterDiscount, isLoading } = useSelector((state) => state.cart);
  const [couponInput, setCouponInput] = useState('');
  const [timers, setTimers] = useState({});

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      items.forEach((item) => {
        const reservedUntil = new Date(item.reservedUntil);
        const now = new Date();
        const diff = reservedUntil - now;
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          newTimers[item._id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [items]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
    } catch (err) {
      toast.error(err || 'Failed to update cart');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error(err || 'Failed to remove item');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    try {
      await dispatch(applyCoupon(couponInput)).unwrap();
      toast.success('Coupon applied successfully');
      setCouponInput('');
    } catch (err) {
      toast.error(err || 'Failed to apply coupon');
    }
  };

  const handleClearCart = async () => {
    try {
      await dispatch(clearCart()).unwrap();
      toast.success('Cart cleared');
    } catch (err) {
      toast.error(err || 'Failed to clear cart');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal - totalAfterDiscount;

  if (isLoading) {
    return <div className="text-center py-8">Loading cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/products" className="lm-btn-register ">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item._id} className="card">
              <div className="flex items-start space-x-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  <p className="text-primary-600 font-bold mb-2">{formatIndianCurrency(item.price)}</p>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="btn btn-secondary px-2 py-1 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="mx-3">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        className="btn btn-secondary px-2 py-1"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {timers[item._id] && (
                    <div className="flex items-center text-orange-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Reserved for: {timers[item._id]}</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">{formatIndianCurrency(item.price * item.quantity)}</p>
                  <button onClick={() => handleRemoveItem(item._id)} className="text-red-600 hover:text-red-700 mt-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatIndianCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatIndianCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatIndianCurrency(totalAfterDiscount)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full btn btn-primary text-center mb-4"
            >
              Proceed to Checkout
            </Link>

            <button
              onClick={handleClearCart}
              className="block w-full btn btn-secondary text-center"
            >
              Clear Cart
            </button>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Apply Coupon
            </h3>
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="input"
              />
              <button type="submit" className="w-full btn btn-secondary">
                Apply Coupon
              </button>
            </form>
            {couponCode && (
              <div className="mt-2 text-green-600 text-sm">
                Coupon applied: {couponCode}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
