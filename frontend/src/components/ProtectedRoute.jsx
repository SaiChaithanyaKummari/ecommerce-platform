import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: 'Please log in to view product details.',
          from: location.pathname
        }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
