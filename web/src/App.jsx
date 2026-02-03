import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AccountLayout from './components/layout/AccountLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Contact from './pages/Contact';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountOrderView from './pages/account/AccountOrderView';
import AccountWishlist from './pages/account/AccountWishlist';
import AccountAddresses from './pages/account/AccountAddresses';
import AccountProfile from './pages/account/AccountProfile';
import AccountReviews from './pages/account/AccountReviews';
import AccountRecentlyViewed from './pages/account/AccountRecentlyViewed';
import AccountSavedItems from './pages/account/AccountSavedItems';
import AccountPurchases from './pages/account/AccountPurchases';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderView from './pages/admin/AdminOrderView';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCustomerView from './pages/admin/AdminCustomerView';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import AdminReviews from './pages/admin/AdminReviews';
import useStore from './hooks/useStore';
import { checkExistingSession, initGoogleAuth } from './features/auth/authService';

function App() {
  const { setUser } = useStore();

  useEffect(() => {
    // Check for existing session on app load
    const initApp = async () => {
      try {
        const user = await checkExistingSession();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.warn('Session restore error:', error);
      }

      // Initialize Google Auth for One Tap (only if configured)
      try {
        await initGoogleAuth(
          (userData) => setUser(userData),
          (error) => console.warn('Auth error:', error)
        );
      } catch (error) {
        console.warn('Google Auth init error:', error);
      }
    };

    initApp();
  }, [setUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Checkout has its own layout (no header/footer) */}
        <Route path="/checkout" element={<Checkout />} />
        
        {/* Admin panel with sidebar layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:productId" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/new" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrderView />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/:customerId" element={<AdminCustomerView />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="discounts" element={<AdminDiscounts />} />
          <Route path="reviews" element={<AdminReviews />} />
        </Route>
        
        {/* Account pages with sidebar layout */}
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountDashboard />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="orders/:orderId" element={<AccountOrderView />} />
          <Route path="purchases" element={<AccountPurchases />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="wishlist" element={<AccountWishlist />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="saved" element={<AccountSavedItems />} />
          <Route path="reviews" element={<AccountReviews />} />
          <Route path="recently-viewed" element={<AccountRecentlyViewed />} />
        </Route>
        
        {/* Main layout with header/footer */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
              <h2>404 - Page Not Found</h2>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
