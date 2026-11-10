"use client";

import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { BrandMark } from "@/components/brand/brand-mark";
import { SitePreferences } from "@/components/preferences/site-preferences";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api-client";

const states = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan Kuala Lumpur", "Wilayah Persekutuan Labuan", "Wilayah Persekutuan Putrajaya",
] as const;

const benefits = [
  ["Up to 35% wholesale margin", "Tiered pricing grows with your volume."],
  ["Free marketing kit", "Shelf talkers and product-ready brand assets."],
  ["Fast restock", "A dedicated catalog and order visibility."],
] as const;

export function ResellerRegister() {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    setSubmitting(true); setError(null);
    try {
      await apiRequest("/api/resellers/register", {
        method: "POST",
        idToken: await user.getIdToken(),
        body: JSON.stringify({
          companyName: data.get("companyName"),
          registrationNumber: data.get("registrationNumber"),
          contactName: data.get("contactName"),
          phone: data.get("phone"),
          billingAddress: {
            line1: data.get("line1"),
            ...(data.get("line2") ? { line2: data.get("line2") } : {}),
            city: data.get("city"),
            state: data.get("state"),
            postcode: data.get("postcode"),
            country: "MY",
          },
        }),
      });
      await refreshProfile();
      router.push("/reseller");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("Registration could not be completed.")); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-2">
      <SitePreferences className="absolute end-5 top-5 z-30 rounded-full border border-line bg-surface/95 p-1 shadow-lg backdrop-blur" />
      <section className="flex min-h-[30rem] flex-col bg-portal-sidebar p-7 text-portal-sidebar-foreground transition-colors sm:p-12 lg:min-h-screen lg:p-16">
        <Link href="/"><BrandMark inverse subtitle={t("Reseller Program")} /></Link>
        <div className="my-auto max-w-xl py-14 lg:py-20">
          <h1 className="font-display text-5xl leading-tight sm:text-6xl">{t("Sell the honey Malaysia trusts.")}</h1>
          <p className="mt-5 max-w-lg leading-7 text-portal-sidebar-muted">{t("Join retailers, cafés, grocers, and wellness stores stocking Melyia. Registration activates your starter tier immediately.")}</p>
          <div className="mt-9 grid gap-5">{benefits.map(([title, text]) => <div key={title} className="flex gap-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold text-ink"><Check className="size-4" /></span><div><strong>{t(title)}</strong><p className="mt-1 text-sm text-portal-sidebar-muted">{t(text)}</p></div></div>)}</div>
        </div>
        <p className="text-sm text-portal-sidebar-muted">{t("Already a partner?")} <Link href="/login" className="font-semibold text-gold">{t("Sign in to your dashboard →")}</Link></p>
      </section>
      <section className="flex items-center justify-center p-5 py-12 sm:p-12">
        <div className="w-full max-w-xl">
          {isLoading ? <div className="h-96 animate-pulse rounded-2xl bg-ink/5" /> : !profile || !user ? (
            <div className="rounded-2xl border border-line bg-surface p-8"><p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t("Step one")}</p><h2 className="mt-3 font-display text-4xl">{t("Create your Melyia account first.")}</h2><p className="mt-4 leading-7 text-muted">{t("Your verified Firebase account securely owns the company profile.")}</p><Link href="/signup" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Create account")} <ArrowRight className="size-4" /></Link></div>
          ) : profile.role === "admin" ? (
            <div className="rounded-2xl border border-line bg-surface p-8"><h2 className="font-display text-4xl">{t("Use a customer account.")}</h2><p className="mt-4 text-muted">{t("Administrator accounts cannot join the reseller program.")}</p></div>
          ) : profile.role === "reseller" ? (
            <div className="rounded-2xl border border-line bg-surface p-8"><p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t("Company active")}</p><h2 className="mt-3 font-display text-4xl">{t("Your reseller account is ready.")}</h2><Link href="/reseller" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Open dashboard")} <ArrowRight className="size-4" /></Link></div>
          ) : (
            <form onSubmit={submit} className="grid gap-5">
              <div className="grid grid-cols-3 gap-2"><span className="h-1 rounded-full bg-gold" /><span className="h-1 rounded-full bg-line" /><span className="h-1 rounded-full bg-line" /></div>
              <div><p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t("Company · contact · done")}</p><h2 className="mt-3 font-display text-4xl">{t("Company details")}</h2><p className="mt-2 text-muted">{t("Your starter tier activates immediately after submission.")}</p></div>
              <div className="grid gap-2"><Label htmlFor="company-name">{t("Registered company name")}</Label><Input id="company-name" name="companyName" minLength={2} required /></div>
              <div className="grid gap-5 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="registration-number">{t("SSM / ROC number")}</Label><Input id="registration-number" name="registrationNumber" pattern={"[A-Za-z0-9\\-]+"} minLength={5} required /></div><div className="grid gap-2"><Label htmlFor="contact-name">{t("Contact name")}</Label><Input id="contact-name" name="contactName" defaultValue={profile.displayName} required /></div></div>
              <div className="grid gap-2"><Label htmlFor="reseller-phone">{t("Phone")}</Label><Input id="reseller-phone" name="phone" type="tel" pattern="\+60[0-9]{8,10}" placeholder="+60123456789" defaultValue={profile.phone} required /></div>
              <div className="grid gap-2"><Label htmlFor="line1">{t("Billing address")}</Label><Input id="line1" name="line1" required /><Input name="line2" aria-label={t("Address line 2")} placeholder={t("Unit or floor (optional)")} /></div>
              <div className="grid gap-5 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="reseller-city">{t("City")}</Label><Input id="reseller-city" name="city" required /></div><div className="grid gap-2"><Label htmlFor="reseller-state">{t("State")}</Label><select id="reseller-state" name="state" className="h-12 rounded-xl border border-line bg-surface px-3" required>{states.map((state) => <option key={state}>{state}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="reseller-postcode">{t("Postcode")}</Label><Input id="reseller-postcode" name="postcode" pattern="[0-9]{5}" inputMode="numeric" required /></div></div>
              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" size="lg" disabled={submitting}>{submitting ? <><LoaderCircle className="size-4 animate-spin" />{t("Activating company…")}</> : <>{t("Activate reseller account")} <ArrowRight className="size-4" /></>}</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
