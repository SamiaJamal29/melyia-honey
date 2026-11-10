"use client";
/* eslint-disable @next/next/no-img-element -- Tokenized Firebase product images are rendered without optimizer proxying. */

import { MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { HoneyJar } from "@/components/brand/honey-jar";
import { usePreferences } from "@/components/preferences/preferences-provider";
import type { StoreProduct } from "@/lib/products";
import { formatMoney } from "@/lib/utils";

import { AddToCartButton } from "./add-to-cart-button";

export function ProductDetails({ product }: { readonly product: StoreProduct }) {
  const { t } = usePreferences();
  const translatedName = t(product.name);

  return (
    <div className="container-shell grid gap-10 py-10 md:grid-cols-2 md:items-center md:py-20">
      <div className="honeycomb-pattern relative aspect-square overflow-hidden rounded-2xl">
        {product.imageUrls?.[0] ? <img src={product.imageUrls[0]} alt={translatedName} className="h-full w-full object-cover" /> : <><div className="absolute inset-[15%] rounded-full bg-gold/15" /><HoneyJar tone={product.tone} className="absolute inset-x-[26%] bottom-5 top-10" /></>}
        {product.photoCredit && <a href={product.photoCredit.href} target="_blank" rel="noreferrer" className="absolute bottom-3 start-3 rounded-md bg-dark/85 px-2.5 py-1.5 text-[10px] text-cream/75 backdrop-blur-sm">{product.photoCredit.label}</a>}
      </div>
      <div className="md:ps-6">
        <p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t(product.badge)} · {t(product.origin)}</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">{translatedName}</h1>
        <p className="mt-5 text-xl font-bold"><bdi>{formatMoney(product.retailPriceSen)}</bdi> <span className="text-sm font-normal text-muted">/ {product.weightGrams}g</span></p>
        <p className="mt-7 text-base leading-8 text-muted">{t(product.description)}</p>
        <div className="mt-7 flex flex-wrap gap-2">{product.tastingNotes.map((note) => <span key={note} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">{t(note)}</span>)}</div>
        <AddToCartButton product={product} size="lg" className="mt-8 w-full sm:w-auto" />
        <div className="mt-8 grid gap-4 border-t border-line pt-7 sm:grid-cols-3">
          <div className="flex gap-2 text-sm"><MapPin className="size-4 shrink-0 text-gold" /><span>{t(product.origin)}</span></div>
          <div className="flex gap-2 text-sm"><ShieldCheck className="size-4 shrink-0 text-gold" /><span>{t("Lab tested")}</span></div>
          <div className="flex gap-2 text-sm"><Sparkles className="size-4 shrink-0 text-gold" /><span>{t("Cold-extracted")}</span></div>
        </div>
      </div>
    </div>
  );
}
