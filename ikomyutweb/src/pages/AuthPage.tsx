import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VerificationModal from '../components/VerificationModal';
import '../styles/AuthPage.css';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [mobilenumber, setMobileno] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const { setUserFromBackend } = useAuth();
  // Use localhost for development, production URL for deployment
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://ikomyutweb-4.onrender.com/api/auth'
    : 'http://localhost:5000/api/auth';

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mobilenumber.length !== 11) {
      setError('Mobile number must be exactly 11 digits.');
      return;
    }
    if (!mobilenumber.startsWith('09')) {
      setError('Mobile number must start with "09".');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNo: mobilenumber, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      setSuccessLoading(true);
      setTimeout(() => {
        setUserFromBackend({
          id: data.user.id,
          mobileNo: data.user.mobileNo,
          fullName: data.user.fullName,
          token: data.token,
        });
        onAuthSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Full name is required');
      return;
    }
    if (mobilenumber.length !== 11 || !mobilenumber.startsWith('09')) {
      setError('Valid mobile number is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      console.log('🚀 Starting registration...');
      const startTime = Date.now();
      
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, mobileNo: mobilenumber, password }),
      });
      
      const apiTime = Date.now() - startTime;
      console.log(`✅ API responded in ${apiTime}ms`);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      console.log('💾 Saving to localStorage...');
      // Store registration data in localStorage for contact form auto-fill
      localStorage.setItem('registeredUser', JSON.stringify({ fullName: name, email }));
      
      console.log('🔓 Opening verification modal...');
      // Show verification modal
      setVerificationStep(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-page">
      {successLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        </div>
      )}
      <div className="auth-split-card">
        <div className="auth-split-left">
          <div className="auth-logo-box">
            <img src="/logowh.png" alt="iKomyutPH" className="auth-logo-large" />
            <h1 className="ikom-title">iKomyut<span className="ikom-ph">PH</span></h1>
          </div>
        </div>
        <div className="auth-split-right">
          <div className="auth-tabs">
            <button className={tab === 'login' ? 'tab active' : 'tab'} onClick={() => setTab('login')}>Login</button>
            <button className={tab === 'register' ? 'tab active' : 'tab'} onClick={() => setTab('register')}>Register</button>
          </div>
          {tab === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  id="mobile-login"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mobilenumber}
                  onChange={e => setMobileno(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile Number"
                  disabled={loading}
                  required
                />
                <label htmlFor="mobile-login">Mobile Number</label>
              </div>
              <div className="form-group">
                <input
                  id="password-login"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loading}
                  required
                />
                <label htmlFor="password-login">Password</label>
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
                {loading ? 'Processing...' : 'Login'}
              </button>
              <div className="or-divider">
                <span></span>
                <span>or</span>
                <span></span>
              </div>
              <button type="button" className="btn google-btn" disabled>
                <svg className="google-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Login with Google
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-group">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  disabled={loading}
                  required
                />
                <label htmlFor="name">Full Name</label>
              </div>
              <div className="form-group">
                <input
                  id="mobile-register"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mobilenumber}
                  onChange={e => setMobileno(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile Number"
                  disabled={loading}
                  required
                />
                <label htmlFor="mobile-register">Mobile Number</label>
              </div>
              <div className="form-group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={loading}
                  required
                />
                <label htmlFor="email">Email</label>
              </div>
              <div className="form-group">
                <input
                  id="password-register"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loading}
                  required
                />
                <label htmlFor="password-register">Password</label>
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div className="form-group">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  disabled={loading}
                  required
                />
                <label htmlFor="confirm-password">Confirm Password</label>
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>

      <VerificationModal
        isOpen={verificationStep}
        email={email}
        onClose={() => {
          setVerificationStep(false);
          setTab('register');
        }}
        onSuccess={() => {
          setVerificationStep(false);
          setTab('login');
          setError('Email verified! You can now login.');
          setMobileno('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setEmail('');
        }}
      />
    </div>
  );
};

export default AuthPage;
