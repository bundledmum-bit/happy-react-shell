import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string | number;
  _key: string;
  name: string;
  price: number;
  qty: number;
  img?: string;
  baseImg?: string;
  brands?: any[];
  selectedBrand?: any;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
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

  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const key = `${product.id}-${product.selectedBrand?.id || "default"}`;
      const existing = prev.find(i => i._key === key);
      if (existing) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, _key: key, qty: 1 }];
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 400);
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, setCart, clearCart, totalItems, subtotal, justAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export const fmt = (n: number) => `₦${n.toLocaleString()}`;
export const generateOrderId = () => `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const BRANDS_BY_BUDGET: Record<string, number> = { starter: 0, standard: 1, premium: 2 };

export function getBrandForBudget(product: any, budget: string) {
  const tierIdx = BRANDS_BY_BUDGET[budget] ?? 1;
  const sorted = [...product.brands].sort((a: any, b: any) => a.tier - b.tier);
  return sorted.find((b: any) => b.tier === tierIdx)
    || sorted.reduce((best: any, b: any) => Math.abs(b.tier - tierIdx) < Math.abs(best.tier - tierIdx) ? b : best, sorted[0]);
}
