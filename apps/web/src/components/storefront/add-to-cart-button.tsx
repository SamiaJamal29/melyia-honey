"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/products";

export function AddToCartButton({
  product,
  className,
  ...props
}: { readonly product: StoreProduct } & Omit<ButtonProps, "onClick">) {
  const { addItem } = useCart();
  const { t } = usePreferences();
  return (
    <Button
      data-voice={`cart:${product.slug}`}
      data-voice-label={`Add one ${product.name} to cart`}
      className={className}
      onClick={() =>
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          priceSen: product.retailPriceSen,
          weightGrams: product.weightGrams,
          imageUrl: product.imageUrls?.[0],
        })
      }
      {...props}
    >
      <ShoppingBag aria-hidden="true" className="size-4" />
      {t("Add to cart")}
    </Button>
  );
}
