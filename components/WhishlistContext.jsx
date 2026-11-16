'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'am_wishlist_v1';

// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const PRIMARY = '#8F1538';   // crimson: success icon
const GOLD = '#C58A08';      // secondary: toast accent bar
const INK = '#29211E';       // text
const PAPER = '#FFF9F0';     // background
const HAIRLINE = '#E5CDD3';  // soft border (derived tint of primary)

const toastStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: INK,
  background: PAPER,
  borderRadius: '4px',
  padding: '10px 14px',
  boxShadow: '0 2px 12px rgba(41,33,30,0.12)',
  borderLeft: `3px solid ${GOLD}`,
};

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWishlist(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist, loaded]);

  const addToWishlist = useCallback((productId) => {
    setWishlist((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    toast.success('Added to wishlist', {
      style: toastStyle,
      iconTheme: { primary: PRIMARY, secondary: PAPER },
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
    toast('Removed from wishlist', { icon: '💔', style: { ...toastStyle, borderLeftColor: HAIRLINE } });
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const isWishlisted = useCallback((productId) => wishlist.includes(productId), [wishlist]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}