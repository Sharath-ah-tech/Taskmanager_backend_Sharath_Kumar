import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getProfile } from '../services/auth';
import tokenManager from '../utils/tokenManager';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const fetchUser = async () => {
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
  };

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const { access, refresh } = response.data.tokens;
    
    // Store tokens with expiration tracking
    tokenManager.setTokens(access, refresh);
    setUser(response.data.user);
    
    // Update last activity
    tokenManager.updateLastActivity();
    
    return response;
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