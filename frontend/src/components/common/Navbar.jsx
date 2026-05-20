import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  if (!user) return null;

  return (
    <nav className="navbar animate-fade-in">
      <div className="container nav-container">
        <Link to="/" className="nav-brand">
          <div className="auth-logo" style={{width: '36px', height: '36px', margin: 0, fontSize: '1rem', borderRadius: '8px'}}>TM</div>
          <span>Task Manager</span>
        </Link>
        
        <div className="nav-links hide-mobile">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Dashboard</Link>
          <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`}>Tasks</Link>
          <Link to="/calendar" className={`nav-link ${isActive('/calendar')}`}>Calendar</Link>
          <Link to="/groups" className={`nav-link ${isActive('/groups')}`}>Groups</Link>
          {user?.is_admin && (
            <Link to="/admin" className={`nav-link ${isActive('/admin')}`} style={{color: 'var(--danger)'}}>
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-6">
          <NotificationBell />
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium hide-mobile" style={{color: 'var(--text-secondary)'}}>
              {user.username || user.email}
            </div>
            <button onClick={handleLogout} className="btn btn-outline" style={{padding: '0.4rem 1rem', fontSize: '0.875rem'}}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;