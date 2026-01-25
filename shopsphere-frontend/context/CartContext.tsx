"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CartItem = {
  productId: number;
  name: string;
  brand: string;
  price: number;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty: number) => void;
  remove: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function add(item: Omit<CartItem, "qty">, qty: number) {
    setItems((prev) => {
      const found = prev.find((x) => x.productId === item.productId);
      if (found) {
        return prev.map((x) =>
          x.productId === item.productId ? { ...x, qty: x.qty + qty } : x
        );
      }
      return [...prev, { ...item, qty }];
    });
  }

  function remove(productId: number) {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }

  function setQty(productId: number, qty: number) {
    setItems((prev) =>
      prev.map((x) =>
        x.productId === productId ? { ...x, qty: Math.max(1, qty) } : x
      )
    );
  }

  function clear() {
    setItems([]);
  }

  const count = useMemo(() => items.reduce((s, x) => s + x.qty, 0), [items]);
  const total = useMemo(() => items.reduce((s, x) => s + x.qty * x.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
