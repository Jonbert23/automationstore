import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { getUserPurchases, urlFor } from '../../services/sanityClient';

const AccountPurchases = () => {
  const { user } = useStore();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

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
      return urlFor(image).width(80).url();
    } catch {
      return 'https://via.placeholder.com/80x80?text=No+Image';
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

  // Flatten all products from all orders
  const allProducts = useMemo(() => {
    return purchases.flatMap(order => 
      order.items?.map(item => ({
        ...item.product,
        purchaseDate: order.accessGrantedAt || order._createdAt,
        orderId: order._id
      })) || []
    );
  }, [purchases]);

  // Remove duplicates (in case same product was purchased multiple times)
  const uniqueProducts = useMemo(() => {
    return allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p._id === product._id)
    );
  }, [allProducts]);

  // Filter products based on search and date range
  const filteredProducts = useMemo(() => {
    return uniqueProducts.filter(product => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = product.title?.toLowerCase().includes(searchLower);
        const orderIdMatch = product.orderId?.toLowerCase().includes(searchLower);
        if (!titleMatch && !orderIdMatch) return false;
      }

      // Date range filter
      const purchaseDate = new Date(product.purchaseDate);
      
      if (dateRange === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (purchaseDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (purchaseDate > end) return false;
        }
      } else if (dateRange !== 'all') {
        const now = new Date();
        const daysAgo = new Date();
        
        if (dateRange === 'today') {
          daysAgo.setHours(0, 0, 0, 0);
        } else {
          const days = parseInt(dateRange);
          daysAgo.setDate(now.getDate() - days);
        }

        if (purchaseDate < daysAgo) return false;
      }

      return true;
    });
  }, [uniqueProducts, searchTerm, dateRange, startDate, endDate]);

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setShowDateModal(true);
    } else {
      setDateRange(value);
      setStartDate('');
      setEndDate('');
    }
  };

  const applyCustomDateRange = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setDateRange('custom');
    setShowDateModal(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || dateRange !== 'all';

  return (
    <>
      <div className="account-topbar">
        <h1 className="account-page-title">My Purchases</h1>
      </div>

      {/* Filters */}
      {uniqueProducts.length > 0 && (
        <div className="account-purchases-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.9rem',
              maxWidth: '250px'
            }}
          />
          
          <select
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.9rem',
              background: 'white',
              cursor: 'pointer',
              maxWidth: '160px'
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (startDate || endDate) && (
            <button
              onClick={() => {
                setTempStartDate(startDate);
                setTempEndDate(endDate);
                setShowDateModal(true);
              }}
              style={{
                padding: '8px 14px',
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-calendar"></i>
              {startDate && endDate 
                ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                : startDate 
                  ? `From ${new Date(startDate).toLocaleDateString()}`
                  : `Until ${new Date(endDate).toLocaleDateString()}`
              }
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Clear Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#6b7280' }}>
            Showing {filteredProducts.length} of {uniqueProducts.length} products
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showDateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDateModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Select Date Range</h3>
              <button
                onClick={() => setShowDateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Start Date</label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>End Date</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDateModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={applyCustomDateRange}
                disabled={!tempStartDate && !tempEndDate}
                style={{
                  padding: '10px 20px',
                  background: '#111',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  opacity: (!tempStartDate && !tempEndDate) ? 0.5 : 1
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="account-card account-card-purchases">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '15px' }}>Loading your purchases...</p>
          </div>
        ) : uniqueProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fas fa-shopping-bag" style={{ fontSize: '4rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No purchases yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Your purchased products will appear here after payment verification.
            </p>
            <Link to="/shop" className="account-action-btn">Browse Products</Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fas fa-search" style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '20px' }}></i>
            <h3 style={{ marginBottom: '10px' }}>No matching products</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="account-action-btn">Clear Filters</button>
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="account-purchases-desktop">
              <table className="account-table account-table-purchases">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Order ID</th>
                    <th>Date Purchased</th>
                    <th>File Info</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="account-purchase-row">
                      <td className="account-purchase-product" data-label="Product">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="account-purchase-thumb">
                            <img src={getImageUrl(product.images?.[0])} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', background: '#e5e7eb' }} />
                          </div>
                          <div className="account-purchase-info" style={{ maxWidth: '200px' }}>
                            <p className="account-purchase-title" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{product.title}</p>
                            <p className="account-purchase-meta" style={{ color: '#6b7280', fontSize: '0.8rem' }}>{product.category || 'Digital Product'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="account-purchase-orderid" data-label="Order ID">
                        <Link to={`/account/orders/${product.orderId}`} style={{ color: '#111', fontWeight: 500, textDecoration: 'underline' }}>#{product.orderId.slice(-6).toUpperCase()}</Link>
                      </td>
                      <td className="account-purchase-date" data-label="Date Purchased">
                        {new Date(product.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="account-purchase-fileinfo" data-label="File Info">
                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#6b7280' }}>
                          {product.fileType && <span title="File Type"><i className={`fas ${getFileTypeIcon(product.fileType)}`} style={{ marginRight: '5px' }}></i>{product.fileType.toUpperCase()}</span>}
                          {product.fileSize && <span title="File Size"><i className="fas fa-hdd" style={{ marginRight: '5px' }}></i>{product.fileSize}</span>}
                        </div>
                      </td>
                      <td className="account-purchase-action" data-label="">
                        {product.driveLink ? (
                          <a href={product.driveLink} target="_blank" rel="noopener noreferrer" className="account-purchase-view" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: '#22c55e', color: 'white', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', gap: '8px' }}>
                            <i className="fab fa-google-drive"></i> Access Files
                          </a>
                        ) : (
                          <span style={{ color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <i className="fas fa-clock"></i> Processing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card layout (reference design) */}
            <div className="account-purchases-mobile">
              {filteredProducts.map((product) => (
                <div key={product._id} className="account-purchase-mobile-card">
                  <div className="account-purchase-mobile-top">
                    <div className="account-purchase-mobile-product">
                      {product.category && <span className="account-purchase-mobile-badge">{product.category}</span>}
                      <div className="account-purchase-mobile-product-inner">
                        <div className="account-purchase-mobile-thumb">
                          <img src={getImageUrl(product.images?.[0])} alt={product.title} />
                        </div>
                        <div className="account-purchase-mobile-info">
                          <h3 className="account-purchase-mobile-title">{product.title}</h3>
                          <p className="account-purchase-mobile-subtitle">{product.category || 'Digital Product'}</p>
                        </div>
                      </div>
                    </div>
                    {product.price != null && (
                      <div className="account-purchase-mobile-pricing">
                        <p className="account-purchase-mobile-total">
                          <span className="account-purchase-mobile-total-label">Total: </span>
                          <span className="account-purchase-mobile-total-amount">₱{product.price?.toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="account-purchase-mobile-actions">
                    {product.driveLink ? (
                      <a href={product.driveLink} target="_blank" rel="noopener noreferrer" className="account-purchase-mobile-btn account-purchase-mobile-btn-primary">
                        <i className="fab fa-google-drive"></i> Access Files
                      </a>
                    ) : (
                      <span className="account-purchase-mobile-btn account-purchase-mobile-btn-disabled">
                        <i className="fas fa-clock"></i> Processing
                      </span>
                    )}
                    <Link to={`/account/reviews?product=${product._id}`} className="account-purchase-mobile-btn account-purchase-mobile-btn-review">Write review</Link>
                  </div>
                  <div className="account-purchase-mobile-review">
                    <span className="account-purchase-mobile-review-label">Quick review</span>
                    <div className="account-purchase-mobile-stars" aria-hidden>
                      {[1, 2, 3, 4, 5].map((i) => <i key={i} className="far fa-star" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AccountPurchases;
