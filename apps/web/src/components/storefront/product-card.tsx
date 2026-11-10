"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- Tokenized Firebase product images are rendered without optimizer proxying. */

import { HoneyJar } from "@/components/brand/honey-jar";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Badge } from "@/components/ui/badge";
import type { StoreProduct } from "@/lib/products";
import { formatMoney } from "@/lib/utils";

import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product }: { readonly product: StoreProduct }) {
  const { t } = usePreferences();
  const translatedName = t(product.name);
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative">
        <Link
          href={`/shop/${product.slug}`}
          className="relative block h-72 overflow-hidden honeycomb-pattern focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
          aria-label={t("View {name}", { name: translatedName })}
        >
          <Badge className="absolute start-4 top-4 z-10">{t(product.badge)}</Badge>
          {product.imageUrls?.[0] ? <img src={product.imageUrls[0]} alt={translatedName} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-x-[24%] bottom-2 top-5 transition-transform duration-300 group-hover:-translate-y-1"><HoneyJar tone={product.tone} /></div>}
        </Link>
        {product.photoCredit && <a href={product.photoCredit.href} target="_blank" rel="noreferrer" className="absolute bottom-2 start-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-md bg-dark/80 px-2 py-1 text-[9px] text-cream/75 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100">{product.photoCredit.label}</a>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/shop/${product.slug}`} className="font-display text-2xl leading-tight hover:text-gold">
              {translatedName}
            </Link>
            <p className="mt-1 text-sm text-muted">{t(product.origin)} · {product.weightGrams}g</p>
          </div>
          <p className="shrink-0 font-bold"><bdi>{formatMoney(product.retailPriceSen)}</bdi></p>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-muted">{t(product.shortDescription)}</p>
        <AddToCartButton product={product} variant="outline" className="mt-5 w-full" />
      </div>
    </article>
  );
}
