import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { getUserOrders, urlFor } from '../../services/sanityClient';

const AccountOrders = () => {
  const { user } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userOrders = await getUserOrders(user.email);
        setOrders(userOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(80).url();
    } catch {
      return 'https://via.placeholder.com/80x80?text=No+Image';
    }
  };

  // Filter orders based on search, status, and date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter - by order ID or product name
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const orderIdMatch = order._id.toLowerCase().includes(searchLower);
        const productMatch = order.items?.some(item => 
          item.product?.title?.toLowerCase().includes(searchLower)
        );
        if (!orderIdMatch && !productMatch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Date range filter
      const orderDate = new Date(order._createdAt);
      
      if (dateRange === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      } else if (dateRange !== 'all') {
        const now = new Date();
        const daysAgo = new Date();
        
        if (dateRange === 'today') {
          daysAgo.setHours(0, 0, 0, 0);
        } else {
          const days = parseInt(dateRange);
          daysAgo.setDate(now.getDate() - days);
        }

        if (orderDate < daysAgo) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, dateRange, startDate, endDate]);

  const handleDateRangeChange = (e) => {
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
  };

  const applyCustomDateRange = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setDateRange('custom');
    setShowDateModal(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange !== 'all';

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">Order History</h1>
      </div>

      {/* Filters */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.9rem',
              maxWidth: '200px'
            }}
          />
          
          <select
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.9rem',
              background: 'white',
              cursor: 'pointer',
              maxWidth: '160px'
            }}
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
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#0369a1',
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.9rem',
              background: 'white',
              cursor: 'pointer',
              maxWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Clear Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#6b7280' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      )}

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
                  color: '#6b7280'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Start Date</label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>End Date</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDateModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={applyCustomDateRange}
                disabled={!tempStartDate && !tempEndDate}
                style={{
                  padding: '10px 20px',
                  background: '#111',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  opacity: (!tempStartDate && !tempEndDate) ? 0.5 : 1
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="account-card">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '15px' }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fas fa-box-open" style={{ fontSize: '4rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No orders yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Start shopping to see your orders here.</p>
            <Link to="/shop" className="account-action-btn">Browse Products</Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fas fa-search" style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No matching orders</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="account-action-btn">Clear Filters</button>
          </div>
        ) : (
          <table className="account-table">
            <thead>
              <tr>
                <th>Products</th>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {order.items?.slice(0, 2).map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={getImageUrl(item.product?.images?.[0])}
                            alt={item.product?.title || 'Product'}
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'cover', 
                              borderRadius: '6px',
                              background: '#e5e7eb'
                            }}
                          />
                          <div style={{ maxWidth: '120px' }}>
                            <p style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.product?.title || 'Product'}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <span style={{ color: '#6b7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          +{order.items.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>#{order._id.slice(-6).toUpperCase()}</td>
                  <td>{new Date(order._createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₱{order.total?.toLocaleString()}</td>
                  <td>
                    <Link to={`/account/orders/${order._id}`} style={{ textDecoration: 'underline', fontWeight: 600 }}>
                      View Details
                    </Link>
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

export default AccountOrders;
