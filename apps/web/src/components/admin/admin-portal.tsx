"use client";
/* eslint-disable @next/next/no-img-element -- Firebase token URLs are rendered directly without proxying reseller uploads. */

import {
  Boxes,
  CircleCheck,
  CircleX,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandMark } from "@/components/brand/brand-mark";
import { SitePreferences } from "@/components/preferences/site-preferences";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api-client";
import { formatServerMoney } from "@/lib/utils";

import { getAdminMetrics } from "./metrics";

interface AdminOrder {
  readonly id: string;
  readonly userId: string;
  readonly status: "placed" | "packing" | "shipped" | "completed" | "cancelled";
  readonly totalSen: number;
  readonly paymentStatus: string;
  readonly contactName?: string;
  readonly contactEmail?: string;
  readonly paymentMethod?: string;
}
interface AdminInventory { readonly id: string; readonly productId: string; readonly availableQuantity: number; readonly lowStockThreshold: number }
interface AdminUser { readonly id: string; readonly email: string; readonly displayName?: string; readonly role: "customer" | "admin" | "reseller"; readonly isActive: boolean }
interface AdminReseller { readonly id: string; readonly companyName: string; readonly tier: "starter" | "silver" | "gold"; readonly discountBasisPoints: number; readonly status: string }
interface AdminProduct { readonly id: string; readonly name: string; readonly slug: string; readonly retailPriceSen: number; readonly isPublished: boolean; readonly imageUrls: readonly string[]; readonly submissionStatus: "pending" | "approved" | "rejected"; readonly submittedBy?: string }
interface DataResponse<T> { readonly data: T }

