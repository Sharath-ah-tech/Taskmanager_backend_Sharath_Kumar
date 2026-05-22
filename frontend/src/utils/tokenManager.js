import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

class TokenManager {
  constructor() {
    this.accessTokenKey = 'access_token';
    this.refreshTokenKey = 'refresh_token';
    this.lastActivityKey = 'last_activity';
    this.inactivityTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }

  // Store tokens with expiration tracking
  setTokens(accessToken, refreshToken) {
    const decoded = jwtDecode(accessToken);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    
    // Store in localStorage for persistence
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(`${this.accessTokenKey}_expires`, expiresAt);
    
    // Store in HttpOnly cookie alternative (secure, but accessible to JS)
    // Actually we can't set HttpOnly from JS, so we use secure localStorage + session tracking
    Cookies.set(this.accessTokenKey, accessToken, { 
      expires: 7, // days
      secure: import.meta.env.PROD,
      sameSite: 'Strict'
    });
    
    this.updateLastActivity();
  }

  // Get access token (checks expiration)
  getAccessToken() {
    const token = localStorage.getItem(this.accessTokenKey);
    const expiresAt = localStorage.getItem(`${this.accessTokenKey}_expires`);
    
    if (!token || !expiresAt) return null;
    
    // Check if token is expired
    if (Date.now() >= parseInt(expiresAt)) {
      this.clearTokens();
      return null;
    }
    
    return token;
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Check if tokens are valid (not expired)
  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;
    
    // Also check inactivity timeout
    const lastActivity = localStorage.getItem(this.lastActivityKey);
    if (lastActivity && (Date.now() - parseInt(lastActivity)) > this.inactivityTimeout) {
      this.clearTokens();
      return false;
    }
    
    return true;
  }

  // Update last activity timestamp (called on every user action)
  updateLastActivity() {
    localStorage.setItem(this.lastActivityKey, Date.now().toString());
  }

  // Refresh token (call when access token is about to expire)
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access;
        const decoded = jwtDecode(newAccessToken);
        localStorage.setItem(this.accessTokenKey, newAccessToken);
        localStorage.setItem(`${this.accessTokenKey}_expires`, decoded.exp * 1000);
        Cookies.set(this.accessTokenKey, newAccessToken, { expires: 7 });
        return newAccessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    this.clearTokens();
    return null;
  }

  // Clear all tokens (logout)
  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(`${this.accessTokenKey}_expires`);
    localStorage.removeItem(this.lastActivityKey);
    Cookies.remove(this.accessTokenKey);
  }

  // Get time until token expires (in milliseconds)
  getTimeUntilExpiry() {
    const expiresAt = localStorage.getItem(`${this.accessTokenKey}_expires`);
    if (!expiresAt) return 0;
    return parseInt(expiresAt) - Date.now();
  }
}

export default new TokenManager();