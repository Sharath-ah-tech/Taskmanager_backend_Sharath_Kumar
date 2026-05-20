import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/auth';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    
    try {
      await requestPasswordReset(email);
      setStatus('success');
      setMessage('If an account with that email exists, we have sent a password reset link.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">TM</div>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>
        </div>
        
        {status === 'success' ? (
          <div className="text-center">
            <div className="alert alert-success mb-6">
              {message}
            </div>
            <Link to="/login" className="btn btn-primary btn-full">Return to Login</Link>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div className="alert alert-error">
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full mt-2"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    Sending...
                  </span>
                ) : 'Send Reset Link'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-muted hover:text-primary" style={{color: 'var(--accent-primary)'}}>
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
