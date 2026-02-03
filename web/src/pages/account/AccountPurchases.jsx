import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { getUserPurchases, urlFor } from '../../services/sanityClient';

const AccountPurchases = () => {
  const { user } = useStore();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user?.email) return;
      
      try {
        const data = await getUserPurchases(user.email);
        setPurchases(data);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user]);

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(200).url();
    } catch {
      return 'https://via.placeholder.com/200x200?text=No+Image';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'jsx':
        return 'fa-file-code';
      case 'atn':
        return 'fa-magic';
      case 'zip':
        return 'fa-file-archive';
      case 'pdf':
        return 'fa-file-pdf';
      default:
        return 'fa-file';
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

  // Flatten all products from all orders
  const allProducts = purchases.flatMap(order => 
    order.items?.map(item => ({
      ...item.product,
      purchaseDate: order.accessGrantedAt || order._createdAt,
      orderId: order._id
    })) || []
  );

  // Remove duplicates (in case same product was purchased multiple times)
  const uniqueProducts = allProducts.filter((product, index, self) =>
    index === self.findIndex(p => p._id === product._id)
  );

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">My Purchases</h1>
        {uniqueProducts.length > 0 && (
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {uniqueProducts.length} product{uniqueProducts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
          <p style={{ marginTop: '15px' }}>Loading your purchases...</p>
        </div>
      ) : uniqueProducts.length === 0 ? (
        <div className="account-card" style={{ padding: '60px', textAlign: 'center' }}>
          <i className="fas fa-shopping-bag" style={{ fontSize: '4rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
          <h3 style={{ marginBottom: '10px' }}>No purchases yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Your purchased products will appear here after payment verification.
          </p>
          <Link to="/shop" className="account-action-btn">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {uniqueProducts.map((product) => (
            <div 
              key={product._id} 
              className="account-card"
              style={{ padding: '0', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: '0' }}>
                {/* Product Image */}
                <div style={{ width: '200px', flexShrink: 0 }}>
                  <img 
                    src={getImageUrl(product.images?.[0])}
                    alt={product.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      minHeight: '200px'
                    }}
                  />
                </div>

                {/* Product Info */}
                <div style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ 
                        background: '#22c55e', 
                        color: 'white', 
                        padding: '4px 10px', 
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        <i className="fas fa-check" style={{ marginRight: '5px' }}></i>
                        Purchased
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {formatDate(product.purchaseDate)}
                      </span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>
                      {product.title}
                    </h3>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '0.9rem', color: '#6b7280' }}>
                      {product.fileType && (
                        <span>
                          <i className={`fas ${getFileTypeIcon(product.fileType)}`} style={{ marginRight: '6px' }}></i>
                          {getFileTypeLabel(product.fileType)}
                        </span>
                      )}
                      {product.fileSize && (
                        <span>
                          <i className="fas fa-hdd" style={{ marginRight: '6px' }}></i>
                          {product.fileSize}
                        </span>
                      )}
                    </div>

                    {product.accessInstructions && (
                      <div style={{ 
                        background: '#f9fafb', 
                        padding: '15px', 
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                          <i className="fas fa-info-circle" style={{ marginRight: '6px', color: '#6b7280' }}></i>
                          Access Instructions
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', whiteSpace: 'pre-line' }}>
                          {product.accessInstructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  {product.driveLink ? (
                    <a
                      href={product.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: '#111',
                        color: 'white',
                        padding: '14px 25px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        alignSelf: 'flex-start'
                      }}
                    >
                      <i className="fab fa-google-drive"></i>
                      Access Files on Google Drive
                      <i className="fas fa-external-link-alt" style={{ fontSize: '0.8rem' }}></i>
                    </a>
                  ) : (
                    <div style={{ 
                      background: '#fef3c7', 
                      padding: '12px 20px', 
                      borderRadius: '8px',
                      color: '#92400e',
                      fontSize: '0.9rem'
                    }}>
                      <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
                      Download link will be available soon. Please contact support if you need assistance.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      {uniqueProducts.length > 0 && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280', marginBottom: '10px' }}>
            <i className="fas fa-question-circle" style={{ marginRight: '8px' }}></i>
            Having trouble accessing your files?
          </p>
          <a href="mailto:support@example.com" style={{ color: '#111', fontWeight: 600 }}>
            Contact Support
          </a>
        </div>
      )}
    </>
  );
};

export default AccountPurchases;
