import { useState, useEffect } from 'react';
import useStore from '../../hooks/useStore';
import { writeClient } from '../../services/sanityClient';

const AccountProfile = () => {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess('');
    setError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await writeClient
        .patch(user._id)
        .set({
          name: formData.name,
          phone: formData.phone,
        })
        .commit();

      setUser({ ...user, name: formData.name, phone: formData.phone });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Hash password function
  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const newHashedPassword = await hashPassword(passwordData.newPassword);
      
      await writeClient
        .patch(user._id)
        .set({ password: newHashedPassword })
        .commit();

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password updated successfully!');
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">My Profile</h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', color: '#166534' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '10px' }}></i>
          {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #ef4444', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', color: '#991b1b' }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '10px' }}></i>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Profile Picture */}
        <div className="account-card">
          <div className="account-card-body" style={{ textAlign: 'center', padding: '40px 30px' }}>
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }}
              />
            ) : (
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: '#111',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '2.5rem',
                margin: '0 auto 20px'
              }}>
                {getInitials(user.name)}
              </div>
            )}
            <h3 style={{ marginBottom: '5px' }}>{user.name}</h3>
            <p style={{ color: '#6b7280', marginBottom: '15px' }}>{user.email}</p>
            <span style={{ 
              display: 'inline-block',
              padding: '4px 12px', 
              background: user.authType === 'google' ? '#ea4335' : '#111',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {user.authType === 'google' ? 'Google Account' : 'Email Account'}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <div>
          <div className="account-card">
            <div className="account-card-header">
              <h3 className="account-card-title">Profile Information</h3>
            </div>
            <div className="account-card-body">
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', background: '#f9fafb', color: '#6b7280' }}
                  />
                  <small style={{ color: '#6b7280' }}>Email cannot be changed</small>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="account-action-btn"
                  disabled={loading}
                  style={{ background: '#111', color: 'white', padding: '12px 30px' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Change Password - Only for email accounts */}
          {user.authType !== 'google' && (
            <div className="account-card" style={{ marginTop: '20px' }}>
              <div className="account-card-header">
                <h3 className="account-card-title">Change Password</h3>
              </div>
              <div className="account-card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem' }}
                      required
                      minLength={6}
                    />
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem' }}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="account-action-btn"
                    disabled={loading}
                    style={{ background: '#111', color: 'white', padding: '12px 30px' }}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountProfile;
