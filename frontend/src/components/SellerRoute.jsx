import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SellerRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || user.role !== 'seller' || !user.isSellerApproved) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SellerRoute;