const nav = [
  { href: "#overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "#orders", label: "Orders", icon: ClipboardList },
  { href: "#inventory", label: "Inventory", icon: Boxes },
  { href: "#users", label: "Users", icon: UsersRound },
  { href: "#resellers", label: "Resellers", icon: Handshake },
  { href: "#products", label: "Products", icon: PackagePlus },
] as const;

function AdminFrame({ children }: { readonly children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { t } = usePreferences();
  return (
    <div className="min-h-screen bg-admin-bg text-admin-text transition-colors md:grid md:grid-cols-[14.5rem_1fr]">
      <aside className="bg-admin-dark text-white md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="border-b border-white/10 p-4 md:p-5"><Link href="/"><BrandMark inverse subtitle={t("Admin Console")} /></Link></div>
        <nav className="flex gap-1 overflow-x-auto p-3 md:grid md:gap-1 md:overflow-visible" aria-label={t("Admin sections")}>
          {nav.map(({ href, label, icon: Icon }, index) => <a key={href} href={href} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${index === 0 ? "bg-gold/15 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4 text-gold" />{t(label)}</a>)}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 p-4 md:block"><p className="truncate text-sm font-semibold">{profile?.displayName ?? profile?.email}</p><p className="text-xs text-white/45">{t("Administrator")}</p><button className="mt-3 text-xs text-gold hover:underline" onClick={() => void signOut()}>{t("Sign out")}</button></div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}

export function AdminPortal() {
  const { user, profile } = useAuth();
  const { t } = usePreferences();
  const [orders, setOrders] = useState<readonly AdminOrder[]>([]);
  const [inventory, setInventory] = useState<readonly AdminInventory[]>([]);
  const [users, setUsers] = useState<readonly AdminUser[]>([]);
  const [resellers, setResellers] = useState<readonly AdminReseller[]>([]);
  const [products, setProducts] = useState<readonly AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T,>(path: string, options?: RequestInit): Promise<T> => {
    if (!user || profile?.role !== "admin") throw new Error("Administrator access is required.");
    return apiRequest<T>(path, { ...options, idToken: await user.getIdToken() });
  }, [profile?.role, user]);

  const load = useCallback(async () => {
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const [orderData, inventoryData, userData, resellerData, productData] = await Promise.all([
        request<DataResponse<readonly AdminOrder[]>>("/api/orders"),
        request<DataResponse<readonly AdminInventory[]>>("/api/inventory"),
        request<DataResponse<readonly AdminUser[]>>("/api/users"),
        request<DataResponse<readonly AdminReseller[]>>("/api/resellers"),
        request<DataResponse<readonly AdminProduct[]>>("/api/products/manage"),
      ]);
      setOrders(orderData.data); setInventory(inventoryData.data); setUsers(userData.data); setResellers(resellerData.data); setProducts(productData.data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Admin data could not be loaded."); }
    finally { setLoading(false); }
  }, [profile?.role, request, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const mutation = async (path: string, options: RequestInit) => {
    setError(null);
    try { await request(path, options); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The update failed."); }
  };

  const metrics = getAdminMetrics({ orders, inventory, users });

  return (
    <RoleGate
      allow={["admin"]}
      fallback={<div className="grid min-h-screen place-items-center bg-admin-bg p-5 text-admin-text"><SitePreferences className="absolute end-5 top-5 [&>button]:border-admin-border [&>button]:text-admin-text [&>div>button]:border-admin-border [&>div>button]:text-admin-text" /><div className="max-w-md rounded-2xl border border-admin-border bg-admin-surface p-8 text-center"><ShieldAlert className="mx-auto size-8 text-gold" /><h1 className="mt-4 font-display text-4xl">{t("Admin access required")}</h1><p className="mt-3 text-admin-muted">{t("Sign in with the administrator account. Server-side role checks remain enforced.")}</p><Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-admin-dark px-6 text-sm font-bold text-white">{t("Admin sign in")}</Link></div></div>}
    >
      <AdminFrame>
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-admin-border bg-admin-surface px-5 transition-colors md:px-7"><div><h1 className="text-xl font-bold">{t("Dashboard")}</h1><p className="text-xs text-admin-muted">{t("Melyia operations")}</p></div><div className="flex items-center gap-2"><SitePreferences className="[&>button]:border-admin-border [&>button]:text-admin-text [&>div>button]:border-admin-border [&>div>button]:text-admin-text" /><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCcw className="size-4" />{t("Refresh")}</Button></div></header>
        <div className="space-y-7 p-4 md:p-7">
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
          {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-7 animate-spin text-gold" /></div> : (
            <>
              <section id="overview" className="scroll-mt-24"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
                ["Order value", formatServerMoney(metrics.grossOrderValueSen)], ["Open orders", String(metrics.openOrders)], ["Active users", String(metrics.activeUsers)], ["Low-stock SKUs", String(metrics.lowStockProducts)],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-admin-border bg-admin-surface p-5 transition-colors"><p className="text-sm text-admin-muted">{t(label)}</p><p className="mt-3 text-3xl font-bold">{value}</p></div>)}</div></section>

              <AdminSection id="orders" title={t("Orders")} subtitle={t("Customer checkout orders saved securely in Firestore.")}>
                {orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-start text-sm"><thead className="bg-admin-surface-muted text-xs uppercase text-admin-muted"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-admin-border"><td className="p-3 font-mono text-gold">{order.id}</td><td className="p-3"><strong>{order.contactName ?? order.userId}</strong>{order.contactEmail && <span className="mt-1 block text-xs text-admin-muted">{order.contactEmail}</span>}</td><td className="p-3 font-semibold">{formatServerMoney(order.totalSen)}</td><td className="p-3">{order.paymentMethod ?? order.paymentStatus}</td><td className="p-3"><OrderStatusForm order={order} save={(status) => mutation(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status }) })} /></td><td className="p-3">{order.status === "cancelled" && <Button variant="ghost" size="sm" onClick={() => void mutation(`/api/orders/${order.id}`, { method: "DELETE" })}>Delete</Button>}</td></tr>)}</tbody></table></div> : <AdminEmptyState message="No saved orders yet." />}
              </AdminSection>

              <AdminSection id="inventory" title={t("Inventory")} subtitle={t("Absolute quantities and low-stock thresholds.")}>
                {inventory.length ? <div className="grid gap-3">{inventory.map((item) => <form key={item.id} className="grid items-center gap-3 border-b border-admin-border p-4 last:border-0 sm:grid-cols-[1fr_9rem_9rem_auto]" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void mutation(`/api/inventory/${item.productId}`, { method: "PATCH", body: JSON.stringify({ availableQuantity: Number(data.get("availableQuantity")), lowStockThreshold: Number(data.get("lowStockThreshold")) }) }); }}><div><strong>{item.productId}</strong><p className="text-xs text-admin-muted">{item.availableQuantity <= item.lowStockThreshold ? "Low stock" : "Stock healthy"}</p></div><Input name="availableQuantity" type="number" min="0" defaultValue={item.availableQuantity} aria-label={`${item.productId} quantity`} /><Input name="lowStockThreshold" type="number" min="0" defaultValue={item.lowStockThreshold} aria-label={`${item.productId} threshold`} /><Button size="sm" type="submit">Save</Button></form>)}</div> : <AdminEmptyState message="No inventory records yet." />}
              </AdminSection>

              <AdminSection id="users" title={t("Users")} subtitle={t("Admin accounts cannot be created or edited here.")}>
                {users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-start text-sm"><thead className="bg-admin-surface-muted text-xs uppercase text-admin-muted"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">State</th><th className="p-3">Actions</th></tr></thead><tbody>{users.map((account) => <tr key={account.id} className="border-t border-admin-border"><td className="p-3 font-semibold">{account.displayName ?? "—"}</td><td className="p-3">{account.email}</td><td className="p-3">{account.role}</td><td className="p-3">{account.isActive ? "Active" : "Disabled"}</td><td className="p-3">{account.role !== "admin" && <Button variant="outline" size="sm" onClick={() => void mutation(`/api/users/${account.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !account.isActive }) })}>{account.isActive ? "Disable" : "Activate"}</Button>}</td></tr>)}</tbody></table></div> : <AdminEmptyState message="No user accounts yet." />}
              </AdminSection>

              <AdminSection id="resellers" title={t("Resellers")} subtitle={t("Tier discounts are assigned on the server.")}>
                {resellers.length ? <div className="grid gap-3 p-4">{resellers.map((reseller) => <form key={reseller.id} onSubmit={(event) => { event.preventDefault(); const tier = String(new FormData(event.currentTarget).get("tier")); void mutation(`/api/resellers/${reseller.id}/tier`, { method: "PATCH", body: JSON.stringify({ tier }) }); }} className="grid items-center gap-3 rounded-xl border border-admin-border p-4 sm:grid-cols-[1fr_10rem_auto]"><div><strong>{reseller.companyName}</strong><p className="text-xs text-admin-muted">{reseller.status} · {reseller.discountBasisPoints / 100}% discount</p></div><select name="tier" defaultValue={reseller.tier} className="h-11 rounded-xl border border-admin-border bg-admin-surface px-3"><option value="starter">Starter</option><option value="silver">Silver</option><option value="gold">Gold</option></select><Button size="sm" type="submit">Update tier</Button></form>)}</div> : <AdminEmptyState message="No reseller companies yet." />}
              </AdminSection>

              <AdminSection id="products" title={t("Products")} subtitle={t("Create new catalog records or archive published products.")}>
                <ProductCreateForm create={(body) => mutation("/api/products", { method: "POST", body: JSON.stringify(body) })} />
                {products.length ? <div className="border-t border-admin-border">{products.map((product) => <div key={product.id} className="flex flex-col gap-4 border-b border-admin-border p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4">{product.imageUrls[0] ? <img src={product.imageUrls[0]} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl border border-admin-border object-cover" /> : <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-admin-surface-muted"><PackagePlus className="size-5 text-admin-muted" /></div>}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong>{product.name}</strong><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${product.submissionStatus === "approved" ? "bg-emerald-100 text-emerald-800" : product.submissionStatus === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{product.submissionStatus}</span></div><p className="mt-1 truncate text-xs text-admin-muted">{product.slug} · {formatServerMoney(product.retailPriceSen)}{product.submittedBy ? ` · Reseller ${product.submittedBy}` : ""}</p></div></div><div className="flex shrink-0 flex-wrap gap-2">{product.submissionStatus !== "approved" && <Button size="sm" onClick={() => void mutation(`/api/products/${product.id}/review`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) })}><CircleCheck className="size-4" />Approve</Button>}{product.submissionStatus === "pending" && <Button variant="danger" size="sm" onClick={() => void mutation(`/api/products/${product.id}/review`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) })}><CircleX className="size-4" />Reject</Button>}{product.isPublished && <Button variant="outline" size="sm" onClick={() => void mutation(`/api/products/${product.id}`, { method: "DELETE" })}>Archive</Button>}</div></div>)}</div> : <AdminEmptyState message="No products yet." />}
              </AdminSection>
            </>
          )}
        </div>
      </AdminFrame>
    </RoleGate>
  );
}

function AdminSection({ id, title, subtitle, children }: { readonly id: string; readonly title: string; readonly subtitle: string; readonly children: ReactNode }) {
  return <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface transition-colors"><div className="border-b border-admin-border p-5"><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-sm text-admin-muted">{subtitle}</p></div>{children}</section>;
}

function AdminEmptyState({ message }: { readonly message: string }) {
  return <p className="p-8 text-center text-sm text-admin-muted">{message}</p>;
}

function OrderStatusForm({ order, save }: { readonly order: AdminOrder; readonly save: (status: AdminOrder["status"]) => Promise<void> }) {
  const next: Partial<Record<AdminOrder["status"], AdminOrder["status"][]>> = { placed: ["packing", "cancelled"], packing: ["shipped", "cancelled"], shipped: ["completed"] };
  const options = next[order.status] ?? [];
  if (!options.length) return <span className="rounded-full bg-admin-surface-muted px-3 py-1 text-xs font-semibold">{order.status}</span>;
  return <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void save(String(new FormData(event.currentTarget).get("status")) as AdminOrder["status"]); }}><select name="status" className="h-9 rounded-lg border border-admin-border bg-admin-surface px-2">{options.map((status) => <option key={status}>{status}</option>)}</select><Button size="sm" type="submit">Save</Button></form>;
}

function ProductCreateForm({ create }: { readonly create: (body: Record<string, unknown>) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); void create({ name: data.get("name"), slug: data.get("slug"), description: data.get("description"), shortDescription: data.get("shortDescription"), category: data.get("category"), origin: data.get("origin"), weightGrams: Number(data.get("weightGrams")), retailPriceSen: Math.round(Number(data.get("priceRm")) * 100), imageUrls: [], isPublished: true }); event.currentTarget.reset(); };
  return <form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"><Input name="name" placeholder="Product name" required /><Input name="slug" placeholder="product-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /><Input name="origin" placeholder="Origin" required /><Input name="weightGrams" type="number" min="1" placeholder="Weight (g)" required /><Input name="priceRm" type="number" min="1" step="0.01" placeholder="Price (RM)" required /><select name="category" className="h-12 rounded-xl border border-admin-border bg-admin-surface px-3"><option value="raw">Raw</option><option value="gift">Gift</option></select><Input name="shortDescription" placeholder="Short description" minLength={5} required /><Input name="description" placeholder="Full description" minLength={10} required /><Button type="submit" className="md:col-span-2 xl:col-span-4"><PackagePlus className="size-4" />Create product</Button></form>;
}
