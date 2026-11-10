"use client";
/* eslint-disable @next/next/no-img-element -- Firebase token URLs are rendered directly without proxying customer uploads. */

import { ArrowUpRight, Handshake, ImagePlus, LoaderCircle, PackageCheck, Pencil, Percent, ShoppingBag, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { RoleGate } from "@/components/auth/role-gate";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandMark } from "@/components/brand/brand-mark";
import { SitePreferences } from "@/components/preferences/site-preferences";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { formatServerMoney } from "@/lib/utils";

import { getResellerMetrics } from "./metrics";
import { ResellerProductEditForm } from "./reseller-product-edit-form";
import { ResellerProductForm } from "./reseller-product-form";
import type { ResellerSubmission } from "./reseller-product-types";

interface ResellerProfile { readonly companyName: string; readonly tier: "starter" | "silver" | "gold"; readonly discountBasisPoints: number; readonly status: string }
interface ResellerProduct { readonly id: string; readonly name: string; readonly origin: string; readonly weightGrams: number; readonly retailPriceSen: number; readonly resellerPriceSen: number; readonly discountBasisPoints: number }
interface ResellerOrder { readonly id: string; readonly status: string; readonly totalSen: number; readonly createdAt: string; readonly items?: readonly { readonly name: string; readonly quantity: number }[] }
interface DataResponse<T> { readonly data: T }

