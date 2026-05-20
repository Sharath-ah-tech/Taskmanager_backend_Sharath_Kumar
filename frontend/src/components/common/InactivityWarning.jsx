import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import tokenManager from '../../utils/tokenManager';

const InactivityWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const INACTIVITY_WARNING_TIME = 6 * 24 * 60 * 60 * 1000; // 6 days (warning 1 day before)
  const INACTIVITY_LIMIT = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  useEffect(() => {
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity) {
        const inactiveDuration = Date.now() - parseInt(lastActivity);
        const timeUntilLimit = INACTIVITY_LIMIT - inactiveDuration;
        
        if (timeUntilLimit <= INACTIVITY_WARNING_TIME && timeUntilLimit > 0) {
          setTimeLeft(Math.ceil(timeUntilLimit / (1000 * 60 * 60))); // hours left
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      }
    };
    
    const interval = setInterval(checkInactivity, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  
  const handleStayLoggedIn = () => {
    tokenManager.updateLastActivity();
    setShowWarning(false);
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { state: { message: 'Logged out due to inactivity' } });
  };
  
  if (!showWarning) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow-lg z-50 max-w-md">
      <p className="font-semibold">⚠️ Inactivity Warning</p>
      <p className="text-sm mt-1">
        You will be automatically logged out in approximately {timeLeft} hours due to inactivity.
      </p>
      <div className="mt-3 flex gap-2">
        <button 
          onClick={handleStayLoggedIn}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Stay Logged In
        </button>
        <button 
          onClick={handleLogout}
          className="bg-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-400"
        >
          Logout Now
        </button>
      </div>
    </div>
  );
};

export default InactivityWarning;