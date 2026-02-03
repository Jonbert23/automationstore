import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { removeFromWishlist as removeFromWishlistAPI, urlFor } from '../../services/sanityClient';

const AccountWishlist = () => {
  const { user, addToCart, wishlist, removeFromWishlist } = useStore();

  const getImageUrl = (product) => {
    if (product.image) return product.image;
    if (product.images?.[0]?.asset?.url) return product.images[0].asset.url;
    if (product.images?.[0]) {
      try {
        return urlFor(product.images[0]).width(600).url();
      } catch {
        return 'https://via.placeholder.com/600x600?text=No+Image';
      }
    }
    return 'https://via.placeholder.com/600x600?text=No+Image';
  };

  const handleRemoveFromWishlist = async (productId) => {
    // Remove from local store
    removeFromWishlist(productId);
    
    // Sync with Sanity if user is logged in
    if (user?._id) {
      try {
        await removeFromWishlistAPI(user._id, productId);
      } catch (error) {
        console.error('Error syncing wishlist removal:', error);
      }
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      _id: product._id,
      title: product.title,
      price: product.price,
      image: getImageUrl(product),
      category: product.category,
      slug: product.slug?.current || product.slug || product._id,
    });
  };

  const getProductSlug = (product) => {
    if (product.slug?.current) return product.slug.current;
    if (typeof product.slug === 'string') return product.slug;
    return product._id;
  };

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">Wishlist</h1>
        {wishlist.length > 0 && (
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="account-card" style={{ padding: '60px', textAlign: 'center' }}>
          <i className="fas fa-heart" style={{ fontSize: '4rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
          <h3 style={{ marginBottom: '10px' }}>Your wishlist is empty</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Save items you love to buy them later.</p>
          <Link to="/shop" className="account-action-btn">Browse Products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div key={product._id} className="wishlist-card">
              <div className="wishlist-image">
                <Link to={`/product/${getProductSlug(product)}`}>
                  <img 
                    src={getImageUrl(product)} 
                    alt={product.title}
                  />
                </Link>
                <button 
                  className="wishlist-remove"
                  onClick={() => handleRemoveFromWishlist(product._id)}
                  title="Remove from wishlist"
                >
                  <i className="fas fa-heart"></i>
                </button>
              </div>
              <div className="wishlist-info">
                <div className="wishlist-category">{product.category}</div>
                <h3 className="wishlist-title">
                  <Link to={`/product/${getProductSlug(product)}`}>
                    {product.title}
                  </Link>
                </h3>
                <div className="wishlist-footer">
                  <div className="wishlist-price">₱{product.price?.toLocaleString()}</div>
                  <button 
                    className="account-action-btn" 
                    style={{ padding: '8px 15px', fontSize: '0.8rem' }}
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
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

export default AccountWishlist;
