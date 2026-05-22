import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { oauthCallback } from '../../services/auth';
import tokenManager from '../../utils/tokenManager';

const OAuthCallback = () => {
  const [error, setError] = useState('');
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callOnceRef = useRef(false);

  useEffect(() => {
    const exchangeToken = async () => {
      if (callOnceRef.current) return;
      callOnceRef.current = true;

      if (searchParams.get('error')) {
        setError('Google sign-in could not be completed. Please start the sign-in again.');
        return;
      }
      
      try {
        console.log('Initiating OAuth callback exchange...');
        const response = await oauthCallback();
        console.log('OAuth callback response:', response.data);
        
        const { tokens } = response.data;
        if (tokens && tokens.access && tokens.refresh) {
          // Store tokens in tokenManager
          tokenManager.setTokens(tokens.access, tokens.refresh);
          
          // Fetch user details to update context state
          await fetchUser();
          
          console.log('OAuth login successful, navigating to home...');
          navigate(response.data.user?.is_superuser ? '/admin' : '/');
        } else {
          throw new Error('Invalid token structure received from server');
        }
      } catch (err) {
        console.error('OAuth exchange error:', err);
        setError(
          err.response?.data?.error || 
          err.message || 
          'Authentication failed. Please try again.'
        );
      }
    };

    exchangeToken();
  }, [fetchUser, navigate, searchParams]);

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card animate-fade-in text-center" style={{ padding: '40px 30px' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>TM</div>
          <h2 className="auth-title">{error ? 'Authentication Failed' : 'Completing Sign-In'}</h2>
          <p className="auth-subtitle">
            {error ? 'An error occurred during Google authentication' : 'Please wait while we secure your session...'}
          </p>
        </div>

        {error ? (
          <div className="mt-4">
            <div className="alert alert-error mb-4" style={{ textAlign: 'left' }}>
              {error}
            </div>
            <button 
              onClick={() => navigate('/login')} 
              className="btn btn-primary btn-full"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            {/* Elegant glassmorphic spinner */}
            <div className="spinner-glow" style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(var(--primary-rgb, 99, 102, 241), 0.1)',
              borderTop: '4px solid var(--accent-primary, #6366f1)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              margin: '0 auto 20px auto'
            }}></div>
            <span className="text-sm text-muted">Exchanging credentials...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
