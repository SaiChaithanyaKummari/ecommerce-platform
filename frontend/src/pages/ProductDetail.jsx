import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { ShoppingCart, Star, User } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, isLoading } = useSelector((state) => state.product);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      setSelectedImage(0);
    }
  }, [product]);

  const handleAddToCart = async () => {
    try {
      await dispatch(addToCart({ productId: id, quantity })).unwrap();
      toast.success('Added to cart with 15-minute reservation');
      navigate('/cart');
    } catch (err) {
      toast.error(err || 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!product) {
    return <div className="text-center py-8">Product not found</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.images && product.images.length > 0 && (
            <div>
              <img
                src={product.images[selectedImage].url}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg mb-4"
              />
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-full h-20 object-cover rounded cursor-pointer ${
                      index === selectedImage ? 'ring-2 ring-primary-600' : ''
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="ml-1 font-semibold">{product.ratingsAverage}</span>
              <span className="text-gray-500 ml-1">({product.ratingsQuantity} reviews)</span>
            </div>
          </div>

          <div className="text-4xl font-bold text-primary-600 mb-4">
            ${product.price}
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-6">
            <span className="text-sm text-gray-500">Category: </span>
            <span className="font-medium capitalize">{product.category}</span>
          </div>

          <div className="mb-6">
            <span className="text-sm text-gray-500">Stock: </span>
            <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
              {product.stock} {product.stock < 10 ? '(Low Stock)' : ''}
            </span>
          </div>

          {product.seller && (
            <div className="mb-6 flex items-center">
              <User className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">Sold by: </span>
              <span className="font-medium ml-1">{product.seller.name}</span>
            </div>
          )}

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="btn btn-secondary px-3"
              >
                -
              </button>
              <span className="mx-4 text-xl font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="btn btn-secondary px-3"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Inventory Reservation:</strong> When you add this item to cart, 
              it will be reserved for 15 minutes. Complete your checkout within this time 
              to secure your purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
