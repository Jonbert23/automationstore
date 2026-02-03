import { useState, useEffect } from 'react';
import useStore from '../../hooks/useStore';
import { addUserAddress, updateUserAddresses, removeUserAddress } from '../../services/sanityClient';

const AccountAddresses = () => {
  const { user, setUser } = useStore();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    // Load addresses from user data
    if (user?.addresses && user.addresses.length > 0) {
      setAddresses(user.addresses);
    } else {
      setAddresses([]);
    }
    setLoading(false);
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const newAddress = {
      ...formData,
      _key: Date.now().toString(),
    };

    try {
      // If setting as default, update other addresses first
      let updatedAddresses = addresses;
      if (newAddress.isDefault) {
        updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: false }));
      }
      
      if (user?._id) {
        // Save to Sanity
        const result = await addUserAddress(user._id, newAddress);
        if (result) {
          // Update local state and user store
          const finalAddresses = [...updatedAddresses, newAddress];
          setAddresses(finalAddresses);
          setUser({ ...user, addresses: finalAddresses });
        }
      } else {
        // No user ID, just update local state
        setAddresses([...updatedAddresses, newAddress]);
      }
      
      setShowForm(false);
      setFormData({
        label: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
        phone: '',
        isDefault: false,
      });
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressKey) => {
    setSaving(true);
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr._key === addressKey,
      }));

      if (user?._id) {
        const result = await updateUserAddresses(user._id, updatedAddresses);
        if (result) {
          setAddresses(updatedAddresses);
          setUser({ ...user, addresses: updatedAddresses });
        }
      } else {
        setAddresses(updatedAddresses);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to update address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (addressKey) => {
    if (!window.confirm('Are you sure you want to remove this address?')) {
      return;
    }

    setSaving(true);
    try {
      if (user?._id) {
        const result = await removeUserAddress(user._id, addressKey);
        if (result) {
          const updatedAddresses = addresses.filter(addr => addr._key !== addressKey);
          setAddresses(updatedAddresses);
          setUser({ ...user, addresses: updatedAddresses });
        }
      } else {
        setAddresses(addresses.filter(addr => addr._key !== addressKey));
      }
    } catch (error) {
      console.error('Error removing address:', error);
      alert('Failed to remove address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">Address Book</h1>
        <button 
          className="account-action-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i> 
          {showForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {/* Add Address Form */}
      {showForm && (
        <div className="account-card" style={{ marginBottom: '30px' }}>
          <div className="account-card-header">
            <h3 className="account-card-title">New Address</h3>
          </div>
          <div className="account-card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Name / Label</label>
                  <input 
                    type="text"
                    name="label"
                    className="form-input"
                    placeholder="e.g., Home, Office"
                    value={formData.label}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Street Address</label>
                <input 
                  type="text"
                  name="street"
                  className="form-input"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    type="text"
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input 
                    type="text"
                    name="state"
                    className="form-input"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input 
                    type="text"
                    name="zip"
                    className="form-input"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Country</label>
                <select 
                  name="country"
                  className="form-select"
                  value={formData.country}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                </select>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox"
                  name="isDefault"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="isDefault" style={{ fontWeight: 500 }}>Set as default address</label>
              </div>

              <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button type="submit" className="account-action-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
          <p style={{ marginTop: '15px' }}>Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="account-card" style={{ padding: '60px', textAlign: 'center' }}>
          <i className="fas fa-map-marker-alt" style={{ fontSize: '4rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
          <h3 style={{ marginBottom: '10px' }}>No addresses saved</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Add an address for faster checkout.</p>
          <button className="account-action-btn" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus"></i> Add Address
          </button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((address) => (
            <div key={address._key} className={`address-card ${address.isDefault ? 'default' : ''}`}>
              {address.isDefault && (
                <span className="address-default-badge">Default</span>
              )}
              <h4 className="address-name">{address.label}</h4>
              <p className="address-details">
                {address.street}<br />
                {address.city}, {address.state} {address.zip}<br />
                {address.country}<br />
                {address.phone}
              </p>
              <div className="address-actions">
                <a href="#" className="edit" onClick={(e) => { e.preventDefault(); alert('Edit feature coming soon!'); }}>Edit</a>
                <a 
                  href="#" 
                  className="remove" 
                  onClick={(e) => { e.preventDefault(); handleRemove(address._key); }}
                  style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : 'auto' }}
                >
                  {saving ? 'Removing...' : 'Remove'}
                </a>
                {!address.isDefault && (
                  <a 
                    href="#" 
                    className="set-default" 
                    onClick={(e) => { e.preventDefault(); handleSetDefault(address._key); }}
                    style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : 'auto' }}
                  >
                    {saving ? 'Updating...' : 'Set as Default'}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AccountAddresses;
