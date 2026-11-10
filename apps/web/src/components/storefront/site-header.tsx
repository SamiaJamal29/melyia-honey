"use client";

import { Menu, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { BrandMark } from "@/components/brand/brand-mark";
import { useCart } from "@/components/cart/cart-provider";
import { SitePreferences } from "@/components/preferences/site-preferences";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#story", label: "Story" },
] as const;

export function SiteHeader() {
  const { itemCount } = useCart();
  const { profile } = useAuth();
  const { t, theme } = usePreferences();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur">
      <div className="container-shell flex h-[4.5rem] items-center justify-between gap-2 sm:gap-4">
        <Link href="/" aria-label={t("Melyia home")} className="shrink-0"><BrandMark compact inverse={theme === "dark"} /></Link>
        <nav aria-label={t("Main navigation")} className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-muted transition hover:text-foreground">
                {t(item.label)}
              </Link>
            ))}
            {profile?.role === "admin" && <Link href="/admin" className="text-sm font-medium text-gold">{t("Admin")}</Link>}
            {profile?.role === "reseller" && <Link href="/reseller" className="text-sm font-medium text-gold">{t("Reseller")}</Link>}
        </nav>
        <div className="flex items-center gap-2">
            <SitePreferences className="hidden min-[390px]:flex" />
            <Link
              href={profile ? "/account" : "/login"}
              aria-label={t(profile ? "Your account" : "Sign in")}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hidden sm:inline-flex")}
            >
              <UserRound className="size-5" aria-hidden="true" />
            </Link>
            <Link href="/cart" className={cn(buttonVariants({ size: "default" }), "relative px-4")}>
              <ShoppingBag className="size-4" aria-hidden="true" />
              <span className="hidden min-[420px]:inline">{t("Cart")}</span>
              <span className="inline-grid size-5 place-items-center rounded-full bg-gold text-[11px] text-ink" aria-label={t("{count} items", { count: itemCount })}>
                {itemCount}
              </span>
            </Link>
            <details className="relative md:hidden">
              <summary className={cn(buttonVariants({ variant: "outline", size: "icon" }), "cursor-pointer list-none")} aria-label={t("Open navigation")}>
                <Menu className="size-5" aria-hidden="true" />
              </summary>
              <nav className="absolute end-0 top-14 w-56 rounded-2xl border border-line bg-surface p-2 shadow-xl" aria-label={t("Mobile navigation")}>
                {[...navigation, { href: profile ? "/account" : "/login", label: profile ? "Account" : "Sign in" }].map((item) => (
                  <Link key={item.href} href={item.href} className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-background">
                    {t(item.label)}
                  </Link>
                ))}
                <SitePreferences className="mt-2 border-t border-line px-2 pt-3 min-[390px]:hidden" />
              </nav>
            </details>
        </div>
      </div>
    </header>
  );
}
