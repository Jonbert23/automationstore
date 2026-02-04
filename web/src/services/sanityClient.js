import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Sanity configuration from environment variables
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'bsx4rxqm';
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const token = import.meta.env.VITE_SANITY_TOKEN;

// Check if Sanity is configured
const isSanityConfigured = Boolean(projectId && dataset);

// Store customization
export const storeName = import.meta.env.VITE_STORE_NAME || 'SHUZEE';

console.log('Sanity Client initialized with projectId:', projectId);

// Read-only client for fetching data (useCdn: false for fresh data)
export const client = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion: '2024-01-01',
});

// Write client for creating/updating data (requires token)
export const writeClient = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion: '2024-01-01',
  token,
});

const builder = imageUrlBuilder(client);

export const urlFor = (source) => {
  try {
    return builder.image(source);
  } catch {
    return { url: () => 'https://via.placeholder.com/600x600?text=No+Image' };
  }
};

// ==================== PRODUCTS ====================

// Delete a product
export const deleteProduct = async (productId) => {
  if (!isSanityConfigured) {
    console.error('Sanity not configured');
    return { success: false, error: 'Sanity not configured' };
  }
  if (!token) {
    console.error('No Sanity token - cannot delete');
    return { success: false, error: 'No write token configured. Add VITE_SANITY_TOKEN to your environment.' };
  }
  try {
    await writeClient.delete(productId);
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message || 'Failed to delete product' };
  }
};

// Fetch all products
export const getProducts = async () => {
  if (!isSanityConfigured) {
    console.warn('Sanity not configured, returning empty products');
    return [];
  }
  try {
    const query = `*[_type == "product"]{
      _id,
      title,
      slug,
      price,
      comparePrice,
      description,
      "category": category->title,
      "categorySlug": category->slug.current,
      images,
      featured,
      fileType,
      fileSize,
      compatibility
    }`;
    const products = await client.fetch(query);
    console.log('Fetched products from Sanity:', products);
    return products;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return [];
  }
};

// Fetch featured products
export const getFeaturedProducts = async () => {
  if (!isSanityConfigured) return [];
  try {
    const query = `*[_type == "product" && featured == true]{
      _id,
      title,
      slug,
      price,
      comparePrice,
      description,
      "category": category->title,
      images,
      fileType,
      fileSize
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return [];
  }
};

// Fetch single product by slug
export const getProductBySlug = async (slug) => {
  if (!isSanityConfigured) return null;
  try {
    const query = `*[_type == "product" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      price,
      comparePrice,
      description,
      "category": category->title,
      images,
      featured,
      fileType,
      fileSize,
      compatibility,
      accessInstructions,
      features,
      demoVideo
    }`;
    return await client.fetch(query, { slug });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return null;
  }
};

// Fetch all categories
export const getCategories = async () => {
  if (!isSanityConfigured) return [];
  try {
    const query = `*[_type == "category"]{
      _id,
      title,
      slug,
      description,
      image,
      icon
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return [];
  }
};

// Fetch products by category
export const getProductsByCategory = async (categorySlug) => {
  if (!isSanityConfigured) return [];
  try {
    const query = `*[_type == "product" && category->slug.current == $categorySlug]{
      _id,
      title,
      slug,
      price,
      comparePrice,
      description,
      "category": category->title,
      images,
      fileType,
      fileSize
    }`;
    return await client.fetch(query, { categorySlug });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return [];
  }
};

// ==================== USERS ====================

// Simple hash function for passwords (using SHA-256)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Register new user with email/password
export const registerUser = async (name, email, password) => {
  if (!isSanityConfigured) {
    return { success: false, error: 'Sanity not configured' };
  }

  try {
    // Check if email already exists
    const existingUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: email.toLowerCase() }
    );

    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await writeClient.create({
      _type: 'user',
      authType: 'email',
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      addresses: [],
      wishlist: [],
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Failed to create account' };
  }
};

// Login user with email/password
export const loginUser = async (email, password) => {
  if (!isSanityConfigured) {
    return { success: false, error: 'Sanity not configured' };
  }

  try {
    // Find user by email
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: email.toLowerCase() }
    );

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check if user registered with Google
    if (user.authType === 'google') {
      return { success: false, error: 'This email is registered with Google. Please use Google Sign-In.' };
    }

    // Verify password
    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  if (!isSanityConfigured) return null;
  try {
    const query = `*[_type == "user" && email == $email][0]{
      _id,
      authType,
      name,
      email,
      picture,
      addresses,
      "wishlist": wishlist[]->{ _id, title, slug, price, images }
    }`;
    return await client.fetch(query, { email: email.toLowerCase() });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return null;
  }
};

