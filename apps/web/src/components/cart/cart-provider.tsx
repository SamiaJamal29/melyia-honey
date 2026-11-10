"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CartAddedToast, type CartAddedNotice } from "./cart-added-toast";

export interface CartProduct {
  readonly productId: string;
  readonly slug: string;
  readonly name: string;
  readonly priceSen: number;
  readonly weightGrams: number;
  readonly imageUrl?: string;
}

export interface CartItem extends CartProduct {
  readonly quantity: number;
}

interface CartContextValue {
  readonly items: readonly CartItem[];
  readonly itemCount: number;
  readonly subtotalSen: number;
  readonly isHydrated: boolean;
  readonly addItem: (product: CartProduct, quantity?: number) => void;
  readonly setQuantity: (productId: string, quantity: number) => void;
  readonly removeItem: (productId: string) => void;
  readonly clearCart: () => void;
}

const storageKey = "melyia-cart-bhd-demo-v1";
const CartContext = createContext<CartContextValue | null>(null);

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    Number.isInteger(item.priceSen) &&
    (item.priceSen ?? -1) >= 0 &&
    Number.isInteger(item.weightGrams) &&
    Number.isInteger(item.quantity) &&
    (item.quantity ?? 0) > 0 &&
    (item.quantity ?? 0) <= 99
  );
};

export function CartProvider({ children }: { readonly children: ReactNode }) {
  const [items, setItems] = useState<readonly CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [addedNotice, setAddedNotice] = useState<CartAddedNotice | null>(null);
  const noticeId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as unknown;
        if (Array.isArray(saved)) setItems(saved.filter(isCartItem));
      } catch {
        window.localStorage.removeItem(storageKey);
      } finally {
        setIsHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [isHydrated, items]);

  useEffect(() => {
    if (!addedNotice) return;
    const timer = window.setTimeout(() => setAddedNotice(null), 4_500);
    return () => window.clearTimeout(timer);
  }, [addedNotice]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: CartProduct, quantity = 1) => {
      const safeQuantity = Math.min(99, Math.max(1, Math.trunc(quantity)));
      noticeId.current += 1;
      setAddedNotice({ id: noticeId.current, product, quantity: safeQuantity });
      setItems((current) => {
        const existing = current.find((item) => item.productId === product.productId);
        if (!existing) return [...current, { ...product, quantity: safeQuantity }];
        return current.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: Math.min(99, item.quantity + safeQuantity) }
            : item,
        );
      });
    };

    const setQuantity = (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((current) => current.filter((item) => item.productId !== productId));
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(99, Math.trunc(quantity)) }
            : item,
        ),
      );
    };

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalSen: items.reduce((sum, item) => sum + item.priceSen * item.quantity, 0),
      isHydrated,
      addItem,
      setQuantity,
      removeItem: (productId) =>
        setItems((current) => current.filter((item) => item.productId !== productId)),
      clearCart: () => setItems([]),
    };
  }, [isHydrated, items]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {addedNotice && <CartAddedToast notice={addedNotice} onDismiss={() => setAddedNotice(null)} />}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider.");
  return value;
}