export function ResellerDashboard() {
  const { user, profile, signOut } = useAuth();
  const { locale, t } = usePreferences();
  const [reseller, setReseller] = useState<ResellerProfile | null>(null);
  const [catalog, setCatalog] = useState<readonly ResellerProduct[]>([]);
  const [submissions, setSubmissions] = useState<readonly ResellerSubmission[]>([]);
  const [orders, setOrders] = useState<readonly ResellerOrder[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<ResellerSubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const idToken = await user.getIdToken();
      const [resellerData, catalogData, orderData, submissionData] = await Promise.all([
        apiRequest<DataResponse<ResellerProfile>>("/api/resellers/me", { idToken }),
        apiRequest<DataResponse<readonly ResellerProduct[]>>("/api/resellers/catalog", { idToken }),
        apiRequest<DataResponse<readonly ResellerOrder[]>>("/api/orders/me", { idToken }),
        apiRequest<DataResponse<readonly ResellerSubmission[]>>("/api/resellers/products", { idToken }),
      ]);
      setReseller(resellerData.data); setCatalog(catalogData.data); setOrders(orderData.data); setSubmissions(submissionData.data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("Partner data could not be loaded.")); }
    finally { setLoading(false); }
  }, [t, user]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const refreshSubmissions = useCallback(async () => {
    if (!user) return;
    const idToken = await user.getIdToken();
    const response = await apiRequest<DataResponse<readonly ResellerSubmission[]>>("/api/resellers/products", { idToken });
    setSubmissions(response.data);
  }, [user]);
  const deleteSubmission = async (id: string) => {
    if (!user || deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      await apiRequest(`/api/resellers/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
        idToken: await user.getIdToken(),
      });
      if (editingSubmission?.id === id) setEditingSubmission(null);
      setDeleteTarget(null);
      await refreshSubmissions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("The product could not be deleted."));
    } finally {
      setDeletingId(null);
    }
  };
  const metrics = getResellerMetrics({ discountBasisPoints: reseller?.discountBasisPoints ?? 0, orders });

  return (
    <RoleGate allow={["reseller"]} fallback={<div className="relative grid min-h-screen place-items-center bg-portal-sidebar p-5 text-portal-sidebar-foreground transition-colors"><SitePreferences className="absolute end-5 top-5" /><div className="max-w-lg text-center"><Handshake className="mx-auto size-10 text-gold" /><h1 className="mt-5 font-display text-5xl">{t("Partner access required")}</h1><p className="mt-4 text-portal-sidebar-muted">{t("Sign in with a reseller account, or register your company for immediate starter pricing.")}</p><div className="mt-7 flex justify-center gap-3"><Link href="/login" className="inline-flex min-h-11 items-center rounded-full bg-gold px-6 text-sm font-bold text-ink">{t("Sign in")}</Link><Link href="/reseller/register" className="inline-flex min-h-11 items-center rounded-full border border-portal-sidebar-line px-6 text-sm font-bold">{t("Register")}</Link></div></div></div>}>
      <div className="min-h-screen bg-background md:grid md:grid-cols-[15rem_1fr]">
        <aside className="bg-portal-sidebar p-5 text-portal-sidebar-foreground transition-colors md:sticky md:top-0 md:flex md:h-screen md:flex-col md:p-6"><Link href="/"><BrandMark inverse subtitle={t("Reseller Program")} /></Link><nav className="mt-7 flex gap-2 overflow-x-auto md:grid"><a href="#overview" className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl bg-portal-sidebar-active px-3 text-sm font-semibold"><Store className="size-4 text-gold" />{t("Overview")}</a><a href="#products" className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm text-portal-sidebar-muted hover:bg-portal-sidebar-hover hover:text-portal-sidebar-foreground"><ImagePlus className="size-4 text-gold" />{t("Add products")}</a><a href="#catalog" className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm text-portal-sidebar-muted hover:bg-portal-sidebar-hover hover:text-portal-sidebar-foreground"><Percent className="size-4 text-gold" />{t("Pricing")}</a><a href="#orders" className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm text-portal-sidebar-muted hover:bg-portal-sidebar-hover hover:text-portal-sidebar-foreground"><ShoppingBag className="size-4 text-gold" />{t("Orders")}</a></nav><div className="mt-auto hidden border-t border-portal-sidebar-line pt-5 md:block"><p className="truncate text-sm font-semibold">{profile?.displayName ?? profile?.email}</p><p className="text-xs text-portal-sidebar-muted">{reseller?.companyName}</p><button className="mt-3 text-xs text-gold" onClick={() => void signOut()}>{t("Sign out")}</button></div></aside>
        <main className="min-w-0"><header className="flex min-h-20 items-center justify-between gap-3 border-b border-line bg-surface px-5 md:px-8"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-gold">{t("Partner dashboard")}</p><h1 className="font-display text-3xl">{reseller?.companyName ?? t("Melyia reseller")}</h1></div><div className="flex shrink-0 items-center gap-3"><SitePreferences /><Link href="/shop" className="hidden items-center gap-2 text-sm font-bold text-gold lg:flex">{t("View storefront")} <ArrowUpRight className="size-4" /></Link></div></header>
          <div className="space-y-7 p-4 md:p-8">{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}{loading ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="size-8 animate-spin text-gold" /></div> : reseller && <>
            <section id="overview" className="scroll-mt-24"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-dark p-5 text-cream"><p className="text-sm text-cream/50">{t("Pricing tier")}</p><p className="mt-3 font-display text-4xl capitalize text-gold">{t(reseller.tier)}</p><p className="mt-1 text-xs text-cream/45">{t("{percent}% off retail", { percent: metrics.discountPercent })}</p></div><div className="rounded-2xl border border-line bg-surface p-5"><p className="text-sm text-muted">{t("Active orders")}</p><p className="mt-3 text-4xl font-bold">{metrics.activeOrders}</p></div><div className="rounded-2xl border border-line bg-surface p-5"><p className="text-sm text-muted">{t("Completed order value")}</p><p className="mt-3 text-3xl font-bold">{formatServerMoney(metrics.completedOrderValueSen)}</p></div></div></section>
            <section id="products" className="scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex items-start justify-between gap-4 border-b border-line p-5 md:p-7"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-gold">{t("Your range")}</p><h2 className="mt-2 font-display text-4xl">{t("Add a new honey")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t("Upload product photography and submit a new honey or gift product for Melyia review.")}</p></div><ImagePlus className="hidden size-7 text-gold sm:block" /></div>
              <ResellerProductForm onCreated={refreshSubmissions} />
              <div className="border-t border-line bg-background/35 p-5 md:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-display text-3xl">{t("Your submissions")}</h3><p className="mt-1 text-sm text-muted">{t("Edit product details or remove products you no longer sell.")}</p></div></div>
                {editingSubmission && <ResellerProductEditForm product={editingSubmission} onCancel={() => setEditingSubmission(null)} onSaved={refreshSubmissions} />}
                {submissions.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{submissions.map((submission) => <article key={submission.id} className={`overflow-hidden rounded-2xl border bg-surface transition ${editingSubmission?.id === submission.id ? "border-gold shadow-md" : "border-line"}`}><div className="aspect-[4/3] bg-ink/5">{submission.imageUrls[0] ? <img src={submission.imageUrls[0]} alt={submission.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ImagePlus className="size-8 text-gold" /></div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-display text-2xl">{submission.name}</h4><p className="mt-1 text-xs text-muted">{submission.origin} · {submission.weightGrams}g</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${submission.submissionStatus === "approved" ? "bg-emerald-100 text-emerald-800" : submission.submissionStatus === "rejected" ? "bg-red-100 text-red-800" : "bg-gold/15 text-gold"}`}>{t(submission.submissionStatus)}</span></div><p className="mt-4 font-bold">{formatServerMoney(submission.retailPriceSen)}</p></div><div className="flex min-h-14 flex-wrap items-center gap-2 border-t border-line px-4 py-2">{deleteTarget === submission.id ? <><span className="me-auto text-xs font-semibold text-red-700">{t("Delete this product?")}</span><Button size="sm" variant="danger" onClick={() => void deleteSubmission(submission.id)} disabled={deletingId === submission.id}>{deletingId === submission.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}{t("Delete")}</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>{t("Cancel")}</Button></> : <><Button size="sm" variant="outline" onClick={() => { setEditingSubmission(submission); setDeleteTarget(null); }}><Pencil className="size-3.5" />{t("Edit")}</Button><Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => { setDeleteTarget(submission.id); setEditingSubmission(null); }}><Trash2 className="size-3.5" />{t("Delete")}</Button></>}</div></article>)}</div> : <p className="mt-4 text-sm text-muted">{t("No product submissions yet.")}</p>}
              </div>
            </section>
            <section id="catalog" className="scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-surface"><div className="flex items-end justify-between border-b border-line p-5"><div><h2 className="font-display text-3xl">{t("Your wholesale catalog")}</h2><p className="mt-1 text-sm text-muted">{t("Prices are calculated by the server from your {tier} tier.", { tier: t(reseller.tier) })}</p></div><Percent className="size-6 text-gold" /></div><div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">{catalog.map((product) => <div key={product.id} className="bg-surface p-5"><p className="font-display text-2xl">{t(product.name)}</p><p className="mt-1 text-xs text-muted">{product.origin} · {product.weightGrams}g</p><div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-muted line-through">{formatServerMoney(product.retailPriceSen)}</p><p className="text-xl font-bold text-gold">{formatServerMoney(product.resellerPriceSen)}</p></div><span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold">-{product.discountBasisPoints / 100}%</span></div></div>)}</div></section>
            <section id="orders" className="scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-surface"><div className="border-b border-line p-5"><h2 className="font-display text-3xl">{t("Company orders")}</h2><p className="mt-1 text-sm text-muted">{t("These are Firestore reseller orders managed by Melyia—not local customer checkout receipts.")}</p></div>{orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-start text-sm"><thead className="bg-background font-mono text-[10px] uppercase tracking-[.14em] text-muted"><tr><th className="p-4">{t("Order")}</th><th className="p-4">{t("Items")}</th><th className="p-4">{t("Total")}</th><th className="p-4">{t("Status")}</th><th className="p-4">{t("Created")}</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-line"><td className="p-4 font-mono text-gold">{order.id}</td><td className="p-4">{order.items?.map((item) => `${t(item.name)} ×${item.quantity}`).join(", ") ?? "—"}</td><td className="p-4 font-bold">{formatServerMoney(order.totalSen)}</td><td className="p-4"><span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold capitalize">{t(order.status)}</span></td><td className="p-4 text-muted">{new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-BH" : "en-MY")}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><PackageCheck className="mx-auto size-8 text-gold" /><p className="mt-3 font-semibold">{t("No company orders yet.")}</p><p className="mt-1 text-sm text-muted">{t("Admin-managed reseller orders will appear here.")}</p></div>}</section>
          </>}</div>
        </main>
      </div>
    </RoleGate>
  );
}
