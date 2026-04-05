import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  qty: number;
  emoji: string;
  category: "baby" | "mum" | "bundle";
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, brand: string, qty: number) => void;
  removeFromCart: (id: string, brand: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  justAdded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("bm-cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    localStorage.setItem("bm-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item: Omit<CartItem, "qty">) => {
    setCart(prev => {
      const key = `${item.id}-${item.brand}`;
      const existing = prev.find(i => `${i.id}-${i.brand}` === key);
      if (existing) {
        return prev.map(i => `${i.id}-${i.brand}` === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 400);
  }, []);

  const updateQty = useCallback((id: string, brand: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => !(i.id === id && i.brand === brand)));
    } else {
      setCart(prev => prev.map(i => i.id === id && i.brand === brand ? { ...i, qty } : i));
    }
  }, []);

  const removeFromCart = useCallback((id: string, brand: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.brand === brand)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, totalItems, subtotal, justAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
export const generateOrderId = () => `BM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
