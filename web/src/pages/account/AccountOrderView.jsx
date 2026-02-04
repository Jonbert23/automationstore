import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById, urlFor, storeName, markOrderCompleted } from '../../services/sanityClient';
import useStore from '../../hooks/useStore';

const AccountOrderView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, addToCart } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        
        // Verify the order belongs to the current user
        if (data && data.user === user?.email) {
          setOrder(data);
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId, user]);

  const getImageUrl = (image) => {
    if (image?.asset?.url) return image.asset.url;
    try {
      return urlFor(image).width(100).url();
    } catch {
      return 'https://via.placeholder.com/80x80?text=No+Image';
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      order.items?.forEach(item => {
        if (item.product) {
          addToCart({
            _id: item.product._id,
            title: item.product.title,
            price: item.product.price || item.price,
            image: getImageUrl(item.product.images?.[0]),
            slug: item.product.slug?.current,
          }, 1);
        }
      });
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      alert('Failed to reorder. Please try again.');
    } finally {
      setReordering(false);
    }
  };

  const handlePrintInvoice = () => {
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${orderId.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 5px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .order-info { color: #666; font-size: 14px; }
          .items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items th, .items td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .items th { background: #f5f5f5; font-weight: 600; }
          .items td:last-child, .items th:last-child { text-align: right; }
          .summary { float: right; width: 300px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .summary-total { border-top: 2px solid #000; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; }
          .digital-badge { display: inline-block; background: #22c55e; color: white; padding: 3px 10px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p class="order-info">Order #${orderId.slice(-6).toUpperCase()}</p>
            <p class="order-info">Date: ${new Date(order._createdAt).toLocaleDateString()}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0;">${storeName}</h2>
            <p class="order-info">Thank you for your purchase!</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">CUSTOMER:</h3>
          <p>${order.userName || ''}<br>${order.user}</p>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td>${item.product?.title || 'Product'} <span class="digital-badge">Digital</span></td>
                <td>Digital Download</td>
                <td>₱${item.price?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row summary-total"><span>Total</span><span>₱${order.total?.toLocaleString()}</span></div>
        </div>
        
        <div style="clear: both; padding-top: 50px; font-size: 12px; color: #666;">
          <p>This is a digital product purchase. Access is provided via Google Drive after payment verification.</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusInfo = (status) => {
    const statusInfo = {
      pending: { label: 'Pending', color: '#f59e0b', icon: 'fa-clock', description: 'Awaiting payment verification' },
      verified: { label: 'Payment Verified', color: '#3b82f6', icon: 'fa-check-circle', description: 'Your payment has been verified! Access your files now.' },
      completed: { label: 'Completed', color: '#22c55e', icon: 'fa-check-double', description: 'Order completed - Files accessed' },
      cancelled: { label: 'Cancelled', color: '#ef4444', icon: 'fa-times-circle', description: 'Order has been cancelled' },
    };
    return statusInfo[status] || { label: status, color: '#6b7280', icon: 'fa-question', description: '' };
  };

  const getPaymentMethodLabel = (method) => {
    const labels = { gcash: 'GCash', maya: 'Maya', gotyme: 'GoTyme' };
    return labels[method] || method || 'Not specified';
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
        <p style={{ marginTop: '15px' }}>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h2>Order not found</h2>
        <Link to="/account/orders" className="account-action-btn" style={{ marginTop: '20px' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <>
      <div className="account-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/account/orders" style={{ color: '#6b7280', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="account-page-title">Order #{orderId.slice(-6).toUpperCase()}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="account-action-btn" onClick={handlePrintInvoice}>
            <i className="fas fa-file-invoice"></i> Invoice
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ 
        background: `${statusInfo.color}15`, 
        border: `1px solid ${statusInfo.color}`,
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '25px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: statusInfo.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className={`fas ${statusInfo.icon}`} style={{ color: 'white', fontSize: '1.5rem' }}></i>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '5px', color: statusInfo.color }}>{statusInfo.label}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>{statusInfo.description}</p>
        </div>
        {order.status === 'verified' && order.accessGranted && (
          <button 
            onClick={async () => {
              // Mark order as completed
              await markOrderCompleted(order._id);
              setOrder({ ...order, status: 'completed' });
              // Navigate to purchases
              navigate('/account/purchases');
            }}
            style={{
              background: '#22c55e',
              color: 'white',
              padding: '14px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fab fa-google-drive" style={{ fontSize: '1.2rem' }}></i>
            Access Google Drive
          </button>
        )}
        {order.status === 'completed' && (
          <Link 
            to="/account/purchases"
            style={{
              background: '#22c55e',
              color: 'white',
              padding: '14px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fas fa-download"></i>
            View My Purchases
          </Link>
        )}
      </div>

      <div className="account-card">
        <div className="account-card-header">
          <h3 className="account-card-title">Order Details</h3>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            {new Date(order._createdAt).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="account-card-body">
          {/* Order Items */}
          <div style={{ marginBottom: '30px' }}>
            {order.items?.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '20px', padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
                <img 
                  src={getImageUrl(item.product?.images?.[0])} 
                  alt={item.product?.title || 'Product'}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', background: '#f4f4f4', borderRadius: '8px' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '5px', fontWeight: 600 }}>{item.product?.title || 'Product'}</h4>
                  <span style={{ 
                    display: 'inline-block',
                    background: '#f3f4f6', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <i className="fas fa-download" style={{ marginRight: '5px' }}></i>
                    Digital Download
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>
                  ₱{item.price?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Payment & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '30px' }}>
            <div>
              <h4 style={{ marginBottom: '15px', fontWeight: 600 }}>Payment Information</h4>
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                {order.paymentMethod && (
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Payment Method</span>
                    <p style={{ fontWeight: 600, margin: '5px 0 0' }}>{getPaymentMethodLabel(order.paymentMethod)}</p>
                  </div>
                )}
                {order.paymentReference && (
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Reference Number</span>
                    <p style={{ fontWeight: 600, margin: '5px 0 0', fontFamily: 'monospace' }}>{order.paymentReference}</p>
                  </div>
                )}
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Status</span>
                  <p style={{ 
                    fontWeight: 600, 
                    margin: '5px 0 0',
                    color: (order.status === 'verified' || order.status === 'completed') ? '#22c55e' : 
                           order.status === 'cancelled' ? '#ef4444' : '#f59e0b'
                  }}>
                    <i className={`fas ${
                      order.status === 'completed' ? 'fa-check-double' :
                      order.status === 'verified' ? 'fa-check-circle' : 
                      order.status === 'cancelled' ? 'fa-times-circle' : 'fa-clock'
                    }`} style={{ marginRight: '6px' }}></i>
                    {order.status === 'completed' ? 'Payment Verified & Completed' :
                     order.status === 'verified' ? 'Payment Verified' : 
                     order.status === 'cancelled' ? 'Cancelled' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              {/* What's Next */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '15px', fontWeight: 600 }}>What's Next?</h4>
                {order.status === 'completed' ? (
                  <div style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #22c55e', 
                    padding: '20px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ color: '#166534', fontWeight: 600, marginBottom: '10px' }}>
                      <i className="fas fa-check-double" style={{ marginRight: '8px' }}></i>
                      Order Completed
                    </p>
                    <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0 }}>
                      You have accessed your files. Visit "My Purchases" anytime to download again.
                    </p>
                  </div>
                ) : order.status === 'verified' ? (
                  <div style={{ 
                    background: '#dbeafe', 
                    border: '1px solid #3b82f6', 
                    padding: '20px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ color: '#1e40af', fontWeight: 600, marginBottom: '10px' }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                      Payment Verified - Ready to Access!
                    </p>
                    <p style={{ color: '#1e40af', fontSize: '0.9rem', margin: 0 }}>
                      Click "Access Google Drive" above to get your files.
                    </p>
                  </div>
                ) : order.status === 'cancelled' ? (
                  <div style={{ 
                    background: '#fee2e2', 
                    border: '1px solid #ef4444', 
                    padding: '20px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ color: '#991b1b', fontWeight: 600, marginBottom: '10px' }}>
                      <i className="fas fa-times-circle" style={{ marginRight: '8px' }}></i>
                      Order Cancelled
                    </p>
                    <p style={{ color: '#991b1b', fontSize: '0.9rem', margin: 0 }}>
                      This order has been cancelled. Contact support if you have questions.
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    background: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    padding: '20px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ color: '#92400e', fontWeight: 600, marginBottom: '10px' }}>
                      <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
                      Awaiting Payment Verification
                    </p>
                    <p style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                      We're verifying your payment. You'll get access to your files once verified.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 style={{ marginBottom: '15px', fontWeight: 600 }}>Order Summary</h4>
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: '#6b7280' }}>Items ({order.items?.length || 0})</span>
                  <span style={{ fontWeight: 600 }}>₱{order.total?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.3rem', paddingTop: '15px', borderTop: '2px solid #111' }}>
                  <span>Total</span>
                  <span>₱{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: '#f9fafb', 
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#6b7280', marginBottom: '10px' }}>
          <i className="fas fa-question-circle" style={{ marginRight: '8px' }}></i>
          Having issues with your order?
        </p>
        <a href="mailto:support@example.com" style={{ color: '#111', fontWeight: 600 }}>
          Contact Support
        </a>
      </div>
    </>
  );
};

export default AccountOrderView;
