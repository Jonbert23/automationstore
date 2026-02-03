import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Cart state
      cart: [],
      
      // User state
      user: null,
      
      // Recently viewed products
      recentlyViewed: [],
      
      // Saved for later
      savedForLater: [],
      
      // Wishlist
      wishlist: [],
      
      // Cart actions
      addToCart: (product, quantity = 1) => {
        const cart = get().cart;
        const existingItem = cart.find((item) => item._id === product._id);
        
        if (existingItem) {
          set({
            cart: cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { ...product, quantity }] });
        }
      },
      
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item._id !== productId),
        })),
      
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === productId ? { ...item, quantity } : item
          ),
        })),
      
      clearCart: () => set({ cart: [] }),
      
      getCartTotal: () => {
        const cart = get().cart;
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getCartCount: () => {
        const cart = get().cart;
        return cart.reduce((count, item) => count + item.quantity, 0);
      },
      
      // User actions
      setUser: (user) => set({ user }),
      
      logout: () => set({ user: null }),
      
      // Recently viewed actions
      addToRecentlyViewed: (product) => {
        const recentlyViewed = get().recentlyViewed;
        // Remove if already exists
        const filtered = recentlyViewed.filter(p => p._id !== product._id);
        // Add to beginning, keep max 10
        set({ recentlyViewed: [product, ...filtered].slice(0, 10) });
      },
      
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
      
      // Save for later actions
      addToSavedForLater: (product) => {
        const savedForLater = get().savedForLater;
        const exists = savedForLater.find(p => p._id === product._id);
        if (!exists) {
          set({ savedForLater: [...savedForLater, product] });
        }
      },
      
      removeFromSavedForLater: (productId) =>
        set((state) => ({
          savedForLater: state.savedForLater.filter((item) => item._id !== productId),
        })),
      
      moveToCart: (product) => {
        get().addToCart(product, 1);
        get().removeFromSavedForLater(product._id);
      },
      
      saveForLater: (product) => {
        get().addToSavedForLater(product);
        get().removeFromCart(product._id);
      },
      
      // Wishlist actions
      addToWishlist: (product) => {
        const wishlist = get().wishlist;
        const exists = wishlist.find(p => p._id === product._id);
        if (!exists) {
          set({ wishlist: [...wishlist, product] });
        }
      },
      
      removeFromWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item._id !== productId),
        })),
      
      isInWishlist: (productId) => {
        return get().wishlist.some(item => item._id === productId);
      },
      
      toggleWishlist: (product) => {
        const isInWishlist = get().isInWishlist(product._id);
        if (isInWishlist) {
          get().removeFromWishlist(product._id);
        } else {
          get().addToWishlist(product);
        }
        return !isInWishlist;
      },
      
      // Sync wishlist from user data (after login)
      syncWishlist: (wishlistFromServer) => {
        if (wishlistFromServer && Array.isArray(wishlistFromServer)) {
          set({ wishlist: wishlistFromServer });
        }
      },
      
      clearWishlist: () => set({ wishlist: [] }),
    }),
    {
      name: 'apex-store',
      partialize: (state) => ({ 
        cart: state.cart,
        recentlyViewed: state.recentlyViewed,
        savedForLater: state.savedForLater,
        wishlist: state.wishlist
      }),
    }
  )
);

export default useStore;
