"use client";

import { Clock3, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { readLocalPurchaseHistory, type LocalPurchase } from "@/lib/local-purchase-history";
import { formatMoney } from "@/lib/utils";

export default function AccountPage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const { locale, t } = usePreferences();
  const [purchases, setPurchases] = useState<readonly LocalPurchase[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPurchases(user && profile?.role === "customer" ? readLocalPurchaseHistory(user.uid) : []);
      setHistoryLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profile?.role, user]);

  if (isLoading) return <div className="container-shell my-16 h-64 animate-pulse rounded-2xl bg-ink/5" />;
  if (!profile) return <div className="container-shell py-20 text-center"><h1 className="font-display text-5xl">{t("Sign in to view your account.")}</h1><Link href="/login" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Sign in")}</Link></div>;
  return (
    <div className="container-shell space-y-8 py-14 md:py-20">
      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-6 md:p-8"><p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{profile.role}</p><h1 className="mt-2 font-display text-5xl">{t("Hello, {name}", { name: profile.displayName ?? profile.email })}</h1><p className="mt-4 text-muted">{t("Your orders are saved securely. A local receipt is also kept for quick access on this device.")}</p><div className="mt-7 flex flex-wrap gap-3">{profile.role === "admin" && <Link href="/admin" className="inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Open admin")}</Link>}{profile.role === "reseller" && <Link href="/reseller" className="inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Open reseller portal")}</Link>}<Button variant="outline" onClick={() => void signOut()}>{t("Sign out")}</Button></div></div>

      {profile.role === "customer" && <section id="purchase-history" className="scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line p-6 sm:flex-row sm:items-end sm:justify-between md:p-8"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t("Your harvests")}</p><h2 className="mt-2 font-display text-4xl">{t("Purchase history")}</h2></div><Link href="/shop" className="text-sm font-bold text-gold hover:underline">{t("Shop more honey →")}</Link></div>
        {!historyLoaded ? <div className="h-48 animate-pulse bg-ink/5" /> : purchases.length ? <div className="grid gap-4 p-4 md:p-6">{purchases.map((purchase) => <article key={purchase.reference} className="rounded-2xl border border-line p-5 md:p-6"><div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs text-gold">{purchase.reference}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted"><Clock3 className="size-4" />{new Date(purchase.purchasedAt).toLocaleString(locale === "ar" ? "ar-BH" : "en-MY", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="sm:text-end"><p className="text-lg font-bold">{formatMoney(purchase.totalSen)}</p><p className="text-xs text-muted">{purchase.paymentMethod}</p></div></div><div className="mt-4 grid gap-3">{purchase.items.map((item) => <div key={item.productId} className="flex items-center justify-between gap-4 text-sm"><div><Link href={`/shop/${item.slug}`} className="font-bold hover:text-gold">{t(item.name)}</Link><p className="mt-1 text-xs text-muted">{item.quantity} × {item.weightGrams}g</p></div><span>{formatMoney(item.unitPriceSen * item.quantity)}</span></div>)}</div></article>)}</div> : <div className="p-10 text-center md:p-14"><PackageCheck className="mx-auto size-9 text-gold" /><h3 className="mt-4 font-display text-3xl">{t("No purchases yet.")}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{t("Complete checkout while signed in and the honey you bought will appear here.")}</p><Link href="/shop" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Browse honey")}</Link></div>}
      </section>}
    </div>
  );
}
