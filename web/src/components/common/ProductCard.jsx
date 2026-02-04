import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import useUIStore from '../../hooks/useUIStore';
import { urlFor, addToWishlist as addToWishlistAPI, removeFromWishlist as removeFromWishlistAPI } from '../../services/sanityClient';

const ProductCard = ({ product }) => {
  const addToCart = useStore((state) => state.addToCart);
  const startAnimation = useUIStore((state) => state.startAnimation);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const isInWishlist = useStore((state) => state.isInWishlist);
  const user = useStore((state) => state.user);

  // Handle both mock data and Sanity data formats
  const getImageUrl = () => {
    if (product.image) return product.image; // Mock data format
    if (product.images?.[0]?.asset?.url) return product.images[0].asset.url; // Direct URL
    if (product.images?.[0]) {
      try {
        return urlFor(product.images[0]).width(600).url();
      } catch {
        return 'https://via.placeholder.com/600x600?text=No+Image';
      }
    }
    return 'https://via.placeholder.com/600x600?text=No+Image';
  };

  const getProductSlug = () => {
    if (product.slug?.current) return product.slug.current;
    if (typeof product.slug === 'string') return product.slug;
    return product._id || product.id;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Start animation
    const imgElement = e.currentTarget.closest('.product-card').querySelector('img');
    if (imgElement) {
      const rect = imgElement.getBoundingClientRect();
      startAnimation(rect, getImageUrl());
    }

    addToCart({
      _id: product._id || product.id,
      title: product.title,
      price: product.price,
      image: getImageUrl(),
      category: product.category,
      slug: getProductSlug(),
    });
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productData = {
      _id: product._id || product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      slug: product.slug,
      images: product.images,
      image: getImageUrl(),
    };
    
    const wasInWishlist = isInWishlist(productData._id);
    toggleWishlist(productData);
    
    // Sync with Sanity if user is logged in
    if (user?._id) {
      try {
        if (wasInWishlist) {
          await removeFromWishlistAPI(user._id, productData._id);
        } else {
          await addToWishlistAPI(user._id, productData._id);
        }
      } catch (error) {
        console.error('Error syncing wishlist:', error);
      }
    }
  };

  const inWishlist = isInWishlist(product._id || product.id);

  return (
    <div className="product-card">
      <div className="product-image">
        <Link to={`/product/${getProductSlug()}`}>
          <img src={getImageUrl()} alt={product.title} />
        </Link>
        <button 
          className="wishlist-btn"
          onClick={handleToggleWishlist}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            transition: 'transform 0.2s'
          }}
        >
          <i 
            className={inWishlist ? 'fas fa-heart' : 'far fa-heart'} 
            style={{ 
              color: inWishlist ? '#ef4444' : '#666',
              fontSize: '1.1rem'
            }}
          ></i>
        </button>
        <div className="product-actions">
          <button className="btn add-to-cart" onClick={handleAddToCart}>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3><Link to={`/product/${getProductSlug()}`}>{product.title}</Link></h3>
        <div className="product-price">
          ₱{product.price?.toLocaleString()}
          {product.comparePrice && product.comparePrice > product.price && (
            <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: '10px', fontSize: '0.9rem' }}>
              ₱{product.comparePrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
