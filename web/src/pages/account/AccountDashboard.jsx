import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { getUserOrders, getProducts, urlFor } from '../../services/sanityClient';

const AccountDashboard = () => {
  const { user, addToCart } = useStore();
  const [orders, setOrders] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders
        const userOrders = await getUserOrders(user.email);
        setOrders(userOrders);
        
        // Fetch newest products
        const allProducts = await getProducts();
        // Sort by creation date and get the 4 newest
        const sorted = allProducts.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt));
        setNewProducts(sorted.slice(0, 4));
      } catch (error) {
        console.error('Error fetching data:', error);
        setOrders([]);
        setNewProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(300).url();
    } catch {
      return 'https://via.placeholder.com/300x300?text=No+Image';
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      _id: product._id,
      title: product.title,
      price: product.price,
      image: getImageUrl(product.images?.[0]),
      category: product.category,
      slug: product.slug?.current,
    }, 1);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <>
      {/* Welcome Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', 
        borderRadius: '16px', 
        padding: '40px',
        marginBottom: '30px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', 
          right: '-50px', 
          top: '-50px', 
          width: '200px', 
          height: '200px', 
          background: 'var(--accent)', 
          borderRadius: '50%', 
          opacity: 0.1 
        }} />
        <div style={{ 
          position: 'absolute', 
          right: '50px', 
          bottom: '-30px', 
          width: '100px', 
          height: '100px', 
          background: 'var(--accent)', 
          borderRadius: '50%', 
          opacity: 0.1 
        }} />
        <h1 style={{ fontSize: '2rem', marginBottom: '10px', position: 'relative' }}>
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem', position: 'relative' }}>
          Ready to elevate your game? We've got fresh drops and exclusive deals waiting just for you.
        </p>
      </div>

      {/* New Products Section */}
      {newProducts.length > 0 && (
        <div className="account-card" style={{ marginBottom: '30px' }}>
          <div className="account-card-header">
            <div>
              <h3 className="account-card-title" style={{ marginBottom: '5px' }}>New Arrivals Just For You</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Check out our latest products handpicked for you</p>
            </div>
            <Link to="/shop" style={{ color: '#111', fontWeight: 600, fontSize: '0.9rem' }}>
              View All →
            </Link>
          </div>
          <div className="account-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {newProducts.map((product) => (
                <div key={product._id} style={{ background: '#f9fafb', borderRadius: '12px', overflow: 'hidden' }}>
                  <Link to={`/product/${product.slug?.current}`}>
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.title}
                      style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    />
                  </Link>
                  <div style={{ padding: '15px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>
                      {product.category}
                    </p>
                    <Link 
                      to={`/product/${product.slug?.current}`}
                      style={{ fontWeight: 600, color: '#111', textDecoration: 'none', display: 'block', marginBottom: '8px', fontSize: '0.95rem' }}
                    >
                      {product.title}
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>₱{product.price?.toLocaleString()}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        style={{
                          background: '#111',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="account-card">
        <div className="account-card-header">
          <h3 className="account-card-title">Recent Orders</h3>
          <Link to="/account/orders" style={{ color: '#111', fontWeight: 600, fontSize: '0.9rem' }}>
            View All →
          </Link>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
            <p style={{ marginTop: '10px' }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '15px' }}></i>
            <p style={{ color: '#6b7280', marginBottom: '15px' }}>No orders yet</p>
            <Link to="/shop" className="account-action-btn">Start Shopping</Link>
          </div>
        ) : (
          <table className="account-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order._id}>
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

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <Link to="/account/addresses" className="account-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none' }}>
          <i className="fas fa-map-marker-alt" style={{ fontSize: '1.5rem', color: '#6b7280' }}></i>
          <div>
            <h4 style={{ marginBottom: '5px' }}>Manage Addresses</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Add or edit your shipping addresses</p>
          </div>
          <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', color: '#9ca3af' }}></i>
        </Link>
        <Link to="/account/wishlist" className="account-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none' }}>
          <i className="fas fa-heart" style={{ fontSize: '1.5rem', color: '#6b7280' }}></i>
          <div>
            <h4 style={{ marginBottom: '5px' }}>View Wishlist</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Products you've saved for later</p>
          </div>
          <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', color: '#9ca3af' }}></i>
        </Link>
      </div>
    </>
  );
};

export default AccountDashboard;
