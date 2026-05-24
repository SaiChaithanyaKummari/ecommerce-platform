import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../store/slices/productSlice';
import { ShoppingCart } from 'lucide-react';
import { formatIndianCurrency } from '../utils/currency';

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, categories, isLoading, pagination } = useSelector((state) => state.product);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    page: 1
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Products</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-8">
          <input type="text" name="search" placeholder="Search products..." value={filters.search} onChange={handleFilterChange} className="input focus:ring-0"/>
          <select name="category" value={filters.category} onChange={handleFilterChange} className="input focus:ring-0">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} style={{ paddingRight: '1.5rem' }}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product._id} className="card grid">
                {product.images && product.images.length > 0 && (
                  <img src={product.images[0].url} alt={product.name} className="w-full h-48 object-cover rounded-t-lg mb-4"/>
                )}
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex  items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary-600" style={{ color: '#8A8070', display: 'flex', alignItems: 'center' }}>
                    {formatIndianCurrency(product.price)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    Discount: {product.discountPercentage}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {product.ratingsAverage} ⭐ ({product.ratingsQuantity})
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 "> 
                  <Link to={`/products/${product._id}`} className="lm-btn-register flex-1 btn btn-secondary text-center">
                    View Details
                  </Link>
                  
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="pagination-btn disabled:opacity-50">
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => handlePageChange(page)} className={`pagination-btn${page === filters.page ? ' pagination-btn-active' : ''}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.pages} className="pagination-btn disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
