import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { getProducts, getCategories } from '../services/sanityClient';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use mock data if Sanity is not configured
        setProducts([
          { _id: '1', title: 'Jersey Automation Pro', category: 'Jersey Mockups', price: 2500, slug: { current: 'jersey-automation-pro' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '2', title: 'Pattern Generator', category: 'Sewing Patterns', price: 1800, slug: { current: 'pattern-generator' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '3', title: 'Bulk Resize Script', category: 'Bulk Actions', price: 1200, slug: { current: 'bulk-resize-script' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '4', title: 'DTF Print Ready', category: 'Print Ready', price: 2000, slug: { current: 'dtf-print-ready' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=600&q=80' } }] },
        ]);
        setCategories([
          { _id: 'c1', title: 'Jersey Mockups', slug: { current: 'jersey-mockups' } },
          { _id: 'c2', title: 'Sewing Patterns', slug: { current: 'sewing-patterns' } },
          { _id: 'c3', title: 'Bulk Actions', slug: { current: 'bulk-actions' } },
          { _id: 'c4', title: 'Print Ready', slug: { current: 'print-ready' } },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products
  const filteredProducts = products
    .filter(product => {
      if (selectedCategory !== 'all') {
        const categoryMatch = product.category?.toLowerCase() === selectedCategory.toLowerCase() ||
                              product.categorySlug === selectedCategory;
        if (!categoryMatch) return false;
      }
      if (priceRange.min && product.price < parseFloat(priceRange.min)) return false;
      if (priceRange.max && product.price > parseFloat(priceRange.max)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'newest': return -1;
        default: return 0;
      }
    });

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="store-page-header" style={{ 
        padding: '150px 0 80px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
        borderBottom: '1px solid #333'
      }}>
        <div className="container">
          <h1 style={{ color: 'white', fontSize: '3.5rem' }}>Photoshop Scripts</h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '15px auto 0', color: '#9ca3af' }}>
            Automation tools for jersey mockups, sewing patterns, and print production.
          </p>
        </div>
      </div>

      {/* Shop Layout */}
      <section className="container store-page-section" style={{ padding: '60px 20px 80px' }}>
        <div className="shop-layout" style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          
          {/* Sidebar Filters */}
          <aside className="shop-sidebar" style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#D9FF00', marginBottom: '20px' }}>Category</h4>
              <ul style={{ marginTop: '20px' }}>
                <li style={{ marginBottom: '12px' }}>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleCategoryChange('all'); }}
                    style={{ 
                      color: selectedCategory === 'all' ? '#D9FF00' : '#9ca3af', 
                      fontWeight: selectedCategory === 'all' ? 700 : 400,
                      transition: 'color 0.2s'
                    }}
                  >
                    All Scripts
                  </a>
                </li>
                {categories.map(cat => (
                  <li key={cat._id} style={{ marginBottom: '12px' }}>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleCategoryChange(cat.slug?.current || cat.title.toLowerCase()); }}
                      style={{ 
                        color: selectedCategory === (cat.slug?.current || cat.title.toLowerCase()) ? '#D9FF00' : '#9ca3af', 
                        fontWeight: selectedCategory === (cat.slug?.current || cat.title.toLowerCase()) ? 700 : 400,
                        transition: 'color 0.2s'
                      }}
                    >
                      {cat.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#D9FF00', marginBottom: '20px' }}>Price Range</h4>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  style={{ 
                    padding: '12px',
                    background: '#222',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    width: '100%'
                  }}
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <span style={{ color: '#666' }}>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  style={{ 
                    padding: '12px',
                    background: '#222',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    width: '100%'
                  }}
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>

            {/* Info Box */}
            <div style={{ 
              background: '#222', 
              border: '1px solid #333', 
              borderRadius: '12px', 
              padding: '20px'
            }}>
              <h5 style={{ color: '#D9FF00', marginBottom: '12px', fontSize: '0.9rem' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                Need Help?
              </h5>
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Message us on Facebook for custom script requests or compatibility questions.
              </p>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="shop-products" style={{ flex: 3 }}>
            <div className="shop-toolbar" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '40px', 
              borderBottom: '1px solid #333', 
              paddingBottom: '20px' 
            }}>
              <span style={{ fontWeight: 700, color: '#9ca3af' }}>
                Showing {filteredProducts.length} results
              </span>
              <select 
                style={{ 
                  padding: '12px 20px',
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#D9FF00' }}></i>
                <p style={{ marginTop: '15px', color: '#9ca3af' }}>Loading scripts...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#333', marginBottom: '15px' }}></i>
                <p style={{ color: '#9ca3af' }}>No scripts found matching your criteria.</p>
                <button 
                  className="btn" 
                  style={{ marginTop: '15px', background: '#D9FF00', color: 'black', border: 'none' }}
                  onClick={() => { setSelectedCategory('all'); setPriceRange({ min: '', max: '' }); }}
                >
                  <span>Clear Filters</span>
                </button>
              </div>
            ) : (
              <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
