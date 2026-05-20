import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../services/auth';

const PasswordResetConfirm = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    
    setStatus('loading');
    setMessage('');
    
    try {
      await resetPassword(uidb64, token, formData.password);
      setStatus('success');
      setMessage('Your password has been successfully reset. You can now login with your new password.');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please login.' } });
      }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Invalid or expired reset link. Please try again.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">TM</div>
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-subtitle">Please enter your new password below</p>
        </div>
        
        {status === 'success' ? (
          <div className="text-center">
            <div className="alert alert-success mb-6">
              {message}
            </div>
            <p className="text-sm text-muted mb-4">Redirecting to login...</p>
            <Link to="/login" className="btn btn-primary btn-full">Go to Login Now</Link>
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
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full mt-4"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordResetConfirm;
