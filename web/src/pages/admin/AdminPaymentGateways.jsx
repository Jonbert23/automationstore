import { useState, useEffect } from 'react';
import { getPaymentMethods, writeClient, uploadImage, urlFor } from '../../services/sanityClient';

const AdminPaymentGateways = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    accountName: '',
    accountNumber: '',
    instructions: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      // Fetch all payment methods including inactive ones
      const query = `*[_type == "paymentMethod"] | order(sortOrder asc){
        _id,
        name,
        slug,
        qrCode,
        accountName,
        accountNumber,
        instructions,
        isActive,
        sortOrder
      }`;
      const data = await writeClient.fetch(query);
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(150).url();
    } catch {
      return null;
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;

    setDeleting(paymentId);
    try {
      await writeClient.delete(paymentId);
      setPaymentMethods(paymentMethods.filter((p) => p._id !== paymentId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method');
    } finally {
      setDeleting(null);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment._id);
    setFormData({
      name: payment.name,
      slug: payment.slug?.current || '',
      accountName: payment.accountName || '',
      accountNumber: payment.accountNumber || '',
      instructions: payment.instructions || '',
      isActive: payment.isActive !== false,
      sortOrder: payment.sortOrder || 0,
    });
    setQrPreview(getImageUrl(payment.qrCode));
    setQrFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (payment) => {
    try {
      await writeClient
        .patch(payment._id)
        .set({ isActive: !payment.isActive })
        .commit();
      
      setPaymentMethods(paymentMethods.map(p => 
        p._id === payment._id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (error) {
      console.error('Error toggling payment method:', error);
      alert('Failed to update payment method');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      accountName: '',
      accountNumber: '',
      instructions: '',
      isActive: true,
      sortOrder: 0,
    });
    setEditingId(null);
    setShowForm(false);
    setQrPreview(null);
    setQrFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a payment method name');
      return;
    }

    if (!editingId && !qrFile) {
      alert('Please upload a QR code image');
      return;
    }

    setSaving(true);
    try {
      let qrCodeRef = null;

      // Upload QR code if new file selected
      if (qrFile) {
        const imageAsset = await uploadImage(qrFile);
        if (imageAsset) {
          qrCodeRef = {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: imageAsset._id
            }
          };
        }
      }

      const doc = {
        _type: 'paymentMethod',
        name: formData.name,
        slug: {
          _type: 'slug',
          current: formData.slug || generateSlug(formData.name),
        },
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        instructions: formData.instructions,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      // Only add qrCode if we have a new one
      if (qrCodeRef) {
        doc.qrCode = qrCodeRef;
      }

      if (editingId) {
        // Update existing payment method
        await writeClient
          .patch(editingId)
          .set(doc)
          .commit();

        setPaymentMethods(paymentMethods.map(p => 
          p._id === editingId ? { ...p, ...doc, _id: editingId } : p
        ));
        alert('Payment method updated successfully');
      } else {
        // Create new payment method
        const newPayment = await writeClient.create(doc);
        setPaymentMethods([...paymentMethods, newPayment]);
        alert('Payment method created successfully');
      }

      resetForm();
      fetchPaymentMethods(); // Refresh to get updated QR codes
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert(`Failed to ${editingId ? 'update' : 'create'} payment method`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading payment gateways...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Payment Gateways</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="admin-action-btn"
        >
          <i className={`fas fa-${showForm ? 'times' : 'plus'}`}></i>
          {showForm ? 'Cancel' : 'Add Payment Method'}
        </button>
      </div>

      {/* Info Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
        borderRadius: '12px', 
        padding: '20px 25px', 
        marginBottom: '25px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <i className="fas fa-info-circle" style={{ fontSize: '1.5rem' }}></i>
        <div>
          <strong>Payment Gateway Configuration</strong>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '5px' }}>
            Add your e-wallet QR codes and account details. These will be displayed during checkout for customers to send payments.
          </p>
        </div>
      </div>

      {/* Add/Edit Payment Method Form */}
      {showForm && (
        <div className="admin-data-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 className="admin-form-section-title">{editingId ? 'Edit Payment Method' : 'New Payment Method'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Payment Method Name *</label>
                <input
                  type="text"
                  name="name"
                  className="admin-form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., GCash, Maya, GoTyme"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  className="admin-form-input"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Account Name *</label>
                <input
                  type="text"
                  name="accountName"
                  className="admin-form-input"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Account/Mobile Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  className="admin-form-input"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 0917-XXX-XXXX"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Sort Order</label>
                <input
                  type="number"
                  name="sortOrder"
                  className="admin-form-input"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>Lower numbers appear first</small>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 500 }}>Active (visible in checkout)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">QR Code Image {!editingId && '*'}</label>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    border: '2px dashed #ddd', 
                    borderRadius: '12px', 
                    padding: '30px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    background: '#fafafa'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrCodeChange}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#999', marginBottom: '10px', display: 'block' }}></i>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Click or drag to upload QR code</p>
                    <p style={{ color: '#999', fontSize: '0.8rem', marginTop: '5px' }}>PNG, JPG up to 5MB</p>
                  </div>
                </div>
                {qrPreview && (
                  <div style={{ 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }}>
                    <img 
                      src={qrPreview} 
                      alt="QR Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Payment Instructions</label>
              <textarea
                name="instructions"
                className="admin-form-textarea"
                rows="4"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Step-by-step instructions for customers (e.g., Open GCash app, tap 'Scan QR', enter amount...)"
              />
            </div>

            <button
              type="submit"
              className="admin-action-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> {editingId ? 'Update Payment Method' : 'Save Payment Method'}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="admin-data-card">
        {paymentMethods.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-qrcode"></i>
            <p>No payment methods yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="admin-action-btn"
              style={{ marginTop: '20px' }}
            >
              <i className="fas fa-plus"></i> Add Your First Payment Method
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '20px' }}>
            {paymentMethods.map((payment) => (
              <div 
                key={payment._id} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  background: 'white',
                  opacity: payment.isActive ? 1 : 0.6
                }}
              >
                {/* QR Code */}
                <div style={{ 
                  background: '#f9fafb', 
                  padding: '25px', 
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {getImageUrl(payment.qrCode) ? (
                    <img 
                      src={getImageUrl(payment.qrCode)} 
                      alt={`${payment.name} QR`}
                      style={{ 
                        maxWidth: '150px', 
                        maxHeight: '150px', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '150px', 
                      height: '150px', 
                      background: '#e5e7eb', 
                      margin: '0 auto',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="fas fa-qrcode" style={{ fontSize: '3rem', color: '#9ca3af' }}></i>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{payment.name}</h3>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: payment.isActive ? '#dcfce7' : '#f3f4f6',
                      color: payment.isActive ? '#166534' : '#6b7280'
                    }}>
                      {payment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '5px' }}>
                      <strong>Account:</strong> {payment.accountName || '-'}
                    </p>
                    <p style={{ marginBottom: '5px' }}>
                      <strong>Number:</strong> {payment.accountNumber || '-'}
                    </p>
                    <p style={{ color: '#9ca3af' }}>
                      <strong>Order:</strong> {payment.sortOrder || 0}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => handleToggleActive(payment)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className={`fas fa-${payment.isActive ? 'eye-slash' : 'eye'}`}></i>
                      {payment.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleEdit(payment)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: 'var(--primary)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(payment._id)}
                      disabled={deleting === payment._id}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                      title="Delete"
                    >
                      {deleting === payment._id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-pagination">
        <span>Total: {paymentMethods.length} payment method{paymentMethods.length !== 1 ? 's' : ''}</span>
      </div>
    </>
  );
};

export default AdminPaymentGateways;
