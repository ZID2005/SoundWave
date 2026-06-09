"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  id: string;
  name: string;
  category: string;
  priceRangeText: string;
  image?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  isInCart: (id: string) => boolean;
  decrementQuantity: (id: string) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  itemCount: 0,
  isInCart: () => false,
  decrementQuantity: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("soundwave_cart");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("soundwave_cart", JSON.stringify(items));
  }, [items, hydrated]);

  // Sync to Firestore when items or user changes (after hydration)
  useEffect(() => {
    if (!hydrated || !user) return;

    const syncCartToFirestore = async () => {
      try {
        const { db } = await import("@/lib/firebase");
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(
          doc(db, "users", user.uid),
          {
            cart: items,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Failed to sync cart to Firestore:", error);
      }
    };

    syncCartToFirestore();
  }, [items, user, hydrated]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const decrementQuantity = useCallback((id: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        if (existing.quantity <= 1) {
          return prev.filter((i) => i.id !== id);
        }
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev;
    });
  }, []);

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, clearCart, itemCount, isInCart, decrementQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};
