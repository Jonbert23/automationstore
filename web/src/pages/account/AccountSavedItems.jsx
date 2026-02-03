import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { urlFor } from '../../services/sanityClient';

const AccountSavedItems = () => {
  const { savedForLater, removeFromSavedForLater, moveToCart } = useStore();

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(200).url();
    } catch {
      return 'https://via.placeholder.com/200x200?text=No+Image';
    }
  };

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">Saved for Later</h1>
        <span style={{ color: '#6b7280' }}>{savedForLater.length} item{savedForLater.length !== 1 ? 's' : ''}</span>
      </div>

      {savedForLater.length === 0 ? (
        <div className="account-card">
          <div className="account-card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <i className="fas fa-bookmark" style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No saved items</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Items you save for later will appear here.</p>
            <Link to="/shop" className="account-action-btn" style={{ background: '#111', color: 'white' }}>
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="account-card">
          <div className="account-card-body" style={{ padding: 0 }}>
            {savedForLater.map((product) => (
              <div 
                key={product._id} 
                style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  padding: '25px 30px',
                  borderBottom: '1px solid #e5e7eb',
                  alignItems: 'center'
                }}
              >
                <Link to={`/product/${product.slug || product._id}`}>
                  <img
                    src={product.image || getImageUrl(product.images?.[0])}
                    alt={product.title}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      background: '#f4f4f4'
                    }}
                  />
                </Link>
                
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>
                    {product.category}
                  </p>
                  <Link 
                    to={`/product/${product.slug || product._id}`}
                    style={{ fontWeight: 600, fontSize: '1.1rem', color: '#111', textDecoration: 'none', display: 'block', marginBottom: '5px' }}
                  >
                    {product.title}
                  </Link>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₱{product.price?.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => moveToCart(product)}
                    className="account-action-btn"
                    style={{ background: '#111', color: 'white' }}
                  >
                    <i className="fas fa-shopping-bag"></i> Move to Cart
                  </button>
                  <button
                    onClick={() => removeFromSavedForLater(product._id)}
                    className="account-action-btn"
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AccountSavedItems;
