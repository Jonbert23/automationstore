import Header from '../common/Header';
import Footer from '../common/Footer';
import CartFlyAnimation from '../common/CartFlyAnimation';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      <CartFlyAnimation />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
