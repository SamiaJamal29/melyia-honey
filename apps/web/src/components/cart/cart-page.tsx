"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { useCart } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { formatMoney } from "@/lib/utils";

export function CartPage() {
  const { items, subtotalSen, setQuantity, removeItem, isHydrated } = useCart();
  const { t } = usePreferences();
  if (!isHydrated) return <div className="container-shell my-16 h-80 animate-pulse rounded-2xl bg-ink/5" />;
  if (!items.length) {
    return (
      <section className="container-shell py-20 text-center md:py-28">
        <ShoppingBag className="mx-auto size-10 text-gold" />
        <h1 className="mt-5 font-display text-5xl">{t("Your basket is waiting.")}</h1>
        <p className="mt-3 text-muted">{t("Add a Malaysian harvest and it will stay saved on this device.")}</p>
        <Link href="/shop" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Browse honey")}</Link>
      </section>
    );
  }
  return (
    <div className="container-shell py-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t("Your selection")}</p>
          <h1 className="mt-2 font-display text-5xl">{t("Cart")}</h1>
        </div>
        <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-bold transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <Plus className="size-4" aria-hidden="true" />{t("Add more honey")}
        </Link>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {items.map((item, index) => (
            <div key={item.productId} className={`grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center ${index ? "border-t border-line" : ""}`}>
              <div><Link href={`/shop/${item.slug}`} className="font-display text-2xl hover:text-gold">{t(item.name)}</Link><p className="mt-1 text-sm text-muted">{item.weightGrams}g · {formatMoney(item.priceSen)} {t("each")}</p></div>
              <div className="flex w-fit items-center rounded-full border border-line">
                <Button variant="ghost" size="icon" className="size-10 min-h-10" aria-label={t("Decrease {name}", { name: t(item.name) })} onClick={() => setQuantity(item.productId, item.quantity - 1)}><Minus className="size-4" /></Button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <Button variant="ghost" size="icon" className="size-10 min-h-10" aria-label={t("Increase {name}", { name: t(item.name) })} onClick={() => setQuantity(item.productId, item.quantity + 1)}><Plus className="size-4" /></Button>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end"><strong>{formatMoney(item.priceSen * item.quantity)}</strong><Button variant="ghost" size="icon" aria-label={t("Remove {name}", { name: t(item.name) })} onClick={() => removeItem(item.productId)}><Trash2 className="size-4" /></Button></div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-2xl bg-dark p-6 text-cream">
          <h2 className="font-display text-3xl">{t("Summary")}</h2>
          <div className="mt-5 flex justify-between border-b border-white/15 pb-5"><span className="text-cream/60">{t("Subtotal")}</span><strong>{formatMoney(subtotalSen)}</strong></div>
          <p className="mt-4 text-xs leading-5 text-cream/55">{t("Demo delivery is BHD 1.000. Free delivery from BHD 12.000.")}</p>
          <Link href="/checkout" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-bold text-ink hover:bg-gold-light">{t("Open local checkout")}</Link>
        </aside>
      </div>
    </div>
  );
}
