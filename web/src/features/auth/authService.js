import { getOrCreateUser, getUserByGoogleId, getUserByEmail, loginUser, registerUser } from '../../services/sanityClient';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const AUTH_STORAGE_KEY = 'apex_user_session';

// Check if Google Auth is configured
const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id.apps.googleusercontent.com';

// Load Google Identity Services script dynamically
const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

// Initialize Google Sign-In
export const initGoogleAuth = async (onSuccess, onError) => {
  if (!isGoogleConfigured) {
    console.log('Google Auth not configured. Skipping initialization.');
    return;
  }

  try {
    await loadGoogleScript();
    
    if (!window.google) {
      console.warn('Google Identity Services not available');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const payload = decodeJwt(response.credential);
          const user = await getOrCreateUser(payload);
          localStorage.setItem('apex_auth_token', response.credential);
          onSuccess(user);
        } catch (error) {
          console.error('Auth error:', error);
          onError(error);
        }
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Google Auth:', error);
  }
};

// Render Google Sign-In button
export const renderGoogleButton = async (elementId) => {
  if (!isGoogleConfigured) {
    // Show a placeholder message
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Google Sign-In not configured.<br/>Add VITE_GOOGLE_CLIENT_ID to .env</p>';
    }
    return;
  }

  try {
    await loadGoogleScript();
    
    if (!window.google) return;
    
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      { 
        theme: 'outline', 
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 280,
      }
    );
  } catch (error) {
    console.warn('Failed to render Google button:', error);
  }
};

// Prompt One Tap sign-in
export const promptOneTap = async () => {
  if (!isGoogleConfigured || !window.google) return;
  
  try {
    window.google.accounts.id.prompt();
  } catch (error) {
    console.warn('One Tap error:', error);
  }
};

// Email/Password Login
export const emailLogin = async (email, password) => {
  const result = await loginUser(email, password);
  
  if (result.success) {
    // Store session
    const session = {
      type: 'email',
      email: result.user.email,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
  
  return result;
};

// Email/Password Register
export const emailRegister = async (name, email, password) => {
  const result = await registerUser(name, email, password);
  
  if (result.success) {
    // Store session
    const session = {
      type: 'email',
      email: result.user.email,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
  
  return result;
};

// Sign out
export const signOut = () => {
  if (window.google) {
    try {
      window.google.accounts.id.disableAutoSelect();
    } catch (error) {
      // Ignore errors
    }
  }
  localStorage.removeItem('apex_auth_token');
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// Check for existing session
export const checkExistingSession = async () => {
  // Check for email session first
  const emailSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (emailSession) {
    try {
      const session = JSON.parse(emailSession);
      
      // Check if session is expired
      if (session.exp < Date.now()) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        // Get user from Sanity
        const user = await getUserByEmail(session.email);
        if (user) return user;
      }
    } catch (error) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  // Check for Google token
  const token = localStorage.getItem('apex_auth_token');
  if (!token) return null;

  try {
    const payload = decodeJwt(token);
    
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('apex_auth_token');
      return null;
    }

    // Get user from Sanity
    const user = await getUserByGoogleId(payload.sub);
    return user;
  } catch (error) {
    localStorage.removeItem('apex_auth_token');
    return null;
  }
};

// Decode JWT token (Google's ID token)
const decodeJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};