// Get or create user from Google auth data
export const getOrCreateUser = async (googleUser) => {
  if (!isSanityConfigured) {
    // Return mock user for demo
    return {
      _id: 'demo-user',
      authType: 'google',
      googleId: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture,
      addresses: [],
      wishlist: [],
    };
  }
  
  try {
    const { sub: googleId, name, email, picture } = googleUser;

    // Check if user exists by Google ID
    let existingUser = await client.fetch(
      `*[_type == "user" && googleId == $googleId][0]`,
      { googleId }
    );

    if (existingUser) {
      return existingUser;
    }

    // Check if email exists (might have registered with email first)
    existingUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: email.toLowerCase() }
    );

    if (existingUser) {
      // Link Google account to existing user
      const updatedUser = await writeClient
        .patch(existingUser._id)
        .set({ googleId, authType: 'google', picture })
        .commit();
      return updatedUser;
    }

    // Create new user
    const newUser = await writeClient.create({
      _type: 'user',
      authType: 'google',
      googleId,
      name,
      email: email.toLowerCase(),
      picture,
      addresses: [],
      wishlist: [],
    });

    return newUser;
  } catch (error) {
    console.warn('Sanity user error:', error);
    return {
      _id: 'demo-user',
      authType: 'google',
      googleId: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture,
      addresses: [],
      wishlist: [],
    };
  }
};

