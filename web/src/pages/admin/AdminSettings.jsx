import { useState } from 'react';
import { storeName } from '../../services/sanityClient';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    storeName: storeName || 'My Store',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    currency: 'USD',
    timezone: 'America/New_York',
    
    // Shipping
    freeShippingThreshold: 150,
    standardShippingRate: 15,
    expressShippingRate: 25,
    enableLocalPickup: false,
    
    // Tax
    enableTax: true,
    taxRate: 8,
    taxIncludedInPrice: false,
    
    // Notifications
    orderConfirmation: true,
    shippingNotification: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    
    // Checkout
    guestCheckout: true,
    requirePhone: false,
    orderNotes: true,
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // In a real app, save to database or localStorage
    localStorage.setItem('storeSettings', JSON.stringify(settings));
    
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: 'fa-store' },
    { id: 'shipping', label: 'Shipping', icon: 'fa-truck' },
    { id: 'tax', label: 'Tax', icon: 'fa-percent' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'checkout', label: 'Checkout', icon: 'fa-shopping-cart' },
  ];

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Settings</h1>
        <button 
          onClick={handleSave} 
          className="admin-action-btn"
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Saving...
            </>
          ) : saved ? (
            <>
              <i className="fas fa-check"></i> Saved!
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Save Changes
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px' }}>
        {/* Sidebar Tabs */}
        <div className="admin-data-card" style={{ padding: '15px', height: 'fit-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 15px',
                border: 'none',
                background: activeTab === tab.id ? '#f3f4f6' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '0.95rem',
                cursor: 'pointer',
                borderRadius: '8px',
                textAlign: 'left',
                marginBottom: '5px'
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ width: '20px' }}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          {/* General Settings */}
          {activeTab === 'general' && (
            <>
              <h3 className="admin-form-section-title">General Settings</h3>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Store Name</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  placeholder="Your Store Name"
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  This is set via VITE_STORE_NAME environment variable for multi-tenant deployments
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Contact Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={settings.storeEmail}
                    onChange={(e) => handleChange('storeEmail', e.target.value)}
                    placeholder="store@example.com"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="admin-form-input"
                    value={settings.storePhone}
                    onChange={(e) => handleChange('storePhone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Store Address</label>
                <textarea
                  className="admin-form-textarea"
                  value={settings.storeAddress}
                  onChange={(e) => handleChange('storeAddress', e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                  rows="3"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Currency</label>
                  <select
                    className="admin-form-select"
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Timezone</label>
                  <select
                    className="admin-form-select"
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Shipping Settings */}
          {activeTab === 'shipping' && (
            <>
              <h3 className="admin-form-section-title">Shipping Settings</h3>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Free Shipping Threshold ($)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value))}
                  placeholder="150"
                  min="0"
                  step="0.01"
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Orders above this amount qualify for free shipping. Set to 0 for always free shipping.
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Standard Shipping Rate ($)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={settings.standardShippingRate}
                    onChange={(e) => handleChange('standardShippingRate', parseFloat(e.target.value))}
                    placeholder="15"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Express Shipping Rate ($)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={settings.expressShippingRate}
                    onChange={(e) => handleChange('expressShippingRate', parseFloat(e.target.value))}
                    placeholder="25"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableLocalPickup}
                    onChange={(e) => handleChange('enableLocalPickup', e.target.checked)}
                  />
                  <span>Enable Local Pickup Option</span>
                </label>
              </div>
            </>
          )}

          {/* Tax Settings */}
          {activeTab === 'tax' && (
            <>
              <h3 className="admin-form-section-title">Tax Settings</h3>
              
              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableTax}
                    onChange={(e) => handleChange('enableTax', e.target.checked)}
                  />
                  <span>Enable Tax Calculation</span>
                </label>
              </div>

              {settings.enableTax && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Tax Rate (%)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={settings.taxRate}
                      onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                      placeholder="8"
                      min="0"
                      max="100"
                      step="0.01"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.taxIncludedInPrice}
                        onChange={(e) => handleChange('taxIncludedInPrice', e.target.checked)}
                      />
                      <span>Prices include tax</span>
                    </label>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                      If enabled, product prices already include tax.
                    </small>
                  </div>
                </>
              )}
            </>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <>
              <h3 className="admin-form-section-title">Email Notifications</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.orderConfirmation}
                    onChange={(e) => handleChange('orderConfirmation', e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>Order Confirmation</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Send email to customer when order is placed
                    </p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.shippingNotification}
                    onChange={(e) => handleChange('shippingNotification', e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>Shipping Notification</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Notify customer when order is shipped
                    </p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.lowStockAlert}
                    onChange={(e) => handleChange('lowStockAlert', e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>Low Stock Alert</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Get notified when product stock is low
                    </p>
                  </div>
                </label>
              </div>

              {settings.lowStockAlert && (
                <div className="admin-form-group" style={{ marginTop: '20px' }}>
                  <label className="admin-form-label">Low Stock Threshold</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                    placeholder="10"
                    min="1"
                    style={{ maxWidth: '200px' }}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Alert when stock falls below this number
                  </small>
                </div>
              )}
            </>
          )}

          {/* Checkout Settings */}
          {activeTab === 'checkout' && (
            <>
              <h3 className="admin-form-section-title">Checkout Settings</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.guestCheckout}
                    onChange={(e) => handleChange('guestCheckout', e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>Allow Guest Checkout</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Customers can checkout without creating an account
                    </p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.requirePhone}
                    onChange={(e) => handleChange('requirePhone', e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>Require Phone Number</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Phone number is required at checkout
                    </p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.orderNotes}
                    onChange={(e) => handleChange('orderNotes', e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>Enable Order Notes</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Allow customers to add notes to their order
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
