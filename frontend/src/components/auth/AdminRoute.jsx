import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;
  }

  // Only Django superusers can open the platform admin page.
  if (!user || !user.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
