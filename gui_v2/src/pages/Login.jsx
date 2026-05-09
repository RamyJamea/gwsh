import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CashLogo from '../components/CashLogo';
import { Eye, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-split">
        <div className="login-banner glass-panel">
          <div className="banner-content">
            <CashLogo className="huge-logo" />
            <p className="subtitle">Next-Generation Integrated POS System</p>
          </div>
        </div>
        
        <div className="login-form-container">
          <form className="glass-panel login-form" onSubmit={handleLogin}>
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to your counter</p>
            
            {error && <div className="error-message" style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</div>}

            <div className="form-group">
              <input 
                type="text" 
                className="input" 
                placeholder="Employee ID or Username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus 
                required 
              />
            </div>
            
            <div className="form-group password-wrapper">
              <input 
                type="password" 
                className="input" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
              <button type="button" className="btn-icon password-toggle">
                <Eye size={20} />
              </button>
            </div>
            
            <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '1rem', width: '100%' }} disabled={loading}>
              <LogIn size={20} />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
