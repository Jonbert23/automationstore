import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../hooks/useStore';
import { createOrder, getPaymentMethods, urlFor, storeName } from '../services/sanityClient';
import '../assets/css/checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, user, getCartTotal, clearCart } = useStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Confirm
  const [paymentReference, setPaymentReference] = useState('');
  const [orderId, setOrderId] = useState(null);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const methods = await getPaymentMethods();
      if (methods.length > 0) {
        setPaymentMethods(methods);
        setSelectedPayment(methods[0]);
      } else {
        // Fallback payment methods if none in Sanity
        setPaymentMethods([
          { _id: 'gcash', name: 'GCash', slug: { current: 'gcash' }, accountName: 'Your Business Name', accountNumber: '0917-XXX-XXXX' },
          { _id: 'maya', name: 'Maya', slug: { current: 'maya' }, accountName: 'Your Business Name', accountNumber: '0917-XXX-XXXX' },
          { _id: 'gotyme', name: 'GoTyme', slug: { current: 'gotyme' }, accountName: 'Your Business Name', accountNumber: '0917-XXX-XXXX' },
        ]);
        setSelectedPayment({ _id: 'gcash', name: 'GCash', slug: { current: 'gcash' } });
      }
    };
    fetchPaymentMethods();
  }, []);

  const subtotal = getCartTotal();
  const total = subtotal; // No shipping or tax for digital products

  const getQRCodeUrl = (qrCode) => {
    if (!qrCode) return null;
    if (qrCode?.asset?.url) return qrCode.asset.url;
    try {
      return urlFor(qrCode).width(300).url();
    } catch {
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    
    try {
      const order = await createOrder({
        user: user.email,
        userName: user.name,
        items: cart.map(item => ({
          product: { _type: 'reference', _ref: item._id },
          quantity: 1, // Digital products are typically 1 per item
          price: item.price,
        })),
        total: total,
        paymentMethod: selectedPayment?.slug?.current || selectedPayment?._id,
        paymentReference: paymentReference,
        status: paymentReference ? 'payment_submitted' : 'pending',
      });

      setOrderId(order._id);
      clearCart();
      setStep(3);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Order created! Please complete payment to get access.');
      clearCart();
      navigate('/account/orders');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <section className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>Add some items before checking out.</p>
        <Link to="/shop" className="btn"><span>Browse Products</span></Link>
      </section>
    );
  }

  return (
    <>
      {/* Simple Header for Checkout */}
      <header style={{ position: 'static', padding: '25px 0', borderBottom: '1px solid var(--border)', background: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Link to="/" className="logo">{storeName}<span>.</span></Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container" style={{ maxWidth: '800px', margin: '30px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px' }}>
          {[
            { num: 1, label: 'Review Order' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Complete' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                background: step >= s.num ? '#111' : '#e5e7eb',
                color: step >= s.num ? 'white' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {step > s.num ? <i className="fas fa-check"></i> : s.num}
              </div>
              <span style={{ fontWeight: 600, color: step >= s.num ? '#111' : '#9ca3af' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="container" style={{ maxWidth: '900px', marginBottom: '100px' }}>
        
        {/* Step 1: Review Order */}
        {step === 1 && (
          <div>
            <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Review Your Order</h2>
            
            {/* Order Items */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '25px', marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
                <i className="fas fa-shopping-bag" style={{ marginRight: '10px', color: '#6b7280' }}></i>
                Order Items ({cart.length})
              </h3>
              {cart.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: '#f3f4f6' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '5px' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.category}</p>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>
                      <i className="fas fa-download" style={{ marginRight: '5px' }}></i>
                      Digital Download
                    </p>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₱{item.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Digital Product Notice */}
            <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <i className="fas fa-bolt" style={{ color: '#22c55e', fontSize: '1.5rem', marginTop: '3px' }}></i>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '5px', color: '#166534' }}>Instant Digital Delivery</h4>
                  <p style={{ fontSize: '0.9rem', color: '#15803d' }}>
                    Once your payment is verified, you'll receive immediate access to download your files via Google Drive link.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₱{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '2px solid #111', marginTop: '15px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: '1.4rem' }}>₱{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Info */}
            {user ? (
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                  Ordering as: <strong>{user.name}</strong> ({user.email})
                </p>
              </div>
            ) : (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                <p style={{ color: '#92400e' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  Please <Link to="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>sign in</Link> to complete your order.
                </p>
              </div>
            )}

            <button 
              onClick={() => user ? setStep(2) : navigate('/login')}
              className="btn" 
              style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}
            >
              <span>Continue to Payment</span>
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/cart" style={{ color: '#6b7280', textDecoration: 'underline' }}>← Back to Cart</Link>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Select Payment Method</h2>

            {/* Payment Method Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {paymentMethods.map((method) => (
                <button
                  key={method._id}
                  onClick={() => setSelectedPayment(method)}
                  style={{
                    padding: '20px',
                    border: selectedPayment?._id === method._id ? '2px solid #111' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    background: selectedPayment?._id === method._id ? '#f9fafb' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{method.name}</div>
                </button>
              ))}
            </div>

            {/* QR Code Display */}
            {selectedPayment && (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px', textAlign: 'center', marginBottom: '25px' }}>
                <h3 style={{ marginBottom: '20px' }}>Scan QR Code to Pay</h3>
                
                {getQRCodeUrl(selectedPayment.qrCode) ? (
                  <img 
                    src={getQRCodeUrl(selectedPayment.qrCode)} 
                    alt={`${selectedPayment.name} QR Code`}
                    style={{ maxWidth: '250px', margin: '0 auto 20px', display: 'block', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ 
                    width: '250px', 
                    height: '250px', 
                    background: '#f3f4f6', 
                    margin: '0 auto 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    color: '#9ca3af'
                  }}>
                    <div>
                      <i className="fas fa-qrcode" style={{ fontSize: '3rem', marginBottom: '10px', display: 'block' }}></i>
                      <p style={{ fontSize: '0.85rem' }}>QR Code not available</p>
                    </div>
                  </div>
                )}

                {selectedPayment.accountName && (
                  <p style={{ marginBottom: '5px' }}>
                    <strong>Account Name:</strong> {selectedPayment.accountName}
                  </p>
                )}
                {selectedPayment.accountNumber && (
                  <p style={{ marginBottom: '15px', color: '#6b7280' }}>
                    <strong>Number:</strong> {selectedPayment.accountNumber}
                  </p>
                )}

                <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '15px', marginTop: '20px' }}>
                  <p style={{ fontWeight: 700, color: '#92400e', marginBottom: '5px' }}>
                    <i className="fas fa-coins" style={{ marginRight: '8px' }}></i>
                    Amount to Pay: ₱{total.toLocaleString()}
                  </p>
                </div>

                {selectedPayment.instructions && (
                  <div style={{ marginTop: '20px', textAlign: 'left', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', fontWeight: 600 }}>Payment Instructions:</h4>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', whiteSpace: 'pre-line' }}>{selectedPayment.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Reference Input */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1rem' }}>
                <i className="fas fa-receipt" style={{ marginRight: '10px', color: '#6b7280' }}></i>
                Payment Confirmation
              </h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Reference/Transaction Number *
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter your payment reference number"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '8px' }}>
                  You can find this in your {selectedPayment?.name || 'payment app'} transaction history
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setStep(1)}
                style={{ 
                  flex: '0 0 auto',
                  padding: '18px 30px', 
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button 
                onClick={handlePlaceOrder}
                className="btn" 
                style={{ flex: 1, padding: '18px', fontSize: '1.1rem' }}
                disabled={loading || !paymentReference}
              >
                <span>{loading ? 'Processing...' : 'Submit Order'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Order Complete */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              background: '#22c55e', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 30px'
            }}>
              <i className="fas fa-check" style={{ fontSize: '3rem', color: 'white' }}></i>
            </div>
            
            <h2 style={{ marginBottom: '15px' }}>Order Submitted Successfully!</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
              We've received your order and payment details. Our team will verify your payment within 24 hours.
            </p>

            {orderId && (
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px' }}>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '5px' }}>Order ID</p>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'monospace' }}>
                  #{orderId.slice(-8).toUpperCase()}
                </p>
              </div>
            )}

            <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '12px', padding: '25px', marginBottom: '30px', textAlign: 'left', maxWidth: '500px', margin: '0 auto 30px' }}>
              <h4 style={{ marginBottom: '15px', color: '#1e40af' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
                What happens next?
              </h4>
              <ol style={{ paddingLeft: '20px', color: '#1e40af', fontSize: '0.9rem', lineHeight: 1.8 }}>
                <li>We'll verify your payment (usually within 24 hours)</li>
                <li>You'll receive an email confirmation</li>
                <li>Access to your digital products will be granted</li>
                <li>Download links will appear in "My Purchases"</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/account/orders" className="btn" style={{ padding: '15px 30px' }}>
                <span>View My Orders</span>
              </Link>
              <Link to="/shop" style={{ padding: '15px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Checkout;
