import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { client, writeClient, verifyPayment, rejectPayment } from '../../services/sanityClient';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await client.fetch(`
        *[_type == "order"] | order(_createdAt desc) {
          _id,
          _createdAt,
          user,
          userName,
          items[]{
            quantity,
            price,
            "product": product->{ _id, title }
          },
          total,
          status,
          paymentMethod,
          paymentReference,
          paymentVerified,
          accessGranted
        }
      `);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId) => {
    if (!confirm('Verify this payment? Customer will be able to access Google Drive.')) return;
    
    setVerifyingPayment(orderId);
    try {
      await verifyPayment(orderId, 'admin');
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'verified', paymentVerified: true, accessGranted: true }
          : order
      ));
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    } finally {
      setVerifyingPayment(null);
    }
  };

  const handleRejectPayment = async (orderId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setVerifyingPayment(orderId);
    try {
      await rejectPayment(orderId, reason || 'Payment could not be verified');
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'cancelled' }
          : order
      ));
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setVerifyingPayment(null);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      await writeClient.patch(orderId).set({ status: newStatus }).commit();
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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
    const labels = {
      gcash: 'GCash',
      maya: 'Maya',
      gotyme: 'GoTyme',
    };
    return labels[method] || method || '-';
  };

  const statusOptions = ['pending', 'verified', 'completed', 'cancelled'];

  // Filter orders based on date range, status, and search term
  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Custom date range filter
    if (dateRange === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(order => new Date(order._createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(order => new Date(order._createdAt) <= end);
      }
    } else if (dateRange !== 'all') {
      // Preset date range filter
      const now = new Date();
      const daysAgo = new Date();
      
      switch (dateRange) {
        case 'today':
          daysAgo.setHours(0, 0, 0, 0);
          break;
        case '7':
          daysAgo.setDate(now.getDate() - 7);
          break;
        case '30':
          daysAgo.setDate(now.getDate() - 30);
          break;
        case '90':
          daysAgo.setDate(now.getDate() - 90);
          break;
        default:
          break;
      }

      filtered = filtered.filter(order => new Date(order._createdAt) >= daysAgo);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => (order.status || 'pending') === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(search) ||
        order.user?.toLowerCase().includes(search) ||
        order.userName?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Calculate totals for filtered orders
  const filteredTotal = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading orders...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Orders</h1>
      </div>

      {/* Filters */}
      <div className="admin-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="admin-form-input"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '200px' }}
        />
        
        <select
          className="admin-form-select"
          value={dateRange}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'custom') {
              setTempStartDate(startDate);
              setTempEndDate(endDate);
              setShowDateModal(true);
            } else {
              setDateRange(value);
              setStartDate('');
              setEndDate('');
            }
          }}
          style={{ maxWidth: '160px' }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateRange === 'custom' && (startDate || endDate) && (
          <button
            onClick={() => {
              setTempStartDate(startDate);
              setTempEndDate(endDate);
              setShowDateModal(true);
            }}
            style={{
              padding: '8px 14px',
              background: '#eff6ff',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fas fa-calendar"></i>
            {startDate && endDate 
              ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
              : startDate 
                ? `From ${new Date(startDate).toLocaleDateString()}`
                : `Until ${new Date(endDate).toLocaleDateString()}`
            }
          </button>
        )}

        <select
          className="admin-form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: '180px' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {(dateRange !== 'all' || statusFilter !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setDateRange('all');
              setStatusFilter('all');
              setSearchTerm('');
              setStartDate('');
              setEndDate('');
            }}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Clear Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing: <strong>₱{filteredTotal.toLocaleString()}</strong> from {filteredOrders.length} orders
        </div>
      </div>

      {/* Pending Verification Alert */}
      {orders.filter(o => o.status === 'pending').length > 0 && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '8px', 
          padding: '15px 20px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <i className="fas fa-exclamation-circle" style={{ color: '#f59e0b', fontSize: '1.5rem' }}></i>
          <div>
            <strong style={{ color: '#92400e' }}>
              {orders.filter(o => o.status === 'pending').length} order(s) awaiting payment verification
            </strong>
            <p style={{ fontSize: '0.85rem', color: '#92400e', margin: '5px 0 0' }}>
              Review and verify payments to grant customers access to their purchases.
            </p>
          </div>
        </div>
      )}

      <div className="admin-data-card">
        {filteredOrders.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-shopping-cart"></i>
            <p>No orders yet</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id} style={{ background: order.status === 'pending' ? '#fffbeb' : 'transparent' }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div>{order.userName || 'Guest'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {order.user}
                    </div>
                  </td>
                  <td>{formatDate(order._createdAt)}</td>
                  <td>
                    {order.items?.length || 0} item(s)
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ₱{(order.total || 0).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ 
                        background: '#f3f4f6', 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                      {order.paymentReference && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                          Ref: {order.paymentReference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status || 'pending')}
                    </span>
                    {order.accessGranted && (
                      <div style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '4px' }}>
                        <i className="fas fa-check-circle"></i> Access Granted
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerifyPayment(order._id)}
                            disabled={verifyingPayment === order._id}
                            style={{
                              padding: '6px 12px',
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          >
                            <i className="fas fa-check"></i> Verify
                          </button>
                          <button
                            onClick={() => handleRejectPayment(order._id)}
                            disabled={verifyingPayment === order._id}
                            style={{
                              padding: '6px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </>
                      )}
                      <Link 
                        to={`/admin/orders/${order._id}`}
                        className="admin-action-btn secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <i className="fas fa-eye"></i> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-pagination">
        <span>Showing {filteredOrders.length} of {orders.length} orders</span>
      </div>

      {/* Custom Date Range Modal */}
      {showDateModal && (
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
          onClick={() => setShowDateModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Select Date Range</h3>
              <button
                onClick={() => setShowDateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="admin-form-group" style={{ marginBottom: '20px' }}>
              <label className="admin-form-label">Start Date</label>
              <input
                type="date"
                className="admin-form-input"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="admin-form-group" style={{ marginBottom: '25px' }}>
              <label className="admin-form-label">End Date</label>
              <input
                type="date"
                className="admin-form-input"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDateModal(false)}
                className="admin-action-btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStartDate(tempStartDate);
                  setEndDate(tempEndDate);
                  setDateRange('custom');
                  setShowDateModal(false);
                }}
                className="admin-action-btn"
                disabled={!tempStartDate && !tempEndDate}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOrders;
