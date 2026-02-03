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
      background: isScrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)',
      boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
    }}>
      {/* Top Announcement Bar */}
      <div style={{ background: '#111', color: 'var(--accent)', textAlign: 'center', padding: '8px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
        <i className="fas fa-bolt" style={{ marginRight: '5px' }}></i> Free Express Shipping on Orders Over $150
      </div>

      <div className="container nav-container">
        <div 
          className={`hamburger ${isMenuOpen ? 'is-active' : ''}`} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <i className="fas fa-bars"></i>
        </div>
        
        <Link to="/" className="logo">SHUZEE<span>.</span></Link>

        <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/shop" onClick={() => setIsMenuOpen(false)}>Men</Link>
          <Link to="/shop" onClick={() => setIsMenuOpen(false)}>Women</Link>
          <Link to="/shop" onClick={() => setIsMenuOpen(false)}>New Drops</Link>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Support</Link>
        </nav>

        <div className="nav-icons">
          <div className="icon-btn"><i className="fas fa-search"></i></div>
          <Link to="/cart" className="icon-btn">
            <i className="fas fa-shopping-bag"></i>
            <span className="cart-count">{getCartCount()}</span>
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
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#111',
                  color: 'white',
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
            <Link to="/login" className="icon-btn"><i className="far fa-user"></i></Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