// Get user by Google ID
export const getUserByGoogleId = async (googleId) => {
  if (!isSanityConfigured) return null;
  try {
    const query = `*[_type == "user" && googleId == $googleId][0]{
      _id,
      googleId,
      name,
      email,
      picture,
      addresses,
      "wishlist": wishlist[]->{ _id, title, slug, price, images }
    }`;
    return await client.fetch(query, { googleId });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient.patch(userId).set(data).commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Add address to user
export const addUserAddress = async (userId, address) => {
  if (!isSanityConfigured) return null;
  try {
    // Add _key for Sanity array items
    const addressWithKey = {
      _key: address._key || Date.now().toString(),
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault || false,
    };

    return await writeClient
      .patch(userId)
      .setIfMissing({ addresses: [] })
      .append('addresses', [addressWithKey])
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Update user addresses (replace all)
export const updateUserAddresses = async (userId, addresses) => {
  if (!isSanityConfigured) return null;
  try {
    // Ensure all addresses have _key
    const addressesWithKeys = addresses.map((addr) => ({
      _key: addr._key || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone || '',
      isDefault: addr.isDefault || false,
    }));

    return await writeClient
      .patch(userId)
      .set({ addresses: addressesWithKeys })
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Remove address from user
export const removeUserAddress = async (userId, addressKey) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient
      .patch(userId)
      .unset([`addresses[_key=="${addressKey}"]`])
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Add product to wishlist
export const addToWishlist = async (userId, productId) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient
      .patch(userId)
      .setIfMissing({ wishlist: [] })
      .append('wishlist', [{ _type: 'reference', _ref: productId }])
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (userId, productId) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient
      .patch(userId)
      .unset([`wishlist[_ref=="${productId}"]`])
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// ==================== ORDERS ====================

// Create order
export const createOrder = async (orderData) => {
  if (!isSanityConfigured) {
    console.log('Demo mode: Order would be created:', orderData);
    return { _id: 'demo-order-' + Date.now() };
  }
  try {
    return await writeClient.create({
      _type: 'order',
      ...orderData,
      status: 'pending',
      paymentVerified: false,
      accessGranted: false,
    });
  } catch (error) {
    console.warn('Sanity create error:', error);
    return { _id: 'demo-order-' + Date.now() };
  }
};

// Update order with payment info
export const submitPayment = async (orderId, paymentData) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient
      .patch(orderId)
      .set({
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        paymentProof: paymentData.paymentProof,
        status: 'payment_submitted',
      })
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Verify payment (admin)
export const verifyPayment = async (orderId, adminEmail) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient
      .patch(orderId)
      .set({
        paymentVerified: true,
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: adminEmail,
        accessGranted: true,
        accessGrantedAt: new Date().toISOString(),
        status: 'completed',
      })
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Reject payment (admin)
export const rejectPayment = async (orderId, reason) => {
  if (!isSanityConfigured) return null;
  try {
    return await writeClient
      .patch(orderId)
      .set({
        status: 'pending',
        notes: reason,
      })
      .commit();
  } catch (error) {
    console.warn('Sanity update error:', error);
    return null;
  }
};

// Get user orders
export const getUserOrders = async (userEmail) => {
  if (!isSanityConfigured) return [];
  try {
    const query = `*[_type == "order" && user == $userEmail] | order(_createdAt desc){
      _id,
      _createdAt,
      items[]{
        quantity,
        price,
        "product": product->{ _id, title, slug, price, images, driveLink }
      },
      total,
      status,
      paymentMethod,
      paymentReference,
      paymentVerified,
      accessGranted,
      accessGrantedAt
    }`;
    return await client.fetch(query, { userEmail });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return [];
  }
};

// Get user's purchased products (with access)
export const getUserPurchases = async (userEmail) => {
  if (!isSanityConfigured) return [];
  try {
    const query = `*[_type == "order" && user == $userEmail && accessGranted == true] | order(_createdAt desc){
      _id,
      _createdAt,
      accessGrantedAt,
      items[]{
        "product": product->{ 
          _id, 
          title, 
          slug, 
          price, 
          images, 
          driveLink,
          fileType,
          fileSize,
          accessInstructions
        }
      }
    }`;
    return await client.fetch(query, { userEmail });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return [];
  }
};

// Get single order by ID
export const getOrderById = async (orderId) => {
  if (!isSanityConfigured) return null;
  try {
    const query = `*[_type == "order" && _id == $orderId][0]{
      _id,
      _createdAt,
      user,
      userName,
      items[]{
        quantity,
        price,
        "product": product->{ _id, title, slug, price, images, driveLink }
      },
      total,
      status,
      paymentMethod,
      paymentReference,
      paymentProof,
      paymentVerified,
      paymentVerifiedAt,
      paymentVerifiedBy,
      accessGranted,
      accessGrantedAt,
      notes
    }`;
    return await client.fetch(query, { orderId });
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return null;
  }
};

// ==================== PAYMENT METHODS ====================

// Get active payment methods
export const getPaymentMethods = async () => {
  if (!isSanityConfigured) return [];
  try {
    const query = `*[_type == "paymentMethod" && isActive == true] | order(sortOrder asc){
      _id,
      name,
      slug,
      qrCode,
      accountName,
      accountNumber,
      instructions
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.warn('Sanity fetch error:', error);
    return [];
  }
};

// Get reviews for a product
export const getProductReviews = async (productId) => {
  try {
    const query = `*[_type == "review" && product._ref == $productId && isApproved == true] | order(_createdAt desc) {
      _id,
      _createdAt,
      userName,
      rating,
      title,
      comment,
      isVerifiedPurchase
    }`;
    return await client.fetch(query, { productId });
  } catch (error) {
    console.warn('Error fetching reviews:', error);
    return [];
  }
};

// Create a new review
export const createReview = async (reviewData) => {
  try {
    const review = await writeClient.create({
      _type: 'review',
      product: {
        _type: 'reference',
        _ref: reviewData.productId,
      },
      user: reviewData.userEmail,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      isApproved: false, // Reviews need admin approval
      isVerifiedPurchase: reviewData.isVerifiedPurchase || false,
    });
    return review;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Check if user has already reviewed a product
export const hasUserReviewed = async (productId, userEmail) => {
  try {
    const query = `count(*[_type == "review" && product._ref == $productId && user == $userEmail])`;
    const count = await client.fetch(query, { productId, userEmail });
    return count > 0;
  } catch (error) {
    console.warn('Error checking review:', error);
    return false;
  }
};
