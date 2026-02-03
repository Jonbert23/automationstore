import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { client, writeClient, urlFor } from '../../services/sanityClient';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await client.fetch(`
        *[_type == "review"] | order(_createdAt desc) {
          _id,
          _createdAt,
          user,
          userName,
          rating,
          title,
          comment,
          isApproved,
          isVerifiedPurchase,
          "product": product->{ _id, title, slug, images }
        }
      `);
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await writeClient.patch(reviewId).set({ isApproved: true }).commit();
      setReviews(reviews.map(r => 
        r._id === reviewId ? { ...r, isApproved: true } : r
      ));
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await writeClient.patch(reviewId).set({ isApproved: false }).commit();
      setReviews(reviews.map(r => 
        r._id === reviewId ? { ...r, isApproved: false } : r
      ));
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await writeClient.delete(reviewId);
      setReviews(reviews.filter(r => r._id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(60).url();
    } catch {
      return 'https://via.placeholder.com/60x60?text=No+Image';
    }
  };

  const renderStars = (rating) => {
    return (
      <span style={{ color: '#f59e0b' }}>
        {'★'.repeat(rating)}
        <span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - rating)}</span>
      </span>
    );
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending') return !review.isApproved;
    if (filter === 'approved') return review.isApproved;
    return true;
  });

  // Stats
  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading reviews...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Reviews</h1>
        {pendingCount > 0 && (
          <span style={{ 
            background: '#fef3c7', 
            color: '#92400e', 
            padding: '6px 12px', 
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '30px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Reviews</span>
            <i className="fas fa-star"></i>
          </div>
          <div className="admin-stat-value">{reviews.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Pending</span>
            <i className="fas fa-clock"></i>
          </div>
          <div className="admin-stat-value" style={{ color: pendingCount > 0 ? '#f59e0b' : 'inherit' }}>
            {pendingCount}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Approved</span>
            <i className="fas fa-check"></i>
          </div>
          <div className="admin-stat-value">{approvedCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Avg. Rating</span>
            <i className="fas fa-star"></i>
          </div>
          <div className="admin-stat-value">{avgRating} ★</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', 'pending', 'approved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: filter === f ? 'var(--primary)' : 'white',
                color: filter === f ? 'white' : 'var(--text)',
                cursor: 'pointer',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="admin-data-card" style={{ padding: '0' }}>
        {filteredReviews.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-star"></i>
            <p>{filter === 'all' ? 'No reviews yet' : `No ${filter} reviews`}</p>
          </div>
        ) : (
          <div>
            {filteredReviews.map((review) => (
              <div 
                key={review._id} 
                style={{ 
                  padding: '25px 30px', 
                  borderBottom: '1px solid var(--border)',
                  background: !review.isApproved ? '#fffbeb' : 'white'
                }}
              >
                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* Product Image */}
                  <Link to={`/admin/products/${review.product?._id}`}>
                    <img
                      src={getImageUrl(review.product?.images?.[0])}
                      alt={review.product?.title}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        background: '#f4f4f4'
                      }}
                    />
                  </Link>

                  {/* Review Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600 }}>{review.userName || 'Anonymous'}</span>
                          {review.isVerifiedPurchase && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              background: '#dcfce7', 
                              color: '#166534',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              <i className="fas fa-check-circle"></i> Verified Purchase
                            </span>
                          )}
                          {!review.isApproved && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              background: '#fef3c7', 
                              color: '#92400e',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {review.user} • {formatDate(review._createdAt)}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.2rem' }}>
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <Link 
                        to={`/product/${review.product?.slug?.current}`} 
                        style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}
                      >
                        {review.product?.title}
                      </Link>
                      {review.title && (
                        <h4 style={{ marginTop: '8px', marginBottom: '5px' }}>{review.title}</h4>
                      )}
                      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {review.comment}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      {!review.isApproved ? (
                        <button
                          onClick={() => handleApprove(review._id)}
                          style={{
                            padding: '6px 14px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReject(review._id)}
                          style={{
                            padding: '6px 14px',
                            background: '#f3f4f6',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          <i className="fas fa-times"></i> Unapprove
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review._id)}
                        style={{
                          padding: '6px 14px',
                          background: 'white',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReviews;
