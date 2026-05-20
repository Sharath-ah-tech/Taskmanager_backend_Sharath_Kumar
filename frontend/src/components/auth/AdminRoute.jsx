import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;
  }

  // Check if user exists and is an admin
  if (!user || !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
