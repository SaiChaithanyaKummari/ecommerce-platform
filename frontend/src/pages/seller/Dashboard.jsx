import { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get('/seller/dashboard');
      setStats(data.data.stats);
      setRecentOrders(data.data.recentOrders);
      setTopProducts(data.data.topProducts);
    } catch (err) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <Package className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            Top Selling Products
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((item) => (
                <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">{item.totalSold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${item.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Order #{order._id.slice(-6)}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.totalAmount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="card text-center hover:bg-gray-50 transition">
          <Package className="w-8 h-8 mx-auto mb-2 text-primary-600" />
          <p className="font-medium">Manage Products</p>
        </button>
        <button className="card text-center hover:bg-gray-50 transition">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-primary-600" />
          <p className="font-medium">View Orders</p>
        </button>
        <button className="card text-center hover:bg-gray-50 transition">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary-600" />
          <p className="font-medium">View Analytics</p>
        </button>
      </div>
    </div>
  );
};

export default SellerDashboard;
