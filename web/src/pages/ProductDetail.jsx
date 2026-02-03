import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, getProducts, urlFor, getProductReviews, createReview, hasUserReviewed, addToWishlist as addToWishlistAPI, removeFromWishlist as removeFromWishlistAPI } from '../services/sanityClient';
import ProductCard from '../components/common/ProductCard';
import useStore from '../hooks/useStore';
import '../assets/css/product-detail.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const addToCart = useStore((state) => state.addToCart);
  const addToRecentlyViewed = useStore((state) => state.addToRecentlyViewed);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const isInWishlist = useStore((state) => state.isInWishlist);
  const user = useStore((state) => state.user);
  
  // Reviews state
  const [activeTab, setActiveTab] = useState('features');
  const [reviews, setReviews] = useState([]);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await getProductBySlug(slug);
        if (data) {
          setProduct(data);
          // Track recently viewed
          addToRecentlyViewed({
            _id: data._id,
            title: data.title,
            price: data.price,
            category: data.category,
            slug: data.slug,
            images: data.images,
          });
          // Fetch related products
          const allProducts = await getProducts();
          setRelatedProducts(allProducts.filter(p => p._id !== data._id).slice(0, 3));
        } else {
          // Use mock data for demo
          setMockProduct();
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setMockProduct();
      } finally {
        setLoading(false);
      }
    };

    const setMockProduct = () => {
      setProduct({
        _id: slug,
        title: 'Sewing Pattern Automation Script',
        category: 'Photoshop Scripts',
        price: 2500,
        comparePrice: 3500,
        description: 'Automate your sewing pattern creation in Photoshop. This script helps sublimation and printing businesses create patterns quickly and efficiently. Save hours of manual work with our powerful automation tool.',
        images: [
          { asset: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' } },
        ],
        fileType: 'jsx',
        fileSize: '2.5 MB',
        compatibility: 'Photoshop CC 2020+',
        features: [
          { title: 'One-Click Pattern Generation', description: 'Generate complex patterns with a single click' },
          { title: 'Customizable Settings', description: 'Adjust size, spacing, and rotation parameters' },
          { title: 'Batch Processing', description: 'Process multiple designs at once' },
          { title: 'Export Options', description: 'Export to PNG, JPG, or PSD formats' },
        ],
        accessInstructions: '1. Download the .jsx file\n2. Open Photoshop\n3. Go to File > Scripts > Browse\n4. Select the downloaded script\n5. Follow the on-screen instructions',
      });
      setRelatedProducts([]);
    };

    fetchProduct();
  }, [slug]);

  // Fetch reviews when product is loaded
  useEffect(() => {
    const fetchReviews = async () => {
      if (product?._id) {
        const productReviews = await getProductReviews(product._id);
        setReviews(productReviews);
        
        // Check if user has already reviewed
        if (user?.email) {
          const reviewed = await hasUserReviewed(product._id, user.email);
          setUserHasReviewed(reviewed);
        }
      }
    };
    fetchReviews();
  }, [product?._id, user?.email]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmittingReview(true);
    try {
      await createReview({
        productId: product._id,
        userEmail: user.email,
        userName: user.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      
      setReviewSuccess(true);
      setReviewForm({ rating: 5, comment: '' });
      setUserHasReviewed(true);
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatReviewDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating, interactive = false, onSelect = null) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={star <= rating ? 'fas fa-star' : 'far fa-star'}
            style={{ 
              color: star <= rating ? '#f59e0b' : '#d1d5db',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: interactive ? '1.5rem' : '1rem'
            }}
            onClick={() => interactive && onSelect && onSelect(star)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(800).url();
    } catch {
      return 'https://via.placeholder.com/800x800?text=No+Image';
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'jsx': return 'fa-file-code';
      case 'atn': return 'fa-magic';
      case 'zip': return 'fa-file-archive';
      case 'pdf': return 'fa-file-pdf';
      default: return 'fa-file';
    }
  };

  const getFileTypeLabel = (fileType) => {
    const labels = {
      jsx: 'Photoshop Script (.jsx)',
      atn: 'Photoshop Action (.atn)',
      zip: 'ZIP Archive',
      pdf: 'PDF Document',
    };
    return labels[fileType] || 'Digital File';
  };

  const handleAddToCart = () => {
    addToCart({
      _id: product._id,
      title: product.title,
      price: product.price,
      image: getImageUrl(product.images?.[0]),
      category: product.category,
      slug: slug,
    }, 1); // Digital products always quantity 1
  };

  const handleToggleWishlist = async () => {
    const productData = {
      _id: product._id,
      title: product.title,
      price: product.price,
      category: product.category,
      slug: product.slug,
      images: product.images,
      image: getImageUrl(product.images?.[0]),
    };
    
    const wasInWishlist = isInWishlist(product._id);
    toggleWishlist(productData);
    
    // Sync with Sanity if user is logged in
    if (user?._id) {
      try {
        if (wasInWishlist) {
          await removeFromWishlistAPI(user._id, product._id);
        } else {
          await addToWishlistAPI(user._id, product._id);
        }
      } catch (error) {
        console.error('Error syncing wishlist:', error);
      }
    }
  };

  const inWishlist = product ? isInWishlist(product._id) : false;

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#ccc' }}></i>
        <p style={{ marginTop: '15px', color: '#888' }}>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link to="/shop" className="btn" style={{ marginTop: '20px' }}><span>Back to Shop</span></Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="container" style={{ marginTop: '130px', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
        <Link to="/">Home</Link> / <Link to="/shop">{product.category}</Link> / <span style={{ color: 'var(--primary)' }}>{product.title}</span>
      </div>

      {/* Product Detail */}
      <section className="container product-detail-grid">
        {/* Gallery */}
        <div className="gallery-container">
          <div className="main-image-wrapper">
            <img 
              src={getImageUrl(product.images?.[selectedImage])} 
              alt={product.title} 
              className="main-image"
            />
            {/* Digital Product Badge */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              background: '#111',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              <i className="fas fa-download" style={{ marginRight: '6px' }}></i>
              Digital Download
            </div>
          </div>
          {product.images?.length > 1 && (
            <div className="thumbnails">
              {product.images.map((image, index) => (
                <img 
                  key={index}
                  src={getImageUrl(image)} 
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  alt={`View ${index + 1}`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info-col">
          <span style={{ color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{product.title}</h1>
          
          {/* Price */}
          <div className="price" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>₱{product.price?.toLocaleString()}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.2rem' }}>
                ₱{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '1.05rem', lineHeight: 1.8 }}>
            {product.description}
          </p>

          {/* Digital Product Info */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px', 
            marginBottom: '25px' 
          }}>
            {product.fileType && (
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '5px' }}>File Type</div>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={`fas ${getFileTypeIcon(product.fileType)}`}></i>
                  {getFileTypeLabel(product.fileType)}
                </div>
              </div>
            )}
            {product.fileSize && (
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '5px' }}>File Size</div>
                <div style={{ fontWeight: 600 }}>
                  <i className="fas fa-hdd" style={{ marginRight: '8px' }}></i>
                  {product.fileSize}
                </div>
              </div>
            )}
            {product.compatibility && (
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '5px' }}>Compatibility</div>
                <div style={{ fontWeight: 600 }}>
                  <i className="fab fa-adobe" style={{ marginRight: '8px' }}></i>
                  {product.compatibility}
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
            <button className="btn add-to-cart" style={{ flex: 1, padding: '18px' }} onClick={handleAddToCart}>
              <span>Add to Cart - ₱{product.price?.toLocaleString()}</span>
            </button>
            <button 
              onClick={handleToggleWishlist}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              style={{
                width: '60px',
                border: '1px solid var(--border)',
                background: inWishlist ? '#fef2f2' : 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <i 
                className={inWishlist ? 'fas fa-heart' : 'far fa-heart'} 
                style={{ 
                  color: inWishlist ? '#ef4444' : '#666',
                  fontSize: '1.3rem'
                }}
              ></i>
            </button>
          </div>

          {/* Instant Delivery Info */}
          <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <i className="fas fa-bolt" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i>
              <strong style={{ color: '#166534' }}>Instant Digital Delivery</strong>
            </div>
            <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0 }}>
              Get immediate access to your files via Google Drive after payment verification.
            </p>
          </div>

          {/* Demo Video */}
          {product.demoVideo && (
            <div style={{ marginBottom: '25px' }}>
              <a 
                href={product.demoVideo} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#111',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <i className="fab fa-youtube" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i>
                Watch Demo Video
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.8rem' }}></i>
              </a>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            <div className="tab-headers">
              <button 
                className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                Features
              </button>
              <button 
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({reviews.length})
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'features' ? (
                <div>
                  {product.features && product.features.length > 0 ? (
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {product.features.map((feature, index) => (
                        <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            background: '#111',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <i className="fas fa-check" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <div>
                            <h4 style={{ fontWeight: 600, marginBottom: '5px' }}>{feature.title}</h4>
                            {feature.description && (
                              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>{feature.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>No feature details available for this product.</p>
                  )}

                  {/* Access Instructions */}
                  {product.accessInstructions && (
                    <div style={{ marginTop: '25px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-info-circle" style={{ color: '#6b7280' }}></i>
                        How to Use
                      </h4>
                      <p style={{ color: '#555', whiteSpace: 'pre-line', lineHeight: 1.8, margin: 0 }}>
                        {product.accessInstructions}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Review Summary */}
                  {reviews.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{averageRating}</div>
                      <div>
                        {renderStars(Math.round(averageRating))}
                        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9rem' }}>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}

                  {/* Write Review Form */}
                  {user ? (
                    userHasReviewed ? (
                      reviewSuccess ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
                          <i className="fas fa-check-circle" style={{ color: '#22c55e', marginRight: '10px' }}></i>
                          Thank you for your review! It will appear after approval.
                        </div>
                      ) : (
                        <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '25px', color: '#666' }}>
                          <i className="fas fa-check" style={{ marginRight: '10px' }}></i>
                          You have already reviewed this product.
                        </div>
                      )
                    ) : (
                      <form onSubmit={handleSubmitReview} style={{ background: '#f9fafb', padding: '25px', borderRadius: '8px', marginBottom: '25px' }}>
                        <h4 style={{ marginBottom: '20px' }}>Write a Review</h4>
                        
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Rating</label>
                          {renderStars(reviewForm.rating, true, (rating) => setReviewForm({ ...reviewForm, rating }))}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Your Review *</label>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder="How did this product help your workflow?"
                            required
                            rows={4}
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '1rem', resize: 'vertical' }}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn"
                          disabled={submittingReview || !reviewForm.comment}
                          style={{ padding: '12px 30px' }}
                        >
                          <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
                        </button>
                      </form>
                    )
                  ) : (
                    <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '25px', textAlign: 'center' }}>
                      <p style={{ marginBottom: '15px' }}>Please sign in to write a review</p>
                      <Link to="/login" className="btn" style={{ display: 'inline-block' }}><span>Sign In</span></Link>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviews.length > 0 ? (
                    <div>
                      {reviews.map((review) => (
                        <div key={review._id} style={{ paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                <strong>{review.userName || 'Anonymous'}</strong>
                                {review.isVerifiedPurchase && (
                                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px' }}>
                                    Verified Purchase
                                  </span>
                                )}
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            <span style={{ color: '#888', fontSize: '0.85rem' }}>{formatReviewDate(review._createdAt)}</span>
                          </div>
                          <p style={{ color: '#555', lineHeight: 1.6 }}>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>
                      No reviews yet. Be the first to review this product!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container" style={{ margin: '100px auto' }}>
          <div className="section-title">
            <h3>You May Also Like</h3>
          </div>
          <div className="product-grid">
            {relatedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetail;
