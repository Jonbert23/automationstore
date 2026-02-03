import { Link } from 'react-router-dom';
import useStore from '../hooks/useStore';
import '../assets/css/cart.css';

const Cart = () => {
  const { cart, removeFromCart, getCartTotal, saveForLater } = useStore();

  const subtotal = getCartTotal();
  const total = subtotal; // No shipping or tax for digital products

  if (cart.length === 0) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <h1>Your Cart</h1>
          </div>
        </div>
        <section className="container" style={{ padding: '60px 20px', textAlign: 'center', minHeight: '50vh' }}>
          <i className="fas fa-shopping-bag" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }}></i>
          <h2 style={{ marginBottom: '10px' }}>Your cart is empty</h2>
          <p style={{ color: '#888', marginBottom: '30px' }}>Looks like you haven't added any items yet.</p>
          <Link to="/shop" className="btn"><span>Browse Products</span></Link>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1>Your Cart</h1>
        </div>
      </div>

      <section className="container cart-grid">
        {/* Cart Items */}
        <div className="cart-items">
          {/* Digital Products Notice */}
          <div style={{ 
            background: '#f0fdf4', 
            border: '1px solid #22c55e', 
            borderRadius: '8px', 
            padding: '15px 20px', 
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="fas fa-download" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i>
            <div>
              <strong style={{ color: '#166534' }}>Digital Products</strong>
              <p style={{ fontSize: '0.85rem', color: '#15803d', margin: '3px 0 0' }}>
                You'll receive instant access after payment verification
              </p>
            </div>
          </div>

          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="cart-item">
                      <img src={item.image} alt={item.title} />
                      <div>
                        <h4 style={{ marginBottom: '5px' }}>{item.title}</h4>
                        <p style={{ color: '#666', fontSize: '0.85rem' }}>
                          {item.category}
                        </p>
                        <span style={{ 
                          display: 'inline-block',
                          marginTop: '8px',
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
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>₱{item.price.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <i 
                        className="fas fa-heart" 
                        title="Save for Later"
                        style={{ cursor: 'pointer', color: '#999', transition: '0.2s' }}
                        onClick={() => saveForLater(item)}
                        onMouseOver={(e) => e.target.style.color = '#ef4444'}
                        onMouseOut={(e) => e.target.style.color = '#999'}
                      ></i>
                      <i 
                        className="fas fa-trash-alt" 
                        title="Remove"
                        style={{ cursor: 'pointer', color: '#999', transition: '0.2s' }}
                        onClick={() => removeFromCart(item._id)}
                        onMouseOver={(e) => e.target.style.color = '#ef4444'}
                        onMouseOut={(e) => e.target.style.color = '#999'}
                      ></i>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
            <Link to="/shop" style={{ textDecoration: 'none', fontWeight: 700, color: 'var(--primary)' }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h3 style={{ marginBottom: '25px', borderBottom: '2px solid var(--border)', paddingBottom: '15px' }}>Order Summary</h3>
          
          <div className="summary-row">
            <span>Items ({cart.length})</span>
            <span style={{ fontWeight: 700 }}>₱{subtotal.toLocaleString()}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>

          <Link to="/checkout" className="btn" style={{ width: '100%', textAlign: 'center', marginTop: '25px', padding: '18px', display: 'block' }}>
            <span>Proceed to Checkout</span>
          </Link>
          
          <div style={{ marginTop: '25px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>
              <i className="fas fa-shield-alt" style={{ marginRight: '8px', color: '#22c55e' }}></i>
              What happens next?
            </h4>
            <ol style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.8, margin: 0 }}>
              <li>Choose your payment method</li>
              <li>Scan QR code to pay</li>
              <li>Enter your reference number</li>
              <li>We verify your payment</li>
              <li>Get instant access to your files!</li>
            </ol>
          </div>

          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
            <i className="fas fa-lock" style={{ marginRight: '5px' }}></i> 
            Secure Checkout via GCash, Maya, or GoTyme
          </div>
        </div>
      </section>
    </>
  );
};

export default Cart;
