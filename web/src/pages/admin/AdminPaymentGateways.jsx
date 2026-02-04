import { useState, useEffect } from 'react';
import { writeClient, uploadImage, urlFor } from '../../services/sanityClient';

const PAYMENT_OPTIONS = [
  { value: 'GCash', label: 'GCash' },
  { value: 'Maya', label: 'Maya' },
  { value: 'GoTyme', label: 'GoTyme' },
];

const AdminPaymentGateways = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    accountName: '',
    accountNumber: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const query = `*[_type == "paymentMethod"] | order(sortOrder asc){
        _id,
        name,
        slug,
        qrCode,
        accountName,
        accountNumber,
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

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({
      name: '',
      accountName: '',
      accountNumber: '',
      isActive: true,
      sortOrder: 0,
    });
    setQrPreview(null);
    setQrFile(null);
    setShowModal(true);
  };

  const openEditModal = (payment) => {
    setModalMode('edit');
    setEditingId(payment._id);
    setFormData({
      name: payment.name,
      accountName: payment.accountName || '',
      accountNumber: payment.accountNumber || '',
      isActive: payment.isActive !== false,
      sortOrder: payment.sortOrder || 0,
    });
    setQrPreview(getImageUrl(payment.qrCode));
    setQrFile(null);
    setShowModal(true);
  };

  const openViewModal = (payment) => {
    setModalMode('view');
    setEditingId(payment._id);
    setFormData({
      name: payment.name,
      accountName: payment.accountName || '',
      accountNumber: payment.accountNumber || '',
      isActive: payment.isActive !== false,
      sortOrder: payment.sortOrder || 0,
    });
    setQrPreview(getImageUrl(payment.qrCode));
    setShowModal(true);
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

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      accountName: '',
      accountNumber: '',
      isActive: true,
      sortOrder: 0,
    });
    setQrPreview(null);
    setQrFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please select a payment method');
      return;
    }

    if (!editingId && !qrFile) {
      alert('Please upload a QR code image');
      return;
    }

    setSaving(true);
    try {
      let qrCodeRef = null;

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
          current: generateSlug(formData.name),
        },
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      if (qrCodeRef) {
        doc.qrCode = qrCodeRef;
      }

      if (editingId) {
        await writeClient
          .patch(editingId)
          .set(doc)
          .commit();

        setPaymentMethods(paymentMethods.map(p => 
          p._id === editingId ? { ...p, ...doc, _id: editingId } : p
        ));
        alert('Payment method updated successfully');
      } else {
        const newPayment = await writeClient.create(doc);
        setPaymentMethods([...paymentMethods, newPayment]);
        alert('Payment method created successfully');
      }

      closeModal();
      fetchPaymentMethods();
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
        <button onClick={openAddModal} className="admin-action-btn">
          <i className="fas fa-plus"></i>
          Add Payment Method
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

      {/* Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '20px 25px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {modalMode === 'add' ? 'Add Payment Method' : modalMode === 'edit' ? 'Edit Payment Method' : 'View Payment Method'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
              {/* QR Code Preview/Upload */}
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                {modalMode === 'view' ? (
                  qrPreview ? (
                    <img 
                      src={qrPreview} 
                      alt="QR Code" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '200px', 
                      height: '200px', 
                      background: '#f3f4f6', 
                      margin: '0 auto',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="fas fa-qrcode" style={{ fontSize: '4rem', color: '#9ca3af' }}></i>
                    </div>
                  )
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {qrPreview ? (
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={qrPreview} 
                          alt="QR Preview" 
                          style={{ 
                            maxWidth: '180px', 
                            maxHeight: '180px', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                        <label style={{
                          position: 'absolute',
                          bottom: '-10px',
                          right: '-10px',
                          width: '36px',
                          height: '36px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          <i className="fas fa-camera" style={{ color: 'white', fontSize: '0.9rem' }}></i>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrCodeChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '180px', 
                        height: '180px', 
                        border: '2px dashed #d1d5db', 
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: '#f9fafb',
                        transition: 'all 0.2s'
                      }}>
                        <i className="fas fa-qrcode" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '10px' }}></i>
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Upload QR Code</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '5px' }}>Click to browse</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Dropdown */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Payment Method *
                </label>
                {modalMode === 'view' ? (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: '#f3f4f6', 
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}>
                    {formData.name}
                  </div>
                ) : (
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select payment method</option>
                    {PAYMENT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Account Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Account Name *
                </label>
                {modalMode === 'view' ? (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: '#f3f4f6', 
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}>
                    {formData.accountName || '-'}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    placeholder="e.g., Juan Dela Cruz"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                )}
              </div>

              {/* Account Number */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Account/Mobile Number
                </label>
                {modalMode === 'view' ? (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: '#f3f4f6', 
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}>
                    {formData.accountNumber || '-'}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 0917-XXX-XXXX"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                )}
              </div>

              {/* Sort Order & Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                    Sort Order
                  </label>
                  {modalMode === 'view' ? (
                    <div style={{ 
                      padding: '12px 14px', 
                      background: '#f3f4f6', 
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}>
                      {formData.sortOrder}
                    </div>
                  ) : (
                    <input
                      type="number"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                    Status
                  </label>
                  {modalMode === 'view' ? (
                    <div style={{ 
                      padding: '12px 14px', 
                      background: formData.isActive ? '#dcfce7' : '#f3f4f6', 
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: formData.isActive ? '#166534' : '#6b7280',
                      fontWeight: 600
                    }}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </div>
                  ) : (
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      cursor: 'pointer',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: formData.isActive ? '#f0fdf4' : 'white'
                    }}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 500 }}>Active</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              {modalMode !== 'view' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--primary)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '1rem',
                      opacity: saving ? 0.7 : 1
                    }}
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                        Saving...
                      </>
                    ) : (
                      editingId ? 'Update' : 'Add Payment Method'
                    )}
                  </button>
                </div>
              )}

              {modalMode === 'view' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--primary)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
                    Edit
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="admin-data-card">
        {paymentMethods.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-qrcode"></i>
            <p>No payment methods yet</p>
            <button
              onClick={openAddModal}
              className="admin-action-btn"
              style={{ marginTop: '20px' }}
            >
              <i className="fas fa-plus"></i> Add Your First Payment Method
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px' }}>
            {paymentMethods.map((payment) => (
              <div 
                key={payment._id} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  background: 'white',
                  opacity: payment.isActive ? 1 : 0.6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onClick={() => openViewModal(payment)}
              >
                {/* QR Code */}
                <div style={{ 
                  background: '#f9fafb', 
                  padding: '20px', 
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {getImageUrl(payment.qrCode) ? (
                    <img 
                      src={getImageUrl(payment.qrCode)} 
                      alt={`${payment.name} QR`}
                      style={{ 
                        maxWidth: '120px', 
                        maxHeight: '120px', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      background: '#e5e7eb', 
                      margin: '0 auto',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="fas fa-qrcode" style={{ fontSize: '2.5rem', color: '#9ca3af' }}></i>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{payment.name}</h3>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: payment.isActive ? '#dcfce7' : '#f3f4f6',
                      color: payment.isActive ? '#166534' : '#6b7280'
                    }}>
                      {payment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    <p style={{ marginBottom: '3px' }}>{payment.accountName || '-'}</p>
                    <p>{payment.accountNumber || '-'}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(payment);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className={`fas fa-${payment.isActive ? 'eye-slash' : 'eye'}`}></i>
                      {payment.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(payment);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        background: 'var(--primary)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(payment._id);
                      }}
                      disabled={deleting === payment._id}
                      style={{
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
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
