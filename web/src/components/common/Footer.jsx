import { Link } from 'react-router-dom';
import { GCashIcon, MayaIcon, GoTymeIcon } from './PaymentIcons';

const Footer = () => {
  return (
    <footer style={{ background: '#0a0a0a', marginTop: 0, clipPath: 'none' }}>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4 className="logo" style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white' }}>SHUZEE<span style={{ color: '#D9FF00' }}>.</span></h4>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Professional Photoshop automation scripts for Filipino designers. Save time, increase productivity, grow your business.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
              <a href="https://facebook.com/shuzee" target="_blank" rel="noopener noreferrer" style={{ 
                width: '40px', 
                height: '40px', 
                background: '#222', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'all 0.2s'
              }}>
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://m.me/shuzee" target="_blank" rel="noopener noreferrer" style={{ 
                width: '40px', 
                height: '40px', 
                background: '#222', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'all 0.2s'
              }}>
                <i className="fab fa-facebook-messenger"></i>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4 style={{ color: '#D9FF00' }}>Products</h4>
            <ul>
              <li><Link to="/shop?category=jersey-mockups">Jersey Mockups</Link></li>
              <li><Link to="/shop?category=sewing-patterns">Sewing Patterns</Link></li>
              <li><Link to="/shop?category=bulk-actions">Bulk Actions</Link></li>
              <li><Link to="/shop?category=print-ready">Print Ready</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 style={{ color: '#D9FF00' }}>Support</h4>
            <ul>
              <li><Link to="/account/orders">Order Status</Link></li>
              <li><Link to="/account/purchases">My Purchases</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="https://m.me/shuzee" target="_blank" rel="noopener noreferrer">Message on FB</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 style={{ color: '#D9FF00' }}>Payment Methods</h4>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>Secure payment via:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <GCashIcon height={25} />
              <MayaIcon height={25} />
              <GoTymeIcon height={25} />
            </div>
          </div>
        </div>
        <div style={{ 
          borderTop: '1px solid #222', 
          paddingTop: '30px', 
          marginTop: '30px',
          textAlign: 'center', 
          color: '#555', 
          fontSize: '0.8rem', 
          display: 'flex', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <span>&copy; 2026 SHUZEE. Filipino-owned. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="#" style={{ color: '#666' }}>Privacy Policy</Link>
            <Link to="#" style={{ color: '#666' }}>Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
