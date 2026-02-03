import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories, urlFor, writeClient, client } from '../../services/sanityClient';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('=== AdminProducts: Starting fetch ===');
    try {
      // Direct fetch test
      console.log('Testing direct Sanity fetch...');
      const directTest = await client.fetch('*[_type == "product"]{ _id, title }');
      console.log('Direct test result:', directTest);
      
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      console.log('getProducts() returned:', productsData);
      console.log('getCategories() returned:', categoriesData);
      
      if (!productsData || productsData.length === 0) {
        console.warn('No products returned from getProducts()');
      }
      
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      console.log('=== AdminProducts: Fetch complete ===');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    setDeleting(productId);
    try {
      await writeClient.delete(productId);
      setProducts(products.filter((p) => p._id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.categorySlug === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', class: 'admin-status-out-of-stock' };
    if (stock < 10) return { label: 'Low Stock', class: 'admin-status-pending' };
    return { label: 'In Stock', class: 'admin-status-active' };
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading products...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Products</h1>
        <Link to="/admin/products/new" className="admin-action-btn">
          <i className="fas fa-plus"></i> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          className="admin-form-input"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <select
          className="admin-form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug?.current}>
              {cat.title}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="admin-data-card">
        {filteredProducts.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-box-open"></i>
            <p>No products found</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="admin-product-image">
                        {product.images?.[0] ? (
                          <img src={urlFor(product.images[0]).width(100).url()} alt={product.title} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{product.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {product.slug?.current}
                      </div>
                    </td>
                    <td>{product.category || '-'}</td>
                    <td>{product.stock ?? 0}</td>
                    <td>${product.price?.toFixed(2)}</td>
                    <td>
                      <span className={`admin-status-badge ${stockStatus.class}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Link
                          to={`/admin/products/${product._id}`}
                          style={{ color: '#666' }}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={deleting === product._id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                          }}
                          title="Delete"
                        >
                          {deleting === product._id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div className="admin-pagination">
        <span>Showing {filteredProducts.length} of {products.length} products</span>
      </div>
    </>
  );
};

export default AdminProducts;
