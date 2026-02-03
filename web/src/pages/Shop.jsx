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
          { _id: '1', title: 'Zoom Velocity 5', category: 'Running', price: 149.00, slug: { current: 'zoom-velocity-5' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '2', title: 'Apex High-Top', category: 'Lifestyle', price: 189.00, slug: { current: 'apex-high-top' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '3', title: 'Nitro Boost Red', category: 'Training', price: 129.00, slug: { current: 'nitro-boost-red' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '4', title: 'Cloud Strider', category: 'Running', price: 159.00, slug: { current: 'cloud-strider' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '5', title: 'Marathon Elite', category: 'Running', price: 210.00, slug: { current: 'marathon-elite' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80' } }] },
          { _id: '6', title: 'Court King 2', category: 'Basketball', price: 130.00, slug: { current: 'court-king-2' }, images: [{ asset: { url: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&w=600&q=80' } }] },
        ]);
        setCategories([
          { _id: 'c1', title: 'Running', slug: { current: 'running' } },
          { _id: 'c2', title: 'Basketball', slug: { current: 'basketball' } },
          { _id: 'c3', title: 'Training', slug: { current: 'training' } },
          { _id: 'c4', title: 'Lifestyle', slug: { current: 'lifestyle' } },
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
        case 'newest': return -1; // Assume newest first in original order
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
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1>Performance Footwear</h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', color: '#666' }}>
            Engineered for every athlete. Find your perfect fit for running, training, and lifestyle.
          </p>
        </div>
      </div>

      {/* Shop Layout */}
      <section className="container" style={{ padding: '0 20px 80px' }}>
        <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          
          {/* Sidebar Filters */}
          <aside style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ marginBottom: '40px' }}>
              <h4>Sport</h4>
              <ul style={{ marginTop: '20px' }}>
                <li style={{ marginBottom: '12px' }}>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleCategoryChange('all'); }}
                    style={{ color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--secondary)', fontWeight: selectedCategory === 'all' ? 700 : 400 }}
                  >
                    All Sports
                  </a>
                </li>
                {categories.map(cat => (
                  <li key={cat._id} style={{ marginBottom: '12px' }}>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleCategoryChange(cat.slug?.current || cat.title.toLowerCase()); }}
                      style={{ color: selectedCategory === (cat.slug?.current || cat.title.toLowerCase()) ? 'var(--primary)' : 'var(--secondary)', fontWeight: selectedCategory === (cat.slug?.current || cat.title.toLowerCase()) ? 700 : 400 }}
                    >
                      {cat.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h4>Price Range</h4>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="form-control" 
                  style={{ padding: '10px' }}
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="form-control" 
                  style={{ padding: '10px' }}
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div style={{ flex: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <span style={{ fontWeight: 700, color: '#666' }}>
                Showing {filteredProducts.length} results
              </span>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '10px 30px 10px 10px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Drops</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#ccc' }}></i>
                <p style={{ marginTop: '15px', color: '#888' }}>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#ddd', marginBottom: '15px' }}></i>
                <p style={{ color: '#888' }}>No products found matching your criteria.</p>
                <button 
                  className="btn btn-outline" 
                  style={{ marginTop: '15px' }}
                  onClick={() => { setSelectedCategory('all'); setPriceRange({ min: '', max: '' }); }}
                >
                  <span>Clear Filters</span>
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Shop;
