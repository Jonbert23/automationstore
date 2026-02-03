import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { urlFor } from '../../services/sanityClient';

const AccountRecentlyViewed = () => {
  const { recentlyViewed, clearRecentlyViewed, addToCart } = useStore();

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(200).url();
    } catch {
      return 'https://via.placeholder.com/200x200?text=No+Image';
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

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">Recently Viewed</h1>
        {recentlyViewed.length > 0 && (
          <button 
            onClick={clearRecentlyViewed}
            className="account-action-btn"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
          >
            Clear All
          </button>
        )}
      </div>

      {recentlyViewed.length === 0 ? (
        <div className="account-card">
          <div className="account-card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <i className="fas fa-history" style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No recently viewed products</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Products you view will appear here.</p>
            <Link to="/shop" className="account-action-btn" style={{ background: '#111', color: 'white' }}>
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {recentlyViewed.map((product) => (
            <div key={product._id} className="account-card" style={{ overflow: 'hidden' }}>
              <Link to={`/product/${product.slug?.current || product._id}`}>
                <img
                  src={getImageUrl(product.images?.[0])}
                  alt={product.title}
                  style={{ 
                    width: '100%', 
                    height: '180px', 
                    objectFit: 'cover',
                    background: '#f4f4f4'
                  }}
                />
              </Link>
              <div style={{ padding: '15px' }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {product.category}
                </p>
                <Link 
                  to={`/product/${product.slug?.current || product._id}`}
                  style={{ fontWeight: 600, color: '#111', textDecoration: 'none', display: 'block', marginBottom: '8px' }}
                >
                  {product.title}
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₱{product.price?.toLocaleString()}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={{
                      background: '#111',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <i className="fas fa-shopping-bag"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AccountRecentlyViewed;
