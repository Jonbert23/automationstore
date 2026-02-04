import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initGoogleAuth, renderGoogleButton, emailLogin, emailRegister } from '../features/auth/authService';
import useStore from '../hooks/useStore';

// Admin email(s) - redirects to admin panel on login
const ADMIN_EMAILS = ['jonbertandam@gmail.com'];

const isAdminEmail = (email) => ADMIN_EMAILS.includes(email?.toLowerCase());

const Login = () => {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate(isAdminEmail(user.email) ? '/admin' : '/account');
      return;
    }

    // Initialize Google Auth and render button
    const setupAuth = async () => {
      await initGoogleAuth(
        (userData) => {
          setUser(userData);
          navigate(isAdminEmail(userData.email) ? '/admin' : '/account');
        },
        (error) => {
          console.error('Login failed:', error);
          setError('Google sign-in failed. Please try again.');
        }
      );

      await renderGoogleButton('google-signin-btn');
    };

    setupAuth();
  }, [user, navigate, setUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await emailLogin(loginEmail, loginPassword);
      
      if (result.success) {
        setUser(result.user);
        navigate(isAdminEmail(result.user.email) ? '/admin' : '/account');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await emailRegister(registerName, registerEmail, registerPassword);
      
      if (result.success) {
        setUser(result.user);
        navigate(isAdminEmail(result.user.email) ? '/admin' : '/account');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #333',
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#222',
    color: 'white',
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    background: '#D9FF00',
    color: '#111',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh' }}>
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 40px' }}>
        <div style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          {/* Logo */}
          <h1 className="logo" style={{ fontSize: '3rem', marginBottom: '10px', color: 'white' }}>SHUZEE<span style={{ color: '#D9FF00' }}>.</span></h1>
          <p style={{ color: '#9ca3af', marginBottom: '40px' }}>Photoshop Automation Scripts</p>

          {/* Auth Card */}
          <div style={{ 
            background: '#1a1a1a', 
            padding: '40px', 
            border: '1px solid #333',
            borderRadius: '16px',
          }}>
            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              marginBottom: '30px',
              background: '#222',
              borderRadius: '8px',
              padding: '4px',
            }}>
              <button
                onClick={() => { setActiveTab('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  background: activeTab === 'login' ? '#D9FF00' : 'transparent',
                  color: activeTab === 'login' ? '#111' : '#9ca3af',
                  transition: 'all 0.2s',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  background: activeTab === 'register' ? '#D9FF00' : 'transparent',
                  color: activeTab === 'register' ? '#111' : '#9ca3af',
                  transition: 'all 0.2s',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '0.9rem',
                textAlign: 'left',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                {error}
              </div>
            )}
            {success && (
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: '#22c55e', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '0.9rem',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                {success}
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#9ca3af' }}>Email</label>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={inputStyle}
                  required
                />

                <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#9ca3af' }}>Password</label>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={inputStyle}
                  required
                />

                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#9ca3af' }}>Full Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  style={inputStyle}
                  required
                />

                <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#9ca3af' }}>Email</label>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  style={inputStyle}
                  required
                />

                <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#9ca3af' }}>Password</label>
                </div>
                <input
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  style={inputStyle}
                  required
                  minLength={6}
                />

                <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#9ca3af' }}>Confirm Password</label>
                </div>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  style={inputStyle}
                  required
                />

                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i>
                      Create Account
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '30px 0',
              color: '#666'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
              <span style={{ padding: '0 15px', fontSize: '0.85rem' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
            </div>

            {/* Google Sign In Button */}
            <div 
              id="google-signin-btn" 
              style={{ 
                display: 'flex', 
                justifyContent: 'center',
              }}
            ></div>

            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '25px' }}>
              By continuing, you agree to our{' '}
              <a href="#" style={{ color: '#D9FF00' }}>Terms of Service</a> and{' '}
              <a href="#" style={{ color: '#D9FF00' }}>Privacy Policy</a>.
            </p>
          </div>

          {/* Benefits */}
          <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
            <div>
              <i className="fas fa-download" style={{ fontSize: '1.5rem', color: '#D9FF00', marginBottom: '10px', display: 'block' }}></i>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Instant Access</p>
            </div>
            <div>
              <i className="fas fa-heart" style={{ fontSize: '1.5rem', color: '#D9FF00', marginBottom: '10px', display: 'block' }}></i>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Save Wishlist</p>
            </div>
            <div>
              <i className="fas fa-sync-alt" style={{ fontSize: '1.5rem', color: '#D9FF00', marginBottom: '10px', display: 'block' }}></i>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Free Updates</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
