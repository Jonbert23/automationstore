import { useState, useEffect } from 'react';
import { client, writeClient } from '../../services/sanityClient';

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderAmount: 0,
    maxUses: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const data = await client.fetch(`
        *[_type == "discount"] | order(_createdAt desc) {
          _id,
          code,
          description,
          type,
          value,
          minOrderAmount,
          maxUses,
          usedCount,
          startDate,
          endDate,
          isActive
        }
      `);
      setDiscounts(data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const discountData = {
        _type: 'discount',
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: formData.type !== 'free_shipping' ? parseFloat(formData.value) : 0,
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        isActive: formData.isActive,
      };

      if (editingId) {
        await writeClient.patch(editingId).set(discountData).commit();
      } else {
        discountData.usedCount = 0;
        await writeClient.create(discountData);
      }

      await fetchDiscounts();
      resetForm();
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Failed to save discount');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (discount) => {
    setFormData({
      code: discount.code,
      description: discount.description || '',
      type: discount.type,
      value: discount.value || '',
      minOrderAmount: discount.minOrderAmount || 0,
      maxUses: discount.maxUses || '',
      startDate: discount.startDate ? discount.startDate.slice(0, 16) : '',
      endDate: discount.endDate ? discount.endDate.slice(0, 16) : '',
      isActive: discount.isActive,
    });
    setEditingId(discount._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return;

    try {
      await writeClient.delete(id);
      setDiscounts(discounts.filter(d => d._id !== id));
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Failed to delete discount');
    }
  };

  const toggleActive = async (discount) => {
    try {
      await writeClient.patch(discount._id).set({ isActive: !discount.isActive }).commit();
      setDiscounts(discounts.map(d => 
        d._id === discount._id ? { ...d, isActive: !d.isActive } : d
      ));
    } catch (error) {
      console.error('Error toggling discount:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      minOrderAmount: 0,
      maxUses: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No limit';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDiscountDisplay = (discount) => {
    if (discount.type === 'percentage') return `${discount.value}% off`;
    if (discount.type === 'fixed') return `$${discount.value} off`;
    return 'Free shipping';
  };

  const isExpired = (discount) => {
    if (!discount.endDate) return false;
    return new Date(discount.endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading discounts...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Discounts & Coupons</h1>
        <button 
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="admin-action-btn"
        >
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i> 
          {showForm ? 'Cancel' : 'Create Discount'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="admin-data-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 className="admin-form-section-title">
            {editingId ? 'Edit Discount' : 'Create New Discount'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Discount Code *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER20"
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="e.g., Summer sale 20% off"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Discount Type *</label>
                <select
                  className="admin-form-select"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              {formData.type !== 'free_shipping' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Value {formData.type === 'percentage' ? '(%)' : '($)'} *
                  </label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={formData.value}
                    onChange={(e) => handleChange('value', e.target.value)}
                    placeholder={formData.type === 'percentage' ? '20' : '10'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    required
                  />
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-form-label">Min. Order Amount ($)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={formData.minOrderAmount}
                  onChange={(e) => handleChange('minOrderAmount', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Max Uses</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={formData.maxUses}
                  onChange={(e) => handleChange('maxUses', e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Start Date</label>
                <input
                  type="datetime-local"
                  className="admin-form-input"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">End Date</label>
                <input
                  type="datetime-local"
                  className="admin-form-input"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
                <span>Active</span>
              </label>
              
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <button type="button" onClick={resetForm} className="admin-action-btn secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Discount' : 'Create Discount'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Discounts List */}
      <div className="admin-data-card">
        {discounts.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-tags"></i>
            <p>No discounts created yet</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min. Order</th>
                <th>Usage</th>
                <th>Valid Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount._id} style={{ opacity: !discount.isActive || isExpired(discount) ? 0.6 : 1 }}>
                  <td>
                    <code style={{ 
                      background: '#f3f4f6', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {discount.code}
                    </code>
                    {discount.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {discount.description}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {getDiscountDisplay(discount)}
                  </td>
                  <td>{discount.minOrderAmount > 0 ? `$${discount.minOrderAmount}` : 'None'}</td>
                  <td>
                    {discount.usedCount || 0} / {discount.maxUses || '∞'}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div>{formatDate(discount.startDate)} -</div>
                    <div>{formatDate(discount.endDate)}</div>
                  </td>
                  <td>
                    {isExpired(discount) ? (
                      <span className="admin-status-badge admin-status-out-of-stock">Expired</span>
                    ) : discount.isActive ? (
                      <span className="admin-status-badge admin-status-active">Active</span>
                    ) : (
                      <span className="admin-status-badge admin-status-pending">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleActive(discount)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          color: discount.isActive ? '#f59e0b' : '#22c55e'
                        }}
                        title={discount.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`fas ${discount.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                      </button>
                      <button
                        onClick={() => handleEdit(discount)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(discount._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default AdminDiscounts;
