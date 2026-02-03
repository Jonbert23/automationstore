import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { client, writeClient, getCategories, urlFor } from '../../services/sanityClient';

const AdminProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isEditing = productId && productId !== 'new';

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // New category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    price: '',
    comparePrice: '',
    description: '',
    category: '',
    featured: false,
    images: [],
    // Digital Product Fields
    driveLink: '',
    fileType: 'jsx',
    fileSize: '',
    compatibility: '',
    accessInstructions: '',
    demoVideo: '',
    features: [],
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    setSavingCategory(true);
    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newCategory = await writeClient.create({
        _type: 'category',
        title: newCategoryName.trim(),
        slug: {
          _type: 'slug',
          current: slug,
        },
      });

      setCategories([...categories, newCategory]);
      setFormData((prev) => ({ ...prev, category: newCategory._id }));
      setNewCategoryName('');
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    } finally {
      setSavingCategory(false);
    }
  };

  const fetchProduct = async () => {
    try {
      const product = await client.fetch(
        `*[_type == "product" && _id == $id][0]{
          _id,
          title,
          slug,
          price,
          comparePrice,
          description,
          category->{ _id },
          featured,
          images,
          driveLink,
          fileType,
          fileSize,
          compatibility,
          accessInstructions,
          demoVideo,
          features
        }`,
        { id: productId }
      );

      if (product) {
        setFormData({
          title: product.title || '',
          slug: product.slug?.current || '',
          price: product.price || '',
          comparePrice: product.comparePrice || '',
          description: product.description || '',
          category: product.category?._id || '',
          featured: product.featured || false,
          images: product.images || [],
          driveLink: product.driveLink || '',
          fileType: product.fileType || 'jsx',
          fileSize: product.fileSize || '',
          compatibility: product.compatibility || '',
          accessInstructions: product.accessInstructions || '',
          demoVideo: product.demoVideo || '',
          features: product.features || [],
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'title' && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const asset = await writeClient.assets.upload('image', file);
          return {
            _type: 'image',
            _key: asset._id,
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          };
        })
      );

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Features handlers
  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, { _key: Date.now().toString(), title: '', description: '' }],
    }));
  };

  const updateFeature = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      ),
    }));
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.driveLink) {
      alert('Please fill in required fields (Title, Price, and Google Drive Link)');
      return;
    }

    setSaving(true);
    try {
      // Filter out empty features
      const validFeatures = formData.features
        .filter((feature) => feature.title.trim())
        .map((feature) => ({
          _type: 'feature',
          _key: feature._key || Date.now().toString(),
          title: feature.title.trim(),
          description: feature.description?.trim() || '',
        }));

      const productData = {
        _type: 'product',
        title: formData.title,
        slug: {
          _type: 'slug',
          current: formData.slug || generateSlug(formData.title),
        },
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        description: formData.description,
        category: formData.category
          ? { _type: 'reference', _ref: formData.category }
          : null,
        featured: formData.featured,
        images: formData.images,
        // Digital fields
        driveLink: formData.driveLink,
        fileType: formData.fileType,
        fileSize: formData.fileSize || null,
        compatibility: formData.compatibility || null,
        accessInstructions: formData.accessInstructions || null,
        demoVideo: formData.demoVideo || null,
        features: validFeatures,
      };

      if (isEditing) {
        await writeClient.patch(productId).set(productData).commit();
      } else {
        await writeClient.create(productData);
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Make sure your Sanity token has write permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading product...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/admin/products" style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="admin-page-title">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/products" className="admin-action-btn secondary">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            className="admin-action-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Save Product
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* Left Column: Main Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Basic Info */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <h3 className="admin-form-section-title">Basic Information</h3>
              <div className="admin-form-group">
                <label className="admin-form-label">Product Title *</label>
                <input
                  type="text"
                  name="title"
                  className="admin-form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Sewing Pattern Automation Script"
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
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea
                  name="description"
                  className="admin-form-textarea"
                  rows="6"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what your product does and its benefits..."
                />
              </div>
            </div>

            {/* Preview Images */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <h3 className="admin-form-section-title">Preview Images</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                Upload screenshots or preview images of your digital product
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
              <div
                className="admin-image-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#ccc', marginBottom: '10px' }}></i>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Uploading...</p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#ccc', marginBottom: '10px' }}></i>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Click to upload preview images</p>
                  </>
                )}
              </div>
              {formData.images.length > 0 && (
                <div className="admin-media-grid">
                  {formData.images.map((image, index) => (
                    <div key={image._key || index} className="admin-media-item">
                      <img
                        src={urlFor(image).width(200).url()}
                        alt={`Preview ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="admin-media-remove"
                        onClick={() => removeImage(index)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Digital Product Info */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <h3 className="admin-form-section-title">
                <i className="fas fa-download" style={{ marginRight: '10px' }}></i>
                Digital Product Details
              </h3>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Google Drive Link *</label>
                <input
                  type="url"
                  name="driveLink"
                  className="admin-form-input"
                  value={formData.driveLink}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/..."
                  required
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  This link will be shared with customers after payment verification
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">File Type</label>
                  <select
                    name="fileType"
                    className="admin-form-select"
                    value={formData.fileType}
                    onChange={handleInputChange}
                  >
                    <option value="jsx">Photoshop Script (.jsx)</option>
                    <option value="atn">Photoshop Action (.atn)</option>
                    <option value="zip">ZIP Archive</option>
                    <option value="pdf">PDF Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">File Size</label>
                  <input
                    type="text"
                    name="fileSize"
                    className="admin-form-input"
                    value={formData.fileSize}
                    onChange={handleInputChange}
                    placeholder="e.g., 2.5 MB"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Compatibility</label>
                <input
                  type="text"
                  name="compatibility"
                  className="admin-form-input"
                  value={formData.compatibility}
                  onChange={handleInputChange}
                  placeholder="e.g., Photoshop CC 2020+"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Demo Video URL</label>
                <input
                  type="url"
                  name="demoVideo"
                  className="admin-form-input"
                  value={formData.demoVideo}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  YouTube or Vimeo link showing the product in action
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Access Instructions</label>
                <textarea
                  name="accessInstructions"
                  className="admin-form-textarea"
                  rows="4"
                  value={formData.accessInstructions}
                  onChange={handleInputChange}
                  placeholder="Step-by-step instructions for downloading and using the product..."
                />
              </div>
            </div>

            {/* Features */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="admin-form-section-title" style={{ marginBottom: 0 }}>Product Features</h3>
                <button
                  type="button"
                  onClick={addFeature}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fas fa-plus"></i> Add Feature
                </button>
              </div>

              {formData.features.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                  <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', marginBottom: '10px', display: 'block' }}></i>
                  No features added yet. Click "Add Feature" to highlight product capabilities.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {formData.features.map((feature, index) => (
                    <div
                      key={feature._key || index}
                      style={{
                        padding: '15px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                            Feature Title
                          </label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="e.g., One-Click Pattern Generation"
                            value={feature.title}
                            onChange={(e) => updateFeature(index, 'title', e.target.value)}
                            style={{ margin: 0 }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '8px',
                            marginTop: '20px',
                            borderRadius: '4px',
                          }}
                          title="Remove feature"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="Brief description of this feature"
                          value={feature.description || ''}
                          onChange={(e) => updateFeature(index, 'description', e.target.value)}
                          style={{ margin: 0 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Organization & Pricing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Pricing */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <h3 className="admin-form-section-title">Pricing</h3>
              <div className="admin-form-group">
                <label className="admin-form-label">Price (₱) *</label>
                <input
                  type="number"
                  name="price"
                  className="admin-form-input"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Compare at Price (₱)</label>
                <input
                  type="number"
                  name="comparePrice"
                  className="admin-form-input"
                  value={formData.comparePrice}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Original price for showing discounts
                </small>
              </div>
            </div>

            {/* Visibility */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <h3 className="admin-form-section-title">Visibility</h3>
              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                  />
                  <span>Featured Product</span>
                </label>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                  Featured products appear on the homepage
                </small>
              </div>
            </div>

            {/* Category */}
            <div className="admin-data-card" style={{ padding: '30px' }}>
              <h3 className="admin-form-section-title">Category</h3>
              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="admin-form-label" style={{ marginBottom: 0 }}>Category</label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    <i className={`fas fa-${showCategoryForm ? 'times' : 'plus'}`}></i> {showCategoryForm ? 'Cancel' : 'Add New'}
                  </button>
                </div>
                
                {showCategoryForm && (
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '15px', 
                    borderRadius: '6px', 
                    marginBottom: '15px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g., Sewing Patterns, Mockups"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={savingCategory}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      {savingCategory ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Create Category
                        </>
                      )}
                    </button>
                  </div>
                )}

                <select
                  name="category"
                  className="admin-form-select"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
                
                {categories.length === 0 && !showCategoryForm && (
                  <small style={{ color: 'var(--warning)', display: 'block', marginTop: '8px' }}>
                    <i className="fas fa-info-circle"></i> No categories yet. Click "Add New" above to create one.
                  </small>
                )}
              </div>
            </div>

            {/* Tips */}
            <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#166534' }}>
                <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                Tips for Digital Products
              </h4>
              <ul style={{ fontSize: '0.85rem', color: '#15803d', paddingLeft: '18px', lineHeight: 1.8, margin: 0 }}>
                <li>Use a shared Google Drive folder for your files</li>
                <li>Add clear access instructions for customers</li>
                <li>Include demo videos to showcase your product</li>
                <li>List all key features to help buyers decide</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default AdminProductForm;
