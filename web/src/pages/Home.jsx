import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/common/Hero';
import ProductCard from '../components/common/ProductCard';

const Home = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock data for now, will be replaced by Sanity data later
  const products = [
    { _id: '1', title: 'Zoom Velocity 5', category: 'Running', price: 149.00, slug: { current: 'zoom-velocity-5' }, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80' },
    { _id: '2', title: 'Apex High-Top', category: 'Lifestyle', price: 189.00, slug: { current: 'apex-high-top' }, image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80' },
    { _id: '3', title: 'Nitro Boost Red', category: 'Training', price: 129.00, slug: { current: 'nitro-boost-red' }, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
    { _id: '4', title: 'Cloud Strider', category: 'Running', price: 159.00, slug: { current: 'cloud-strider' }, image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=600&q=80' },
  ];

  return (
    <>
      <Hero />
      
      {/* As Seen In */}
      <section style={{ padding: '40px 0', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', fontWeight: 700 }}>Trusted By Pros</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap', opacity: 0.4, filter: 'grayscale(100%)' }}>
            <i className="fab fa-nike" style={{ fontSize: '2.5rem' }}></i>
            <i className="fab fa-adidas" style={{ fontSize: '2.5rem' }}></i>
            <i className="fab fa-puma" style={{ fontSize: '2.5rem' }}></i>
            <i className="fab fa-under-armour" style={{ fontSize: '2.5rem' }}></i>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container" style={{ marginTop: '100px' }}>
        <div className="section-title">
          <h2>Shop by Sport</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {['Running', 'Basketball', 'Training'].map((sport, index) => (
             <div key={index} style={{ position: 'relative', height: '400px', overflow: 'hidden', background: '#000' }}>
               <img 
                 src={[
                   "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
                   "https://images.unsplash.com/photo-1519861531473-920026393112?auto=format&fit=crop&w=800&q=80",
                   "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
                 ][index]} 
                 style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: '0.5s' }} 
                 onMouseOver={(e) => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1.1)'; }} 
                 onMouseOut={(e) => { e.currentTarget.style.opacity='0.7'; e.currentTarget.style.transform='scale(1)'; }}
                 alt={sport}
               />
               <div style={{ position: 'absolute', bottom: '30px', left: '30px', color: 'white', zIndex: 2 }}>
                 <h3 style={{ fontSize: '2.5rem', marginBottom: '5px', color: 'var(--accent)' }}>{sport}</h3>
                 <Link to="/shop" className="btn btn-outline" style={{ borderColor: 'white', color: 'white', padding: '10px 25px' }}>View Gear</Link>
               </div>
             </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="container">
        <div className="section-title">
          <h2>Trending Now</h2>
          <p>Top rated performance gear chosen by athletes.</p>
        </div>

        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <Link to="/shop" className="btn btn-outline"><span>View All Products</span></Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: '#111', color: 'white', padding: '100px 0', clipPath: 'polygon(0 0, 100% 10%, 100% 100%, 0 90%)' }}>
        <div className="container">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2 style={{ color: 'white' }}>Engineered for Performance</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', textAlign: 'center' }}>
            {[
              { icon: 'fa-wind', title: 'Aerodynamic Design', desc: 'Reduced drag for maximum speed efficiency.' },
              { icon: 'fa-feather-alt', title: 'Ultra Lightweight', desc: "Feather-light materials that won't weigh you down." },
              { icon: 'fa-shoe-prints', title: 'Superior Grip', desc: 'Advanced traction patterns for any terrain.' },
              { icon: 'fa-recycle', title: 'Eco-Conscious', desc: 'Made with 50% recycled ocean plastics.' }
            ].map((feature, index) => (
              <div key={index}>
                <i className={`fas ${feature.icon}`} style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '25px' }}></i>
                <h4 style={{ color: 'white', fontSize: '1.5rem' }}>{feature.title}</h4>
                <p style={{ color: '#999' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container" style={{ padding: '100px 0' }}>
        <div className="section-title">
          <h2>Athlete Reviews</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {[
            { text: "The energy return on the Zoom Velocity is insane. Shaved 30 seconds off my 5K time.", name: "Marcus J.", role: "Marathon Runner" },
            { text: "Best basketball shoes I've owned. The ankle support is top-notch without sacrificing mobility.", name: "David R.", role: "Shooting Guard" },
            { text: "Stylish enough for the gym and the street. The Nitro Boost fits like a glove.", name: "Sarah K.", role: "Crossfit Athlete" }
          ].map((review, index) => (
            <div key={index} style={{ padding: '40px', background: '#f8f8f8', borderLeft: '5px solid var(--accent)' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '15px' }}>
                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
              </div>
              <p style={{ fontStyle: 'italic', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 500 }}>"{review.text}"</p>
              <h5 style={{ marginBottom: 0 }}>{review.name}</h5>
              <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>{review.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Limited Time Offer Banner */}
      <section style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1517466787929-bc90951d64b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', padding: '120px 0', textAlign: 'center', color: 'white', backgroundAttachment: 'fixed' }}>
        <div className="container">
          <h2 style={{ fontSize: '4rem', marginBottom: '10px', color: 'var(--accent)' }}>Flash Sale</h2>
          <p style={{ fontSize: '1.5rem', marginBottom: '40px', fontWeight: 300 }}>24 Hours Only. 50% Off Select Styles.</p>
          
          <div id="countdown" style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '50px' }}>
            <div><span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'Oswald' }}>{String(timeLeft.days).padStart(2, '0')}</span><div style={{ fontSize: '0.9rem', color: '#ccc' }}>DAYS</div></div>
            <div><span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'Oswald' }}>{String(timeLeft.hours).padStart(2, '0')}</span><div style={{ fontSize: '0.9rem', color: '#ccc' }}>HOURS</div></div>
            <div><span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'Oswald' }}>{String(timeLeft.minutes).padStart(2, '0')}</span><div style={{ fontSize: '0.9rem', color: '#ccc' }}>MINS</div></div>
            <div><span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'Oswald', color: 'var(--accent)' }}>{String(timeLeft.seconds).padStart(2, '0')}</span><div style={{ fontSize: '0.9rem', color: '#ccc' }}>SECS</div></div>
          </div>
          
          <Link to="/shop" className="btn" style={{ background: 'var(--accent)', color: 'black', borderColor: 'var(--accent)' }}><span>Shop The Sale</span></Link>
        </div>
      </section>

      {/* Instagram / Shop the Look */}
      <section className="container" style={{ padding: '80px 0' }}>
        <div className="section-title">
          <h2>#TeamSHUZEE</h2>
          <p>Join the movement. Tag us to be featured.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
          {[
            "https://images.unsplash.com/photo-1483721310020-03333e577078?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1518002171953-a080ee32bede?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1539185441755-769473a23570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
          ].map((img, index) => (
            <div key={index} style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
              <img 
                src={img} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} 
                onMouseOver={(e) => e.currentTarget.style.transform='scale(1.1)'} 
                onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}
                alt="Instagram post"
              />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="#" className="btn btn-outline"><span><i className="fab fa-instagram" style={{ marginRight: '8px' }}></i> Follow @SHUZEE_Official</span></a>
        </div>
      </section>
    </>
  );
};

export default Home;
