import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import useStore from '../../hooks/useStore';
import '../../assets/css/admin.css';

// Admin email(s) - only these can access the admin panel
const ADMIN_EMAILS = ['jonbertandam@gmail.com'];

const AdminLayout = () => {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is an admin
  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        fontFamily: 'Inter, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '20px' }}></i>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '10px' }}>Access Denied</h1>
        <p style={{ color: '#6b7280', marginBottom: '30px', maxWidth: '400px' }}>
          Sorry, you don't have permission to access the admin panel. 
          This area is restricted to store administrators only.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link 
            to="/" 
            style={{
              background: '#000',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Go to Store
          </Link>
          <button
            onClick={logout}
            style={{
              background: '#fff',
              color: '#333',
              padding: '12px 24px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <NavLink to="/admin" className="admin-brand">
            SHUZEE <span>ADMIN</span>
          </NavLink>
        </div>

        <nav className="admin-nav-menu">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-box"></i>
            <span>Products</span>
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-shopping-cart"></i>
            <span>Orders</span>
          </NavLink>
          <NavLink
            to="/admin/customers"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-users"></i>
            <span>Customers</span>
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-folder"></i>
            <span>Categories</span>
          </NavLink>
          <NavLink
            to="/admin/payment-gateways"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-credit-card"></i>
            <span>Payment Gateways</span>
          </NavLink>
          <NavLink
            to="/admin/discounts"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-percent"></i>
            <span>Discounts</span>
          </NavLink>
          <NavLink
            to="/admin/reviews"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-star"></i>
            <span>Reviews</span>
          </NavLink>
          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-user-avatar">
              {user.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                getInitials(user.name || 'Admin')
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.8rem' }}>Store Owner</div>
            </div>
            <i
              className="fas fa-sign-out-alt"
              style={{ cursor: 'pointer' }}
              onClick={logout}
              title="Logout"
            ></i>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
