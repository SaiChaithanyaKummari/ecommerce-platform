import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const LogoMark = () => (
  <svg width="34" height="34" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="56" height="56" rx="10" fill="#1A1612" />
    <path d="M14 20 L20 20 L28 36 L36 20 L42 20" stroke="#C9A96E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="28" cy="43" r="2.2" fill="#C9A96E" />
    <rect x="23" y="11" width="10" height="1.5" rx="0.75" fill="#C9A96E" opacity="0.5" />
  </svg>
);


const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const location = useLocation();

  const handleLogout = () => dispatch(logout());
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF6' }}>
      <nav className="lm-nav">
        <div className="lm-nav-inner">
          <Link to="/" className="lm-logo">
            <LogoMark />
            <div>
              <div className="lm-logo-text">
                LUXE<span>MART</span>
              </div>
              <span className="lm-logo-sub">Everything · Delivered</span>
            </div>
          </Link>
          <div className="lm-links">
            <Link
              to="/products"
              className={`lm-link ${location.pathname === '/products' ? 'lm-link-active' : ''}`}
            >
              Products
            </Link>
            <div className="lm-divider" />
            <Link to="/cart" className="lm-cart" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (<span className="lm-cart-badge">{cartItemCount}</span>)}</Link>
            {user ? (
              <>
                <Link to="/orders" className="lm-link">Orders</Link>

                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="lm-role-badge">Admin</Link>
                )}
                {user.role === 'seller' && (
                  <Link to="/seller/dashboard" className="lm-role-badge">Seller</Link>
                )}

                <div className="lm-divider" />

                <div className="lm-user-pill">
                  <User size={14} />
                  {user.name}
                </div>
                <button onClick={handleLogout} className="lm-logout" aria-label="Log out">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <div className="lm-divider" />
                <Link to="/login" className="lm-btn-login">Login</Link>
                <Link to="/register" className="lm-btn-register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;