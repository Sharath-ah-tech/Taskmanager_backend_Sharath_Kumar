import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.passwordConfirm) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    
    try {
      // Create a copy of the data matching what the backend expects
      const submitData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password1: formData.password, // allauth sometimes requires password1/password1 depending on config
        password2: formData.passwordConfirm
      };
      
      const response = await register(submitData);
      const registeredUser = response.data.user;
      navigate(registeredUser?.is_superuser ? '/admin' : '/');
    } catch (err) {
      setError(
        err.response?.data?.error || 
        (err.response?.data && Object.values(err.response.data)[0]) || 
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Redirect to Django allauth Google endpoint
    const apiRoot = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';
    const callbackUrl = `${window.location.origin}/oauth-callback`;
    window.location.href = `${apiRoot}/accounts/google/login/?next=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">TM</div>
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">Join Task Manager today</p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              required
              minLength={8}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full mt-4"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="divider">or continue with</div>
        
        <button 
          onClick={handleGoogleRegister}
          type="button" 
          className="btn btn-google btn-full"
        >
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>
        
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link to="/login" style={{color: 'var(--accent-primary)', fontWeight: 500}}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
