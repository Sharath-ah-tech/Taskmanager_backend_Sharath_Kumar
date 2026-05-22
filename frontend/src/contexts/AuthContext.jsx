import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getProfile } from '../services/auth';
import tokenManager from '../utils/tokenManager';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) throw new Error('No token');
      
      const response = await getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      tokenManager.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated
    const initAuth = async () => {
      if (tokenManager.isAuthenticated()) {
        await fetchUser();
      } else {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [fetchUser]);

  const login = async (credentials) => {
    try {
      console.log('Login attempt with:', credentials);
      const response = await loginApi(credentials);
      console.log('Login response:', response);
      console.log('Response data:', response.data);
      
      // Check if response has the expected structure
      if (!response.data || !response.data.tokens) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid server response');
      }
      
      const { access, refresh } = response.data.tokens;
      
      if (!access || !refresh) {
        console.error('Missing tokens in response');
        throw new Error('Missing authentication tokens');
      }
      
      // Store tokens
      tokenManager.setTokens(access, refresh);
      setUser(response.data.user);
      tokenManager.updateLastActivity();
      
      console.log('Login successful, user set:', response.data.user);
      return response;
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      throw error;
    }
  };

  const register = async (userData) => {
    const response = await registerApi(userData);
    const { access, refresh } = response.data.tokens;
    
    tokenManager.setTokens(access, refresh);
    setUser(response.data.user);
    tokenManager.updateLastActivity();
    
    return response;
  };

  const logout = async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    tokenManager.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      fetchUser,
      isAuthenticated: tokenManager.isAuthenticated()
    }}>
      {children}
    </AuthContext.Provider>
  );
};