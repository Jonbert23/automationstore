import { useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import { signOut } from '../../features/auth/authService';
import '../../assets/css/account.css';

const AccountLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    signOut();
    logout();
    navigate('/');
  };

  if (!user) return null;

  const navItems = [
    { path: '/account', icon: 'fa-tachometer-alt', label: 'Dashboard', exact: true },
    { path: '/account/purchases', icon: 'fa-download', label: 'My Purchases' },
    { path: '/account/orders', icon: 'fa-receipt', label: 'Order History' },
    { path: '/account/wishlist', icon: 'fa-heart', label: 'Wishlist' },
    { path: '/account/reviews', icon: 'fa-star', label: 'My Reviews' },
    { path: '/account/recently-viewed', icon: 'fa-history', label: 'Recently Viewed' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="account-layout">
      {/* Sidebar */}
      <aside className="account-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">APEX <span>ATHLETE</span></Link>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', color: '#ef4444' }}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <Link to="/account/profile" className="sidebar-user" style={{ textDecoration: 'none', color: 'inherit' }}>
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="sidebar-avatar" />
            ) : (
              <div className="sidebar-avatar-placeholder">{getInitials(user.name)}</div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-since">Member since 2024</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="account-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountLayout;
