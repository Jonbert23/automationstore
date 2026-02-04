import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const user = useStore((state) => state.user);
  const getCartCount = useStore((state) => state.getCartCount);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header style={{
      background: isScrolled ? 'rgba(17,17,17,0.98)' : 'rgba(17,17,17,0.95)',
      boxShadow: isScrolled ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
      borderBottom: '1px solid #333'
    }}>
      {/* Top Announcement Bar */}
      <div style={{ background: '#D9FF00', color: '#111', textAlign: 'center', padding: '8px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
        <i className="fas fa-bolt" style={{ marginRight: '5px' }}></i> Instant Digital Delivery After Payment Verification
      </div>

      <div className="container nav-container">
        <div 
          className={`hamburger ${isMenuOpen ? 'is-active' : ''}`} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ color: 'white' }}
        >
          <i className="fas fa-bars"></i>
        </div>
        
        <Link to="/" className="logo" style={{ color: 'white' }}>SHUZEE<span style={{ color: '#D9FF00' }}>.</span></Link>

        <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ color: 'white' }}>Home</Link>
          <Link to="/shop" onClick={() => setIsMenuOpen(false)} style={{ color: 'white' }}>Scripts</Link>
          <Link to="/shop?category=jersey-mockups" onClick={() => setIsMenuOpen(false)} style={{ color: 'white' }}>Jersey</Link>
          <Link to="/shop?category=sewing-patterns" onClick={() => setIsMenuOpen(false)} style={{ color: 'white' }}>Patterns</Link>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)} style={{ color: 'white' }}>Support</Link>
        </nav>

        <div className="nav-icons">
          <Link to="/cart" className="icon-btn" style={{ color: 'white' }}>
            <i className="fas fa-shopping-bag"></i>
            <span className="cart-count" style={{ background: '#D9FF00', color: '#111' }}>{getCartCount()}</span>
          </Link>
          {user ? (
            <Link to="/account" className="icon-btn" style={{ padding: 0 }}>
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #D9FF00'
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#D9FF00',
                  color: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase'
                }}>
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                </div>
              )}
            </Link>
          ) : (
            <Link to="/login" className="icon-btn" style={{ color: 'white' }}><i className="far fa-user"></i></Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
