import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories, urlFor, writeClient, client } from '../../services/sanityClient';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(true), // Include archived products for admin
        getCategories(),
      ]);
      
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    const action = window.confirm(
      'What would you like to do with this product?\n\n' +
      'Click OK to ARCHIVE (hide from store but keep for order history)\n' +
      'Click Cancel to abort'
    );
    
    if (!action) return;

    setDeleting(productId);
    try {
      // Soft delete - just archive the product
      await writeClient.patch(productId).set({ isArchived: true }).commit();
      setProducts(products.map(p => 
        p._id === productId ? { ...p, isArchived: true } : p
      ));
      alert('Product archived successfully. It will no longer appear in the store.');
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('Failed to archive product: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (productId) => {
    setDeleting(productId);
    try {
      await writeClient.patch(productId).set({ isArchived: false }).commit();
      setProducts(products.map(p => 
        p._id === productId ? { ...p, isArchived: false } : p
      ));
    } catch (error) {
      console.error('Error restoring product:', error);
      alert('Failed to restore product');
    } finally {
      setDeleting(null);
    }
  };

  const handlePermanentDelete = async (productId) => {
    if (!window.confirm('⚠️ PERMANENT DELETE\n\nThis will permanently delete this product and may cause issues with order history.\n\nAre you absolutely sure?')) return;

    setDeleting(productId);
    try {
      // Try to delete reviews first
      const reviews = await client.fetch(
        `*[_type == "review" && product._ref == $productId]{ _id }`,
        { productId }
      );
      for (const review of reviews) {
        await writeClient.delete(review._id);
      }
      
      // Remove from wishlists
      const usersWithWishlist = await client.fetch(
        `*[_type == "user" && $productId in wishlist[]._ref]{ _id }`,
        { productId }
      );
      for (const user of usersWithWishlist) {
        await writeClient.patch(user._id).unset([`wishlist[_ref=="${productId}"]`]).commit();
      }
      
      // Now try to delete
      await writeClient.delete(productId);
      setProducts(products.filter(p => p._id !== productId));
      alert('Product permanently deleted');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Cannot permanently delete. This product is referenced in orders. It will remain archived.');
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.categorySlug === categoryFilter;
    const matchesArchived = showArchived ? product.isArchived : !product.isArchived;
    return matchesSearch && matchesCategory && matchesArchived;
  });

  const archivedCount = products.filter(p => p.isArchived).length;
  const activeCount = products.filter(p => !p.isArchived).length;

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
      <div className="admin-filters" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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
        
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button
            onClick={() => setShowArchived(false)}
            style={{
              padding: '8px 16px',
              background: !showArchived ? '#111' : '#f3f4f6',
              color: !showArchived ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            style={{
              padding: '8px 16px',
              background: showArchived ? '#ef4444' : '#f3f4f6',
              color: showArchived ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            Archived ({archivedCount})
          </button>
        </div>
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
                    <td>₱{product.price?.toLocaleString()}</td>
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
                        {product.isArchived ? (
                          <>
                            <button
                              onClick={() => handleRestore(product._id)}
                              disabled={deleting === product._id}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#22c55e',
                              }}
                              title="Restore"
                            >
                              {deleting === product._id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-undo"></i>
                              )}
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(product._id)}
                              disabled={deleting === product._id}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#ef4444',
                              }}
                              title="Delete Permanently"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDelete(product._id)}
                            disabled={deleting === product._id}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#f59e0b',
                            }}
                            title="Archive"
                          >
                            {deleting === product._id ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-archive"></i>
                            )}
                          </button>
                        )}
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
