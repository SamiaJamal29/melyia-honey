"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "./auth/auth-provider";
import { CartProvider } from "./cart/cart-provider";
import { PreferencesProvider } from "./preferences/preferences-provider";

export function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
