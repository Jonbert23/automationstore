import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/common/Hero';
import ProductCard from '../components/common/ProductCard';
import { getFeaturedProducts, getCategories } from '../services/sanityClient';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, cats] = await Promise.all([
          getFeaturedProducts(),
          getCategories()
        ]);
        setFeaturedProducts(products || []);
        setCategories(cats || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Hero />
      
      {/* How It Works */}
      <section style={{ padding: '80px 0', background: '#fafafa' }}>
        <div className="container">
          <div className="section-title">
            <h2>How It Works</h2>
            <p>Get started in 3 simple steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            {[
              { 
                step: '01', 
                icon: 'fa-shopping-cart', 
                title: 'Choose Your Script', 
                desc: 'Browse our collection of Photoshop automation scripts for jerseys, patterns, and more.',
                color: '#3b82f6'
              },
              { 
                step: '02', 
                icon: 'fa-credit-card', 
                title: 'Easy Payment', 
                desc: 'Pay securely via GCash, Maya, or GoTyme. We verify payments within minutes.',
                color: '#22c55e'
              },
              { 
                step: '03', 
                icon: 'fa-download', 
                title: 'Instant Access', 
                desc: 'Get immediate access to your files via Google Drive. Download and start automating!',
                color: '#7c3aed'
              },
            ].map((item, index) => (
              <div key={index} style={{ 
                background: 'white', 
                padding: '40px 30px', 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-15px', 
                  left: '30px',
                  background: item.color,
                  color: 'white',
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  right: '20px',
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: '#f3f4f6'
                }}>
                  {item.step}
                </div>
                <h4 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '1.3rem' }}>{item.title}</h4>
                <p style={{ color: '#6b7280', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container" style={{ padding: '80px 0' }}>
        <div className="section-title">
          <h2>Browse by Category</h2>
          <p>Find the perfect automation tool for your workflow</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {[
            { 
              title: 'Jersey Mockups', 
              desc: 'Automate basketball, football & sports jersey designs',
              icon: 'fa-tshirt',
              color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              slug: 'jersey-mockups'
            },
            { 
              title: 'Sewing Patterns', 
              desc: 'Generate pattern pieces with seam allowances',
              icon: 'fa-cut',
              color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              slug: 'sewing-patterns'
            },
            { 
              title: 'Bulk Actions', 
              desc: 'Resize, watermark, export multiple files at once',
              icon: 'fa-layer-group',
              color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              slug: 'bulk-actions'
            },
            { 
              title: 'Print Ready', 
              desc: 'Prepare files for DTF, sublimation & screen print',
              icon: 'fa-print',
              color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              slug: 'print-ready'
            },
          ].map((cat, index) => (
            <Link 
              to={`/shop?category=${cat.slug}`} 
              key={index}
              style={{ 
                background: cat.color,
                padding: '35px 25px',
                borderRadius: '16px',
                color: 'white',
                textDecoration: 'none',
                display: 'block',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <i className={`fas ${cat.icon}`} style={{ fontSize: '2.5rem', marginBottom: '20px', display: 'block' }}></i>
              <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '1.2rem' }}>{cat.title}</h4>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ background: '#111', padding: '80px 0' }}>
        <div className="container">
          <div className="section-title">
            <h2 style={{ color: 'white' }}>Featured Scripts</h2>
            <p style={{ color: '#9ca3af' }}>Our most popular automation tools</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
              <p style={{ marginTop: '15px' }}>Loading products...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="product-grid">
              {featuredProducts.slice(0, 4).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: '15px' }}></i>
              <p>Products coming soon!</p>
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/shop" className="btn" style={{ 
              background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
              border: 'none'
            }}>
              <span>View All Products</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="section-title">
            <h2>Why Choose SHUZEE Scripts?</h2>
            <p>Built by designers, for designers</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            {[
              { 
                icon: 'fa-bolt', 
                title: 'Lightning Fast', 
                desc: 'Process hundreds of designs in minutes instead of hours.',
                color: '#f59e0b'
              },
              { 
                icon: 'fa-check-double', 
                title: 'Consistent Quality', 
                desc: 'Every output maintains professional quality standards.',
                color: '#22c55e'
              },
              { 
                icon: 'fa-headset', 
                title: 'Local Support', 
                desc: 'Filipino-owned with responsive customer support.',
                color: '#3b82f6'
              },
              { 
                icon: 'fa-sync-alt', 
                title: 'Free Updates', 
                desc: 'Get lifetime updates and improvements at no extra cost.',
                color: '#7c3aed'
              },
              { 
                icon: 'fa-video', 
                title: 'Video Tutorials', 
                desc: 'Step-by-step guides to help you get started quickly.',
                color: '#ef4444'
              },
              { 
                icon: 'fa-shield-alt', 
                title: 'Secure Payment', 
                desc: 'Pay safely via GCash, Maya, or GoTyme.',
                color: '#06b6d4'
              },
            ].map((feature, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                gap: '20px',
                padding: '25px',
                borderRadius: '12px',
                background: '#fafafa',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fafafa'}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  background: `${feature.color}15`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className={`fas ${feature.icon}`} style={{ color: feature.color, fontSize: '1.3rem' }}></i>
                </div>
                <div>
                  <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{feature.title}</h4>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#fafafa', padding: '80px 0' }}>
        <div className="container">
          <div className="section-title">
            <h2>What Our Customers Say</h2>
            <p>Trusted by graphic designers and print shops across the Philippines</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
            {[
              { 
                text: "This jersey automation script saved me 5 hours a day! I can now take on more orders without hiring additional staff.", 
                name: "Mark Santos", 
                role: "Jersey Print Shop Owner, Cebu",
                avatar: "M"
              },
              { 
                text: "The sewing pattern script is a game-changer. What used to take me 30 minutes per pattern now takes 30 seconds.", 
                name: "Ana Reyes", 
                role: "Fashion Designer, Manila",
                avatar: "A"
              },
              { 
                text: "Super responsive yung support! Na-resolve agad yung concern ko. Will definitely buy more scripts from SHUZEE.", 
                name: "Rico Dela Cruz", 
                role: "Freelance Designer, Davao",
                avatar: "R"
              }
            ].map((review, index) => (
              <div key={index} style={{ 
                padding: '35px', 
                background: 'white', 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <div style={{ color: '#f59e0b', marginBottom: '20px' }}>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '25px', color: '#374151' }}>"{review.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.2rem'
                  }}>
                    {review.avatar}
                  </div>
                  <div>
                    <h5 style={{ marginBottom: '3px', fontWeight: 600 }}>{review.name}</h5>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '100px 0',
        textAlign: 'center',
        color: 'white'
      }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '15px', color: 'white' }}>
            Ready to Automate Your Workflow?
          </h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, marginBottom: '35px', maxWidth: '600px', margin: '0 auto 35px' }}>
            Join hundreds of Filipino designers who are saving time and earning more with our Photoshop scripts.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn" style={{ 
              background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
              border: 'none',
              padding: '18px 40px',
              fontSize: '1.1rem'
            }}>
              <span><i className="fas fa-shopping-bag" style={{ marginRight: '10px' }}></i>Shop Now</span>
            </Link>
            <a href="https://m.me/shuzee" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ 
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              padding: '18px 40px'
            }}>
              <span><i className="fab fa-facebook-messenger" style={{ marginRight: '10px' }}></i>Message Us</span>
            </a>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section style={{ padding: '50px 0', borderTop: '1px solid #e5e7eb' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Accepted Payment Methods
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/GCash_logo.svg/2560px-GCash_logo.svg.png" alt="GCash" style={{ height: '30px', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Maya_logo.svg/2560px-Maya_logo.svg.png" alt="Maya" style={{ height: '30px', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
              <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>GoTyme</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
