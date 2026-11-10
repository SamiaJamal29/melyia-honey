"use client";
/* eslint-disable @next/next/no-img-element -- Firebase product image URLs may be tokenized at runtime. */

import { Check, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { formatMoney } from "@/lib/utils";

import type { CartProduct } from "./cart-provider";

export interface CartAddedNotice {
  readonly id: number;
  readonly product: CartProduct;
  readonly quantity: number;
}

export function CartAddedToast({
  notice,
  onDismiss,
}: {
  readonly notice: CartAddedNotice;
  readonly onDismiss: () => void;
}) {
  const { t } = usePreferences();

  return (
    <aside
      key={notice.id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="cart-toast fixed inset-x-3 bottom-3 z-[70] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_70px_rgba(18,16,12,.28)] sm:inset-x-auto sm:bottom-6 sm:end-6 sm:w-[23rem]"
    >
      <div className="flex gap-3 p-4 pe-12">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-dark text-gold">
          {notice.product.imageUrl ? (
            <img src={notice.product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ShoppingBag className="size-6" aria-hidden="true" />
          )}
          <span className="absolute end-1 top-1 grid size-5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-surface">
            <Check className="size-3" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-emerald-500">
            <Check className="size-3.5" aria-hidden="true" />{t("Added to cart")}
          </p>
          <p className="mt-1 truncate font-display text-xl leading-tight">{t(notice.product.name)}</p>
          <p className="mt-1 text-xs text-muted">
            {notice.quantity} × {notice.product.weightGrams}g · {formatMoney(notice.product.priceSen * notice.quantity)}
          </p>
          <Link href="/cart" className="mt-3 inline-flex min-h-9 items-center rounded-full bg-seal px-4 text-xs font-bold text-on-seal transition hover:bg-gold-light hover:text-ink">
            {t("View cart")}
          </Link>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute end-3 top-3 grid size-8 place-items-center rounded-full text-muted transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={t("Dismiss notification")}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <span className="cart-toast__timer block h-1 origin-left rtl:origin-right bg-gold" aria-hidden="true" />
    </aside>
  );
}
