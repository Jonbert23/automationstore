import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4 className="logo" style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white' }}>APEX<span>.</span></h4>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Pushing the boundaries of athletic performance since 2026. We build gear for those who refuse to settle.</p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">Men's Running</Link></li>
              <li><Link to="/shop">Women's Training</Link></li>
              <li><Link to="/shop">Basketball</Link></li>
              <li><Link to="/shop">New Arrivals</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="/contact">Order Status</Link></li>
              <li><Link to="#">Shipping & Returns</Link></li>
              <li><Link to="#">Size Charts</Link></li>
              <li><Link to="#">Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Join The Club</h4>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '15px' }}>Get exclusive access to new drops and sales.</p>
            <form className="newsletter">
              <input type="email" placeholder="ENTER YOUR EMAIL" />
              <button type="submit" className="btn" style={{ width: '100%', padding: '12px' }}><span>SUBSCRIBE</span></button>
            </form>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #222', paddingTop: '30px', textAlign: 'center', color: '#555', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>&copy; 2026 APEX Performance. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
