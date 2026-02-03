import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client, urlFor } from '../../services/sanityClient';

const AdminCustomerView = () => {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      // Fetch customer
      const userData = await client.fetch(
        `*[_type == "user" && _id == $id][0]{
          _id,
          _createdAt,
          name,
          email,
          picture,
          authType,
          addresses,
          "wishlist": wishlist[]->{ _id, title, price, images }
        }`,
        { id: customerId }
      );

      if (userData) {
        // Fetch customer orders
        const customerOrders = await client.fetch(
          `*[_type == "order" && user == $email] | order(_createdAt desc){
            _id,
            _createdAt,
            total,
            status,
            items[]{
              quantity,
              price,
              "product": product->{ title }
            }
          }`,
          { email: userData.email }
        );

        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        setCustomer({
          ...userData,
          totalSpent,
          ordersCount: customerOrders.length
        });
        setOrders(customerOrders);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'admin-status-active';
      case 'shipped':
      case 'processing':
        return 'admin-status-pending';
      case 'cancelled':
        return 'admin-status-out-of-stock';
      default:
        return 'admin-status-pending';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading customer...
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <i className="fas fa-user-slash" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '20px' }}></i>
        <h2>Customer not found</h2>
        <Link to="/admin/customers" className="admin-action-btn" style={{ marginTop: '20px' }}>
          <i className="fas fa-arrow-left"></i> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/admin/customers" style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="admin-page-title">Customer Details</h1>
        </div>
        <a 
          href={`mailto:${customer.email}`} 
          className="admin-action-btn"
        >
          <i className="fas fa-envelope"></i> Send Email
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Left Column - Customer Info */}
        <div>
          {/* Profile Card */}
          <div className="admin-data-card" style={{ padding: '30px', textAlign: 'center' }}>
            {customer.picture ? (
              <img 
                src={customer.picture} 
                alt={customer.name}
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }}
              />
            ) : (
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '2rem',
                margin: '0 auto 15px'
              }}>
                {getInitials(customer.name)}
              </div>
            )}
            <h2 style={{ marginBottom: '5px' }}>{customer.name || 'Unnamed'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>{customer.email}</p>
            <span style={{ 
              display: 'inline-block',
              padding: '4px 12px', 
              background: customer.authType === 'google' ? '#ea4335' : 'var(--primary)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {customer.authType === 'google' ? 'Google' : 'Email'} Account
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '15px' }}>
              Customer since {formatDate(customer._createdAt)}
            </p>
          </div>

          {/* Stats */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '20px' }}>
            <h3 className="admin-form-section-title">Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {customer.ordersCount}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Orders</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  ${customer.totalSpent.toFixed(0)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Spent</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                ${customer.ordersCount > 0 ? (customer.totalSpent / customer.ordersCount).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avg. Order Value</div>
            </div>
          </div>

          {/* Addresses */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '20px' }}>
            <h3 className="admin-form-section-title">Addresses ({customer.addresses?.length || 0})</h3>
            {customer.addresses?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {customer.addresses.map((addr, index) => (
                  <div key={index} style={{ 
                    padding: '15px', 
                    background: '#f9fafb', 
                    borderRadius: '8px',
                    border: addr.isDefault ? '2px solid var(--primary)' : '1px solid var(--border)'
                  }}>
                    {addr.isDefault && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '10px',
                        marginBottom: '8px',
                        display: 'inline-block'
                      }}>
                        Default
                      </span>
                    )}
                    <p style={{ fontWeight: 600 }}>{addr.label}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {addr.street}<br />
                      {addr.city}, {addr.state} {addr.zip}<br />
                      {addr.country}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No addresses saved</p>
            )}
          </div>
        </div>

        {/* Right Column - Orders & Wishlist */}
        <div>
          {/* Order History */}
          <div className="admin-data-card" style={{ padding: '30px' }}>
            <h3 className="admin-form-section-title">Order History</h3>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <i className="fas fa-shopping-bag" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                <p>No orders yet</p>
              </div>
            ) : (
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 600 }}>#{order._id.slice(-6).toUpperCase()}</td>
                      <td>{formatDate(order._createdAt)}</td>
                      <td>{order.items?.length || 0}</td>
                      <td style={{ fontWeight: 600 }}>${order.total?.toFixed(2)}</td>
                      <td>
                        <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/orders/${order._id}`} style={{ color: 'var(--primary)' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Wishlist */}
          <div className="admin-data-card" style={{ padding: '30px', marginTop: '20px' }}>
            <h3 className="admin-form-section-title">Wishlist ({customer.wishlist?.length || 0})</h3>
            {customer.wishlist?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {customer.wishlist.map((product) => (
                  <div key={product._id} style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    padding: '12px', 
                    background: '#f9fafb', 
                    borderRadius: '8px' 
                  }}>
                    <img 
                      src={product.images?.[0] ? urlFor(product.images[0]).width(60).url() : 'https://via.placeholder.com/60'}
                      alt={product.title}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.title}</p>
                      <p style={{ color: 'var(--primary)', fontWeight: 600 }}>${product.price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Wishlist is empty</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCustomerView;
