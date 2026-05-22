import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tokenManager from '../utils/tokenManager';
import { useAuth } from './AuthContext';

const SessionContext = createContext();

// Inactivity timeout (7 days)
const INACTIVITY_LIMIT = 7 * 24 * 60 * 60 * 1000; // 7 days

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const inactivityTimerRef = useRef(null);
  const tokenCheckIntervalRef = useRef(null);
  
  // Handle logout due to inactivity
  const handleInactivityLogout = useCallback(async () => {
    await logout();
    navigate('/login', { 
      state: { message: 'Logged out due to inactivity (7 days)' }
    });
  }, [logout, navigate]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    tokenManager.updateLastActivity();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Check for inactivity after limit
    inactivityTimerRef.current = setTimeout(() => {
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity && (Date.now() - parseInt(lastActivity)) >= INACTIVITY_LIMIT) {
        handleInactivityLogout();
      }
    }, INACTIVITY_LIMIT);
  }, [handleInactivityLogout]);
  
  // Check token expiry periodically
  const checkTokenExpiry = useCallback(() => {
    const timeUntilExpiry = tokenManager.getTimeUntilExpiry();
    
    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
      tokenManager.refreshAccessToken().catch(console.error);
    }
    
    // If token expired, clear and redirect
    if (!tokenManager.isAuthenticated()) {
      handleInactivityLogout();
    }
  }, [handleInactivityLogout]);
  
  useEffect(() => {
    // Set up event listeners for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Start inactivity timer
    resetInactivityTimer();
    
    // Check token expiry every minute
    tokenCheckIntervalRef.current = setInterval(checkTokenExpiry, 60 * 1000);
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    };
  }, [resetInactivityTimer, checkTokenExpiry]);
  
  return (
    <SessionContext.Provider value={{ resetInactivityTimer }}>
      {children}
    </SessionContext.Provider>
  );
};