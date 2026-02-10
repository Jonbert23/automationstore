import { Link, useLocation } from 'react-router-dom';
import { IconOrders, IconPurchase, IconDashboard, IconWishlist } from './MobileNavIcons';

const navItems = [
  { path: '/account/orders', Icon: IconOrders, label: 'Orders' },
  { path: '/account/purchases', Icon: IconPurchase, label: 'Purchase' },
  { path: '/account', Icon: IconDashboard, label: 'Dashboard', exact: true },
  { path: '/account/wishlist', Icon: IconWishlist, label: 'WishList' },
];

const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (path !== '/account' && location.pathname.startsWith(path));
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile account navigation">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          const Icon = item.Icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-bottom-nav-item ${active ? 'active' : ''}`}
            >
              <Icon size={24} className="mobile-bottom-nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
