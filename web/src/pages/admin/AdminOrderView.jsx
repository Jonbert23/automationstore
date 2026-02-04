import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, urlFor, writeClient, verifyPayment, rejectPayment } from '../../services/sanityClient';

const AdminOrderView = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const statusOptions = ['pending', 'verified', 'completed', 'cancelled'];

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      setAdminNotes(data?.notes || '');
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      // If changing to verified, also set accessGranted
      if (newStatus === 'verified') {
        await writeClient.patch(orderId).set({ 
          status: newStatus,
          accessGranted: true,
          accessGrantedAt: new Date().toISOString(),
          paymentVerified: true,
          paymentVerifiedAt: new Date().toISOString(),
        }).commit();
        setOrder({ 
          ...order, 
          status: newStatus, 
          accessGranted: true,
          paymentVerified: true 
        });
      } else {
        await writeClient.patch(orderId).set({ status: newStatus }).commit();
        setOrder({ ...order, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!confirm('Verify this payment? Customer will be able to access Google Drive.')) return;
    
    setVerifying(true);
    try {
      await verifyPayment(orderId, 'admin');
      setOrder({ 
        ...order, 
        status: 'verified', 
        paymentVerified: true, 
        accessGranted: true,
        paymentVerifiedAt: new Date().toISOString(),
        accessGrantedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectPayment = async () => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    
    setVerifying(true);
    try {
      await rejectPayment(orderId, reason || 'Payment could not be verified');
      setOrder({ ...order, status: 'cancelled', notes: reason });
      setAdminNotes(reason);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await writeClient.patch(orderId).set({ notes: adminNotes }).commit();
      setOrder({ ...order, notes: adminNotes });
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'admin-status-active';
      case 'verified':
        return 'admin-status-warning';
      case 'pending':
        return 'admin-status-pending';
      case 'cancelled':
        return 'admin-status-out-of-stock';
      default:
        return 'admin-status-pending';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      verified: 'Verified',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = { gcash: 'GCash', maya: 'Maya', gotyme: 'GoTyme' };
    return labels[method] || method || 'Not specified';
  };

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(100).url();
    } catch {
      return 'https://via.placeholder.com/100x100?text=No+Image';
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '20px' }}></i>
        <h2>Order not found</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>The order you're looking for doesn't exist.</p>
        <Link to="/admin/orders" className="admin-action-btn">
          <i className="fas fa-arrow-left"></i> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/admin/orders" style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="admin-page-title">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
            {getStatusLabel(order.status || 'pending')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {order.status === 'pending' && (
            <>
              <button 
                onClick={handleVerifyPayment}
                disabled={verifying}
                style={{
                  padding: '10px 20px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <i className="fas fa-check"></i> Verify Payment
              </button>
              <button 
                onClick={handleRejectPayment}
                disabled={verifying}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <i className="fas fa-times"></i> Reject
              </button>
            </>
          )}
          <button className="admin-action-btn secondary" onClick={() => window.print()}>
            <i className="fas fa-print"></i> Print
          </button>
        </div>
      </div>

      {/* Payment Verification Alert */}
      {order.status === 'pending' && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '12px', 
          padding: '20px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <i className="fas fa-exclamation-circle" style={{ color: '#f59e0b', fontSize: '1.5rem' }}></i>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#92400e' }}>Payment Pending Verification</strong>
            <p style={{ color: '#92400e', margin: '5px 0 0', fontSize: '0.9rem' }}>
              Please verify the payment and approve to grant the customer access to Google Drive.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Left Column - Order Items */}
        <div>
          <div className="admin-data-card" style={{ padding: '30px' }}>
            <h3 className="admin-form-section-title">Order Items ({order.items?.length || 0})</h3>
            
            {order.items?.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  padding: '20px 0', 
                  borderBottom: index < order.items.length - 1 ? '1px solid var(--border)' : 'none' 
                }}
              >
                <img
                  src={getImageUrl(item.product?.images?.[0])}
                  alt={item.product?.title || 'Product'}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover', 
                    borderRadius: '8px',
                    background: '#f4f4f4'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '5px', fontWeight: 600 }}>
                    {item.product?.title || 'Unknown Product'}
                  </h4>
                  <span style={{ 
                    display: 'inline-block',
                    background: '#f3f4f6', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <i className="fas fa-download" style={{ marginRight: '5px' }}></i>
                    Digital Download
                  </span>
                  {item.product?.driveLink && order.accessGranted && (
                    <div style={{ marginTop: '10px' }}>
                      <a 
                        href={item.product.driveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.85rem', color: 'var(--primary)' }}
                      >
                        <i className="fab fa-google-drive" style={{ marginRight: '6px' }}></i>
                        View Drive Link
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>
                  ₱{item.price?.toLocaleString()}
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 700,
                fontSize: '1.2rem'
              }}>
                <span>Total</span>
                <span>₱{order.total?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '30px' }}>
            <h3 className="admin-form-section-title">Payment Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment Method</label>
                <p style={{ fontWeight: 600, marginTop: '5px' }}>{getPaymentMethodLabel(order.paymentMethod)}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reference Number</label>
                <p style={{ fontWeight: 600, marginTop: '5px', fontFamily: 'monospace' }}>
                  {order.paymentReference || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Status-based info box */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: (order.status === 'verified' || order.status === 'completed') ? '#f0fdf4' : 
                         order.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
              borderRadius: '8px',
              border: `1px solid ${
                (order.status === 'verified' || order.status === 'completed') ? '#22c55e' : 
                order.status === 'cancelled' ? '#ef4444' : '#f59e0b'
              }`
            }}>
              <p style={{ 
                color: (order.status === 'verified' || order.status === 'completed') ? '#166534' : 
                       order.status === 'cancelled' ? '#991b1b' : '#92400e',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                <i className={`fas ${
                  order.status === 'completed' ? 'fa-check-double' :
                  order.status === 'verified' ? 'fa-check-circle' : 
                  order.status === 'cancelled' ? 'fa-times-circle' : 'fa-clock'
                }`} style={{ marginRight: '8px' }}></i>
                {order.status === 'completed' ? 'Payment Verified - Customer has accessed files' :
                 order.status === 'verified' ? 'Payment Verified - Customer can access files' : 
                 order.status === 'cancelled' ? 'Order Cancelled' : 'Awaiting Payment Verification'}
              </p>
              {order.paymentVerifiedAt && (order.status === 'verified' || order.status === 'completed') && (
                <p style={{ color: '#166534', fontSize: '0.8rem', marginTop: '8px' }}>
                  Verified on {formatDate(order.paymentVerifiedAt)}
                  {order.paymentVerifiedBy && ` by ${order.paymentVerifiedBy}`}
                </p>
              )}
            </div>

            {/* Payment Proof */}
            {order.paymentProof && (
              <div style={{ marginTop: '20px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                  Payment Proof Screenshot
                </label>
                <img 
                  src={getImageUrl(order.paymentProof)} 
                  alt="Payment proof"
                  style={{ maxWidth: '300px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '30px' }}>
            <h3 className="admin-form-section-title">Order Timeline</h3>
            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              <div style={{ 
                position: 'absolute', 
                left: '8px', 
                top: '5px', 
                bottom: '5px', 
                width: '2px', 
                background: '#e5e7eb' 
              }}></div>
              
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '-26px', 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <i className="fas fa-check" style={{ color: 'white', fontSize: '10px' }}></i>
                </div>
                <div>
                  <strong>Order Placed</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                    {formatDate(order._createdAt)}
                  </p>
                </div>
              </div>

              {order.paymentReference && (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-26px', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: order.paymentVerified ? 'var(--primary)' : '#f59e0b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <i className={`fas ${order.paymentVerified ? 'fa-check' : 'fa-clock'}`} style={{ color: 'white', fontSize: '10px' }}></i>
                  </div>
                  <div>
                    <strong>Payment Info Submitted</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                      Via {getPaymentMethodLabel(order.paymentMethod)} - Ref: {order.paymentReference}
                    </p>
                  </div>
                </div>
              )}

              {order.paymentVerified && (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-26px', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: '#22c55e', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <i className="fas fa-check" style={{ color: 'white', fontSize: '10px' }}></i>
                  </div>
                  <div>
                    <strong>Payment Verified</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                      {formatDate(order.paymentVerifiedAt)}
                    </p>
                  </div>
                </div>
              )}

              {order.status === 'verified' && order.accessGranted && (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-26px', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: '#3b82f6', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <i className="fas fa-check" style={{ color: 'white', fontSize: '10px' }}></i>
                  </div>
                  <div>
                    <strong style={{ color: '#3b82f6' }}>Verified - Awaiting Access</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                      Customer can now access Google Drive
                    </p>
                  </div>
                </div>
              )}

              {order.status === 'completed' && (
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-26px', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: '#22c55e', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <i className="fas fa-check" style={{ color: 'white', fontSize: '10px' }}></i>
                  </div>
                  <div>
                    <strong style={{ color: '#22c55e' }}>Completed</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                      Customer has accessed their files
                    </p>
                  </div>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-26px', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: '#ef4444', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <i className="fas fa-times" style={{ color: 'white', fontSize: '10px' }}></i>
                  </div>
                  <div>
                    <strong style={{ color: '#ef4444' }}>Cancelled</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                      Order has been cancelled
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Customer Info & Actions */}
        <div>
          {/* Customer Info */}
          <div className="admin-data-card" style={{ padding: '30px' }}>
            <h3 className="admin-form-section-title">Customer</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: 'var(--primary)', 
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem'
              }}>
                {(order.userName || order.user || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontWeight: 600 }}>{order.userName || 'Guest User'}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{order.user}</p>
              </div>
            </div>
            <a 
              href={`mailto:${order.user}`} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: 'var(--primary)', 
                fontWeight: 500 
              }}
            >
              <i className="fas fa-envelope"></i> Send Email
            </a>
          </div>

          {/* Quick Actions */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '30px' }}>
            <h3 className="admin-form-section-title">Update Status</h3>
            <select
              value={order.status || 'pending'}
              onChange={(e) => updateOrderStatus(e.target.value)}
              disabled={updatingStatus}
              className="admin-form-select"
              style={{ width: '100%', marginBottom: '15px' }}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            {updatingStatus && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <i className="fas fa-spinner fa-spin"></i> Updating...
              </p>
            )}
          </div>

          {/* Admin Notes */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '30px' }}>
            <h3 className="admin-form-section-title">Admin Notes</h3>
            <textarea
              className="admin-form-textarea"
              placeholder="Add internal notes about this order..."
              rows="4"
              style={{ width: '100%', resize: 'vertical' }}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            ></textarea>
            <button 
              className="admin-action-btn secondary" 
              style={{ marginTop: '15px', width: '100%' }}
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                'Save Note'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrderView;
