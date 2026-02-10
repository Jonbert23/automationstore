import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { client, urlFor } from '../../services/sanityClient';
import useStore from '../../hooks/useStore';

const AccountReviews = () => {
  const { user } = useStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const data = await client.fetch(`
          *[_type == "review" && user == $email] | order(_createdAt desc) {
            _id,
            _createdAt,
            rating,
            comment,
            isApproved,
            "product": product->{ _id, title, slug, images, price }
          }
        `, { email: user.email });
        
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [user?.email]);

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(80).url();
    } catch {
      return 'https://via.placeholder.com/80x80?text=No+Image';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={star <= rating ? 'fas fa-star' : 'far fa-star'}
            style={{ color: star <= rating ? '#f59e0b' : '#d1d5db', fontSize: '0.9rem' }}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
        <p style={{ marginTop: '15px' }}>Loading reviews...</p>
      </div>
    );
  }

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">My Reviews</h1>
        <span style={{ color: '#6b7280' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      {reviews.length === 0 ? (
        <div className="account-card">
          <div className="account-card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <i className="fas fa-star" style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No reviews yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>You haven't reviewed any products yet.</p>
            <Link to="/shop" className="account-action-btn" style={{ background: '#111', color: 'white' }}>
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: list layout */}
          <div className="account-reviews-desktop">
            <div className="account-card">
              <div className="account-card-body" style={{ padding: 0 }}>
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    style={{
                      padding: '25px 30px',
                      borderBottom: '1px solid #e5e7eb',
                      background: !review.isApproved ? '#fffbeb' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <Link to={`/product/${review.product?.slug?.current}`}>
                        <img
                          src={getImageUrl(review.product?.images?.[0])}
                          alt={review.product?.title}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: '#f4f4f4' }}
                        />
                      </Link>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <Link to={`/product/${review.product?.slug?.current}`} style={{ fontWeight: 600, fontSize: '1.1rem', color: '#111', textDecoration: 'none' }}>
                              {review.product?.title || 'Product'}
                            </Link>
                            <div style={{ marginTop: '5px' }}>{renderStars(review.rating)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{formatDate(review._createdAt)}</span>
                            {!review.isApproved && (
                              <div style={{ marginTop: '5px', padding: '3px 10px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                Pending Approval
                              </div>
                            )}
                          </div>
                        </div>
                        <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: card layout (same as Orders/Purchases) */}
          <div className="account-reviews-mobile">
            {reviews.map((review) => (
              <div key={review._id} className="account-review-mobile-card">
                <div className="account-review-mobile-top">
                  <div className="account-review-mobile-product">
                    <div className="account-review-mobile-product-inner">
                      <div className="account-review-mobile-thumb">
                        <img src={getImageUrl(review.product?.images?.[0])} alt={review.product?.title} />
                      </div>
                      <div className="account-review-mobile-info">
                        <h3 className="account-review-mobile-title">{review.product?.title || 'Product'}</h3>
                        <p className="account-review-mobile-subtitle">Digital Product</p>
                      </div>
                    </div>
                  </div>
                  <div className="account-review-mobile-pricing">
                    {review.product?.price != null && (
                      <p className="account-review-mobile-total">
                        <span className="account-review-mobile-total-label">Total: </span>
                        <span className="account-review-mobile-total-amount">₱{review.product.price?.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="account-review-mobile-actions">
                  <Link to={`/product/${review.product?.slug?.current}`} className="account-review-mobile-btn account-review-mobile-btn-secondary">
                    View Product
                  </Link>
                  <Link to={`/product/${review.product?.slug?.current}#reviews`} className="account-review-mobile-btn account-review-mobile-btn-primary">
                    Write review
                  </Link>
                </div>
                <div className="account-review-mobile-review">
                  <span className="account-review-mobile-review-label">Quick review</span>
                  <div className="account-review-mobile-stars" aria-hidden>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i key={star} className={star <= review.rating ? 'fas fa-star' : 'far fa-star'} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default AccountReviews;
