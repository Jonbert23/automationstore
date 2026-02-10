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
      <div className="dashboard-welcome-banner" style={{ 
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
        <h1 className="dashboard-welcome-title" style={{ marginBottom: '10px', position: 'relative' }}>
          {getGreeting()}, {firstName}! <span className="dashboard-welcome-emoji">👋</span>
        </h1>
        <p className="dashboard-welcome-text" style={{ color: '#9ca3af', position: 'relative' }}>
          Ready to elevate your game? We've got fresh drops and exclusive deals waiting just for you.
        </p>
      </div>

      {/* New Products Section */}
      {newProducts.length > 0 && (
        <div className="account-card" style={{ marginBottom: '30px' }}>
          <div className="account-card-header dashboard-new-arrivals-header">
            <div>
              <h3 className="account-card-title dashboard-new-arrivals-title" style={{ marginBottom: '5px' }}>New Arrivals Just For You</h3>
              <p className="dashboard-new-arrivals-subtitle" style={{ color: '#6b7280', fontSize: '0.9rem' }}>Check out our latest products handpicked for you</p>
            </div>
            <Link to="/shop" className="dashboard-view-all-link" style={{ color: '#111', fontWeight: 600, fontSize: '0.9rem' }}>
              View All →
            </Link>
          </div>
          <div className="account-card-body">
            <div className="dashboard-new-arrivals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {newProducts.map((product) => (
                <div key={product._id} className="dashboard-new-arrivals-card" style={{ background: '#f9fafb', borderRadius: '12px', overflow: 'hidden' }}>
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

      {/* Recent Orders - dark card layout */}
      <div className="dashboard-recent-orders-card">
        <div className="dashboard-recent-orders-header">
          <h3 className="dashboard-recent-orders-title">Recent Orders</h3>
          <Link to="/account/orders" className="dashboard-recent-orders-viewall">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-recent-orders-loading">
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="dashboard-recent-orders-empty">
            <i className="fas fa-box-open"></i>
            <p>No orders yet</p>
            <Link to="/shop" className="account-action-btn">Start Shopping</Link>
          </div>
        ) : (
          <div className="dashboard-recent-orders-list">
            <table className="dashboard-recent-orders-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Items</th>
                  <th scope="col">Order #</th>
                  <th scope="col">Total</th>
                  <th scope="col" aria-label="Action"></th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => {
                  const firstItem = order.items?.[0];
                  const product = firstItem?.product;
                  const thumbUrl = product?.images?.[0] ? getImageUrl(product.images[0]) : null;
                  const title = product?.title || 'Order';
                  const orderNum = `#${order._id.slice(-6).toUpperCase()}`;
                  const itemCount = order.items?.length ?? 0;
                  return (
                    <tr key={order._id} className="dashboard-recent-order-row">
                      <td className="dashboard-recent-order-product" data-label="Product">
                        <div className="dashboard-recent-order-thumb">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt="" />
                          ) : (
                            <div className="dashboard-recent-order-thumb-placeholder">
                              <i className="fas fa-receipt" />
                            </div>
                          )}
                        </div>
                        <div className="dashboard-recent-order-title">{title}</div>
                      </td>
                      <td className="dashboard-recent-order-meta-cell" data-label="Items">{itemCount} item{itemCount !== 1 ? 's' : ''}</td>
                      <td className="dashboard-recent-order-num-cell" data-label="Order #">{orderNum}</td>
                      <td className="dashboard-recent-order-price-cell" data-label="Total">₱{order.total?.toLocaleString()}</td>
                      <td className="dashboard-recent-order-action" data-label="">
                        <Link
                          to={`/account/orders/${order._id}`}
                          className="dashboard-recent-order-view"
                          aria-label="View order"
                        >
                          <span className="dashboard-recent-order-view-text">View</span>
                          <i className="fas fa-eye dashboard-recent-order-view-icon" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
