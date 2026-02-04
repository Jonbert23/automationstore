import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, writeClient, urlFor } from '../../services/sanityClient';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setDeleting(categoryId);
    try {
      await writeClient.delete(categoryId);
      setCategories(categories.filter((c) => c._id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'title') {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      title: category.title,
      slug: category.slug?.current || '',
      description: category.description || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ title: '', slug: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please enter a category title');
      return;
    }

    setSaving(true);
    try {
      const doc = {
        _type: 'category',
        title: formData.title,
        slug: {
          _type: 'slug',
          current: formData.slug || generateSlug(formData.title),
        },
        description: formData.description,
      };

      if (editingId) {
        // Update existing category
        await writeClient
          .patch(editingId)
          .set(doc)
          .commit();

        setCategories(categories.map(cat => 
          cat._id === editingId ? { ...cat, ...doc, _id: editingId } : cat
        ));
        alert('Category updated successfully');
      } else {
        // Create new category
        const newCategory = await writeClient.create(doc);
        setCategories([...categories, newCategory]);
        alert('Category created successfully');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(`Failed to ${editingId ? 'update' : 'create'} category`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading categories...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Categories</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="admin-action-btn"
        >
          <i className={`fas fa-${showForm ? 'times' : 'plus'}`}></i>
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Add/Edit Category Form */}
      {showForm && (
        <div className="admin-data-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 className="admin-form-section-title">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Category Name *</label>
                <input
                  type="text"
                  name="title"
                  className="admin-form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Running"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  className="admin-form-input"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <textarea
                name="description"
                className="admin-form-textarea"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description..."
              />
            </div>
            <button
              type="submit"
              className="admin-action-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> {editingId ? 'Update Category' : 'Save Category'}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="admin-data-card">
        {categories.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-tags"></i>
            <p>No categories yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="admin-action-btn"
              style={{ marginTop: '20px' }}
            >
              <i className="fas fa-plus"></i> Add Your First Category
            </button>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td style={{ fontWeight: 600 }}>{category.title}</td>
                  <td style={{ color: '#666' }}>{category.slug?.current}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {category.description || '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        marginRight: '10px',
                      }}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      disabled={deleting === category._id}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger)',
                      }}
                      title="Delete"
                    >
                      {deleting === category._id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-pagination">
        <span>Total: {categories.length} categories</span>
      </div>
    </>
  );
};

export default AdminCategories;
