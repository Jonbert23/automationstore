import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../hooks/useStore';
import { createOrder, getPaymentMethods, urlFor, storeName, uploadImage, setOrderPayMongoPaymentIntentId } from '../services/sanityClient';
import { GCashIcon, MayaIcon, GoTymeIcon } from '../components/common/PaymentIcons';
import '../assets/css/checkout.css';

const PAYMONGO_METHOD = { _id: 'paymongo', name: 'PayMongo (Card / E-Wallet)', slug: { current: 'paymongo' } };

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart, user, getCartTotal, clearCart } = useStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([PAYMONGO_METHOD]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMONGO_METHOD);
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Confirm
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const paymongo = searchParams.get('paymongo');
    const id = searchParams.get('orderId');
    if (paymongo === 'success' && id) {
      setOrderId(id);
      setStep(3);
      clearCart();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, clearCart]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const methods = await getPaymentMethods();
      const list = methods.some((m) => (m.slug?.current || m._id) === 'paymongo') ? methods : [PAYMONGO_METHOD, ...methods];
      setPaymentMethods(list);
      setSelectedPayment((prev) => list.find((m) => (m.slug?.current || m._id) === (prev?.slug?.current || prev?._id)) || list[0]);
    };
    fetchPaymentMethods();
  }, []);

  const isPayMongo = (selectedPayment?.slug?.current || selectedPayment?._id) === 'paymongo';

  const handlePayWithPayMongo = async (provider = 'gcash') => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const order = await createOrder({
        user: user.email,
        userName: user.name,
        items: cart.map((item) => ({ product: { _type: 'reference', _ref: item._id }, quantity: 1, price: item.price, title: item.title })),
        total,
        paymentMethod: 'paymongo',
        status: 'pending',
      });
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/checkout?paymongo=success&orderId=${order._id}`;
      const cancelUrl = `${baseUrl}/checkout?paymongo=cancel`;
      const functionsBase = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || `${baseUrl}/api`;

      const parseJson = async (res) => {
        const text = await res.text();
        if (!text?.trim()) return {};
        try { return JSON.parse(text); } catch {
          const isLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);
          if (res.status === 404 || text.startsWith('<!')) {
            if (isLocal) {
              throw new Error('Payment server not available. Run "netlify dev" from project root.');
            }
            throw new Error(
              'Payment server not responding. Check: 1) Latest code pushed to stage and deploy finished. 2) PAYMONGO_SECRET_KEY set in Netlify → Environment variables. 3) Hard refresh (Ctrl+Shift+R) and try again.'
            );
          }
          throw new Error('Payment server error. Try again or use another method.');
        }
      };

      const createRes = await fetch(`${functionsBase}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, amount: total, successUrl, cancelUrl, customerEmail: user.email, customerName: user.name }),
      });
      const createData = await parseJson(createRes);
      if (!createRes.ok || !createData.clientKey) throw new Error(createData.error || 'Failed to create payment');
      await setOrderPayMongoPaymentIntentId(order._id, createData.paymentIntentId);

      const attachRes = await fetch(`${functionsBase}/attach-ewallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientKey: createData.clientKey, returnUrl: successUrl, provider }),
      });
      const attachData = await parseJson(attachRes);
      if (attachData.redirectUrl) { clearCart(); window.location.href = attachData.redirectUrl; return; }
      if (attachData.status === 'succeeded') { setOrderId(order._id); clearCart(); setStep(3); setSearchParams({}, { replace: true }); return; }
      throw new Error(attachData.error || 'Could not start payment');
    } catch (err) {
      console.error('PayMongo error:', err);
      alert(err.message || 'Payment could not be started.');
    } finally {
      setLoading(false);
    }
  };

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

    if (!isPayMongo && !paymentProofFile) {
      alert('Please upload a payment receipt.');
      return;
    }

    setLoading(true);
    
    try {
      // Upload image first
      const imageAsset = await uploadImage(paymentProofFile);
      
      if (!imageAsset) {
        throw new Error('Failed to upload image');
      }

      const order = await createOrder({
        user: user.email,
        userName: user.name,
        items: cart.map(item => ({
          product: { _type: 'reference', _ref: item._id },
          quantity: 1, // Digital products are typically 1 per item
          price: item.price,
          title: item.title // Add title for email template
        })),
        total: total,
        paymentMethod: selectedPayment?.slug?.current || selectedPayment?._id,
        paymentProof: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id
          }
        },
        status: 'payment_submitted',
      });

      // Send email notifications
      import('../services/emailService').then(({ sendAdminOrderNotification, sendCustomerOrderConfirmation }) => {
        const orderEmailData = {
          orderId: order._id,
          customerName: user.name,
          customerEmail: user.email,
          totalAmount: total,
          items: cart,
          paymentMethod: selectedPayment?.name || 'Unknown',
          paymentProofUrl: imageAsset?.url || ''
        };
        
        // Send to admin
        sendAdminOrderNotification(orderEmailData);
        
        // Send confirmation to customer
        sendCustomerOrderConfirmation(orderEmailData);
      });

      setOrderId(order._id);
      clearCart();
      setStep(3);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh', color: 'white' }}>
        <section className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h2 style={{ color: 'white' }}>Your cart is empty</h2>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Add some items before checking out.</p>
          <Link to="/shop" className="btn" style={{ background: '#D9FF00', color: '#111', border: 'none' }}><span>Browse Products</span></Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh', color: 'white' }}>
      {/* Simple Header for Checkout */}
      <header style={{ position: 'static', padding: '25px 0', borderBottom: '1px solid #333', background: '#1a1a1a' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Link to="/" className="logo" style={{ color: 'white' }}>SHUZEE<span style={{ color: '#D9FF00' }}>.</span></Link>
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
                background: step >= s.num ? '#D9FF00' : '#333',
                color: step >= s.num ? '#111' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {step > s.num ? <i className="fas fa-check"></i> : s.num}
              </div>
              <span style={{ fontWeight: 600, color: step >= s.num ? '#D9FF00' : '#666' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="container" style={{ maxWidth: '900px', paddingBottom: '100px' }}>
        
        {/* Step 1: Review Order */}
        {step === 1 && (
          <div>
            <h2 style={{ marginBottom: '30px', textAlign: 'center', color: 'white' }}>Review Your Order</h2>
            
            {/* Order Items */}
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '25px', marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'white' }}>
                <i className="fas fa-shopping-bag" style={{ marginRight: '10px', color: '#D9FF00' }}></i>
                Order Items ({cart.length})
              </h3>
              {cart.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #333' }}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: '#222' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '5px', color: 'white' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{item.category}</p>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '5px' }}>
                      <i className="fas fa-download" style={{ marginRight: '5px', color: '#D9FF00' }}></i>
                      Digital Download
                    </p>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#D9FF00' }}>₱{item.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Digital Product Notice */}
            <div style={{ background: 'rgba(217, 255, 0, 0.1)', border: '1px solid #D9FF00', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <i className="fas fa-bolt" style={{ color: '#D9FF00', fontSize: '1.5rem', marginTop: '3px' }}></i>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '5px', color: '#D9FF00' }}>Instant Digital Delivery</h4>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                    Once your payment is verified, you'll receive immediate access to download your files via Google Drive link.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#9ca3af' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'white' }}>₱{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid #333', marginTop: '15px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'white' }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: '1.4rem', color: '#D9FF00' }}>₱{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Info */}
            {user ? (
              <div style={{ background: '#222', borderRadius: '12px', padding: '20px', marginBottom: '30px', border: '1px solid #333' }}>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                  <i className="fas fa-user" style={{ marginRight: '8px', color: '#D9FF00' }}></i>
                  Ordering as: <strong style={{ color: 'white' }}>{user.name}</strong> ({user.email})
                </p>
              </div>
            ) : (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                <p style={{ color: '#f59e0b' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  Please <Link to="/login" style={{ fontWeight: 700, textDecoration: 'underline', color: '#f59e0b' }}>sign in</Link> to complete your order.
                </p>
              </div>
            )}

            <button 
              onClick={() => user ? setStep(2) : navigate('/login')}
              className="btn" 
              style={{ width: '100%', padding: '18px', fontSize: '1.1rem', background: '#D9FF00', color: '#111', border: 'none' }}
            >
              <span>Continue to Payment</span>
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/cart" style={{ color: '#9ca3af', textDecoration: 'underline' }}>← Back to Cart</Link>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <h2 style={{ marginBottom: '30px', textAlign: 'center', color: 'white' }}>Select Payment Method</h2>

            {/* Payment Method Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {paymentMethods.map((method) => (
                <button
                  key={method._id}
                  onClick={() => setSelectedPayment(method)}
                  style={{
                    padding: '20px',
                    border: (selectedPayment?.slug?.current || selectedPayment?._id) === (method.slug?.current || method._id) ? '2px solid #D9FF00' : '1px solid #333',
                    borderRadius: '12px',
                    background: (selectedPayment?.slug?.current || selectedPayment?._id) === (method.slug?.current || method._id) ? 'rgba(217, 255, 0, 0.05)' : '#1a1a1a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    height: '100px'
                  }}
                >
                  {(method.slug?.current || method._id) === 'paymongo' ? (
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>PayMongo</span>
                  ) : method.name?.toLowerCase().includes('gcash') ? (
                    <GCashIcon height={30} />
                  ) : method.name?.toLowerCase().includes('maya') ? (
                    <MayaIcon height={30} />
                  ) : method.name?.toLowerCase().includes('gotyme') ? (
                    <GoTymeIcon height={30} />
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>{method.name}</div>
                  )}
                </button>
              ))}
            </div>

            {searchParams.get('paymongo') === 'cancel' && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '15px', marginBottom: '20px', color: '#f59e0b' }}>
                Payment was cancelled. You can try again or choose another method.
              </div>
            )}

            {isPayMongo && (
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: 'white' }}>Pay with PayMongo</h3>
                <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '0.95rem' }}>You will be redirected to complete payment securely.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  <button type="button" onClick={() => handlePayWithPayMongo('gcash')} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', background: '#D9FF00', color: '#111', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    <GCashIcon height={28} /> Pay with GCash
                  </button>
                  <button type="button" onClick={() => handlePayWithPayMongo('paymaya')} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', background: '#1a1a1a', color: '#D9FF00', border: '2px solid #D9FF00', borderRadius: '12px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    <MayaIcon height={28} /> Pay with Maya
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '15px' }}>Card and other options may be available on the PayMongo page.</p>
                <button type="button" onClick={() => setStep(1)} style={{ marginTop: '20px', padding: '12px 24px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              </div>
            )}

            <div style={{ display: isPayMongo ? 'none' : 'flex', flexWrap: 'wrap', gap: '30px' }}>
              <div style={{ flex: '1 1 350px' }}>
                {selectedPayment && !isPayMongo && (
                  <div style={{ 
                    background: '#1a1a1a', 
                    border: '1px solid #333', 
                    borderRadius: '12px', 
                    padding: '30px', 
                    textAlign: 'center', 
                    height: '100%',
                    position: 'sticky',
                    top: '20px'
                  }}>
                    <h3 style={{ marginBottom: '20px', color: 'white' }}>Scan to Pay</h3>
                    
                    {getQRCodeUrl(selectedPayment.qrCode) ? (
                      <div>
                        <img 
                          src={getQRCodeUrl(selectedPayment.qrCode)} 
                          alt={`${selectedPayment.name} QR Code`}
                          style={{ width: '100%', borderRadius: '12px', border: '2px solid #333', marginBottom: '20px' }}
                        />
                        <a 
                          href={getQRCodeUrl(selectedPayment.qrCode)} 
                          download={`${selectedPayment.name}-QR.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#333',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            marginBottom: '20px',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#444'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#333'}
                        >
                          <i className="fas fa-download"></i>
                          Download QR
                        </a>
                      </div>
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        aspectRatio: '1/1',
                        background: '#222', 
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        color: '#666'
                      }}>
                        <div>
                          <i className="fas fa-qrcode" style={{ fontSize: '3rem', marginBottom: '10px', display: 'block' }}></i>
                          <p style={{ fontSize: '0.85rem' }}>QR Code not available</p>
                        </div>
                      </div>
                    )}

                    <div style={{ background: 'rgba(217, 255, 0, 0.1)', borderRadius: '8px', padding: '15px', border: '1px solid #D9FF00' }}>
                      <p style={{ fontWeight: 700, color: '#D9FF00', fontSize: '1.2rem' }}>
                        <i className="fas fa-coins" style={{ marginRight: '8px' }}></i>
                        ₱{total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Details & Upload - Right Side on Desktop */}
              <div style={{ flex: '1 1 350px' }}>
                {selectedPayment && (
                  <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'white' }}>Payment Details</h3>
                    
                    {selectedPayment.accountName && (
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '5px' }}>Account Name</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{selectedPayment.accountName}</p>
                      </div>
                    )}
                    
                    {selectedPayment.accountNumber && (
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '5px' }}>Account Number</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{selectedPayment.accountNumber}</p>
                      </div>
                    )}

                    {selectedPayment.instructions && (
                      <div style={{ marginTop: '20px', background: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', fontWeight: 600, color: '#D9FF00' }}>Instructions:</h4>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'pre-line' }}>{selectedPayment.instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Proof Upload */}
                <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px', fontSize: '1rem', color: 'white' }}>
                    <i className="fas fa-receipt" style={{ marginRight: '10px', color: '#D9FF00' }}></i>
                    Payment Confirmation
                  </h3>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af' }}>
                      Upload Payment Receipt *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        id="payment-proof"
                        accept="image/*"
                        onChange={(e) => setPaymentProofFile(e.target.files[0])}
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      />
                      <div style={{
                        width: '100%',
                        padding: '14px',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: '#222',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                        <span style={{
                          background: '#D9FF00',
                          color: '#111',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          Choose File
                        </span>
                        <span style={{ color: paymentProofFile ? 'white' : '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {paymentProofFile ? paymentProofFile.name : 'No file chosen'}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                      Please upload a screenshot of your payment transaction
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    onClick={() => setStep(1)}
                    style={{ 
                      flex: '0 0 auto',
                      padding: '18px 30px', 
                      background: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handlePlaceOrder}
                    className="btn" 
                    style={{ flex: 1, padding: '18px', fontSize: '1.1rem', background: '#D9FF00', color: '#111', border: 'none' }}
                    disabled={loading || !paymentProofFile}
                  >
                    <span>{loading ? 'Processing...' : 'Submit Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Order Complete */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              background: '#D9FF00', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 30px'
            }}>
              <i className="fas fa-check" style={{ fontSize: '3rem', color: '#111' }}></i>
            </div>
            
            <h2 style={{ marginBottom: '15px', color: 'white' }}>Order Submitted Successfully!</h2>
            <p style={{ color: '#9ca3af', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
              We've received your order and payment details. Our team will verify your payment within 24 hours.
            </p>

            {orderId && (
              <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px', border: '1px solid #333' }}>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '5px' }}>Order ID</p>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'monospace', color: '#D9FF00' }}>
                  #{orderId.slice(-8).toUpperCase()}
                </p>
              </div>
            )}

            <div style={{ background: 'rgba(217, 255, 0, 0.05)', border: '1px solid #D9FF00', borderRadius: '12px', padding: '25px', marginBottom: '30px', textAlign: 'left', maxWidth: '500px', margin: '0 auto 30px' }}>
              <h4 style={{ marginBottom: '15px', color: '#D9FF00' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
                What happens next?
              </h4>
              <ol style={{ paddingLeft: '20px', color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.8 }}>
                <li>We'll verify your payment (usually within 24 hours)</li>
                <li>You'll receive an email confirmation</li>
                <li>Access to your digital products will be granted</li>
                <li>Download links will appear in "My Purchases"</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/account/orders" className="btn" style={{ padding: '15px 30px', background: '#D9FF00', color: '#111', border: 'none' }}>
                <span>View My Orders</span>
              </Link>
              <Link to="/shop" style={{ padding: '15px 30px', border: '1px solid #333', borderRadius: '8px', fontWeight: 600, color: 'white', background: '#1a1a1a' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Checkout;
