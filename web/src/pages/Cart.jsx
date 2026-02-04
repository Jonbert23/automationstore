import { Link } from 'react-router-dom';
import useStore from '../hooks/useStore';
import '../assets/css/cart.css';

const Cart = () => {
  const { cart, removeFromCart, getCartTotal, saveForLater } = useStore();

  const subtotal = getCartTotal();
  const total = subtotal; // No shipping or tax for digital products

  if (cart.length === 0) {
    return (
      <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh' }}>
        <div style={{ 
          padding: '150px 0 80px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
          borderBottom: '1px solid #333'
        }}>
          <div className="container">
            <h1 style={{ color: 'white' }}>Your Cart</h1>
          </div>
        </div>
        <section className="container" style={{ padding: '60px 20px', textAlign: 'center', minHeight: '50vh' }}>
          <i className="fas fa-shopping-bag" style={{ fontSize: '4rem', color: '#333', marginBottom: '20px' }}></i>
          <h2 style={{ marginBottom: '10px', color: 'white' }}>Your cart is empty</h2>
          <p style={{ color: '#9ca3af', marginBottom: '30px' }}>Looks like you haven't added any scripts yet.</p>
          <Link to="/shop" className="btn" style={{ background: '#D9FF00', color: 'black', border: 'none' }}><span>Browse Scripts</span></Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ 
        padding: '150px 0 80px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
        borderBottom: '1px solid #333'
      }}>
        <div className="container">
          <h1 style={{ color: 'white' }}>Your Cart</h1>
        </div>
      </div>

      <section className="container" style={{ padding: '60px 20px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '50px' }}>
          {/* Cart Items */}
          <div>
            {/* Digital Products Notice */}
            <div style={{ 
              background: 'rgba(217, 255, 0, 0.1)', 
              border: '1px solid #D9FF00', 
              borderRadius: '12px', 
              padding: '15px 20px', 
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="fas fa-download" style={{ color: '#D9FF00', fontSize: '1.2rem' }}></i>
              <div>
                <strong style={{ color: '#D9FF00' }}>Digital Products</strong>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '3px 0 0' }}>
                  You'll receive instant access after payment verification
                </p>
              </div>
            </div>

            {/* Cart Items List */}
            {cart.map((item) => (
              <div key={item._id} style={{
                display: 'flex',
                gap: '20px',
                padding: '25px',
                background: '#1a1a1a',
                borderRadius: '12px',
                marginBottom: '15px',
                border: '1px solid #333'
              }}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', background: '#222' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'white', marginBottom: '5px' }}>{item.title}</h4>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '8px' }}>
                    {item.category}
                  </p>
                  <span style={{ 
                    display: 'inline-block',
                    background: '#222', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    <i className="fas fa-download" style={{ marginRight: '5px' }}></i>
                    Digital Download
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#D9FF00', marginBottom: '15px' }}>
                    ₱{item.price.toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                    <i 
                      className="fas fa-heart" 
                      title="Save for Later"
                      style={{ cursor: 'pointer', color: '#666', transition: '0.2s' }}
                      onClick={() => saveForLater(item)}
                      onMouseOver={(e) => e.target.style.color = '#ef4444'}
                      onMouseOut={(e) => e.target.style.color = '#666'}
                    ></i>
                    <i 
                      className="fas fa-trash-alt" 
                      title="Remove"
                      style={{ cursor: 'pointer', color: '#666', transition: '0.2s' }}
                      onClick={() => removeFromCart(item._id)}
                      onMouseOver={(e) => e.target.style.color = '#ef4444'}
                      onMouseOut={(e) => e.target.style.color = '#666'}
                    ></i>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '30px' }}>
              <Link to="/shop" style={{ textDecoration: 'none', fontWeight: 700, color: '#D9FF00' }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ 
            background: '#1a1a1a', 
            border: '1px solid #333', 
            borderRadius: '16px', 
            padding: '30px',
            height: 'fit-content',
            position: 'sticky',
            top: '150px'
          }}>
            <h3 style={{ marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px', color: 'white' }}>Order Summary</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ color: '#9ca3af' }}>Items ({cart.length})</span>
              <span style={{ fontWeight: 700, color: 'white' }}>₱{subtotal.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid #333', marginTop: '15px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'white' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#D9FF00' }}>₱{total.toLocaleString()}</span>
            </div>

            <Link to="/checkout" className="btn" style={{ 
              width: '100%', 
              textAlign: 'center', 
              marginTop: '25px', 
              padding: '18px', 
              display: 'block',
              background: '#D9FF00',
              color: 'black',
              border: 'none'
            }}>
              <span>Proceed to Checkout</span>
            </Link>
            
            <div style={{ marginTop: '25px', padding: '15px', background: '#222', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600, color: 'white' }}>
                <i className="fas fa-shield-alt" style={{ marginRight: '8px', color: '#D9FF00' }}></i>
                What happens next?
              </h4>
              <ol style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.8, margin: 0 }}>
                <li>Choose your payment method</li>
                <li>Scan QR code to pay</li>
                <li>Enter your reference number</li>
                <li>We verify your payment</li>
                <li>Get instant access to your files!</li>
              </ol>
            </div>

            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
              <i className="fas fa-lock" style={{ marginRight: '5px' }}></i> 
              Secure Checkout via GCash, Maya, or GoTyme
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Cart;
