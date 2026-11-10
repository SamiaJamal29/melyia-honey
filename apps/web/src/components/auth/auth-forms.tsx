"use client";

import { LoaderCircle, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreferences } from "@/components/preferences/preferences-provider";

import { useAuth } from "./auth-provider";

export const MIN_PASSWORD_LENGTH = 8;

export function LoginForm() {
  const { signIn } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true); setError(null);
    try {
      const profile = await signIn(String(data.get("email")), String(data.get("password")));
      router.push(profile.role === "admin" ? "/admin" : profile.role === "reseller" ? "/reseller" : "/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2"><Label htmlFor="login-email">{t("Email")}</Label><Input id="login-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="grid gap-2"><Label htmlFor="login-password">{t("Password")}</Label><Input id="login-password" name="password" type="password" autoComplete="current-password" minLength={MIN_PASSWORD_LENGTH} required /></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" size="lg" disabled={loading}>{loading && <LoaderCircle className="size-4 animate-spin" />}{t("Sign in")}</Button>
      <p className="text-center text-sm text-muted">{t("New to Melyia?")} <Link href="/signup" className="font-bold text-gold hover:underline">{t("Create an account")}</Link></p>
    </form>
  );
}

export function SignupForm() {
  const { signUp } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirmPassword"))) { setError("Passwords do not match."); return; }
    setLoading(true); setError(null);
    try {
      await signUp(String(data.get("email")), password, String(data.get("displayName")), String(data.get("phone") || "") || undefined);
      router.push(data.get("accountType") === "seller" ? "/reseller/register" : "/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign up failed.");
    } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="grid gap-5">
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">{t("Choose your account type")}</legend><div className="grid items-stretch gap-3 min-[380px]:grid-cols-2"><label className="relative flex cursor-pointer"><input className="peer sr-only" type="radio" name="accountType" value="customer" defaultChecked /><span className="flex h-full min-h-28 w-full flex-col justify-between rounded-2xl border border-line bg-background p-4 transition peer-checked:border-gold peer-checked:bg-gold/10 peer-focus-visible:ring-2 peer-focus-visible:ring-gold"><ShoppingBag className="size-5 text-gold" /><span><strong className="block text-sm">{t("Customer")}</strong><span className="text-xs leading-5 text-muted">{t("Shop and track purchases")}</span></span></span></label><label className="relative flex cursor-pointer"><input className="peer sr-only" type="radio" name="accountType" value="seller" /><span className="flex h-full min-h-28 w-full flex-col justify-between rounded-2xl border border-line bg-background p-4 transition peer-checked:border-gold peer-checked:bg-gold/10 peer-focus-visible:ring-2 peer-focus-visible:ring-gold"><Store className="size-5 text-gold" /><span><strong className="block text-sm">{t("Seller")}</strong><span className="text-xs leading-5 text-muted">{t("Register a company and sell honey")}</span></span></span></label></div></fieldset>
      <div className="grid gap-2"><Label htmlFor="signup-name">{t("Full name")}</Label><Input id="signup-name" name="displayName" autoComplete="name" minLength={2} required /></div>
      <div className="grid gap-2"><Label htmlFor="signup-email">{t("Email")}</Label><Input id="signup-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="grid gap-2"><Label htmlFor="signup-phone">{t("Phone")} <span className="font-normal text-muted">{t("(optional)")}</span></Label><Input id="signup-phone" name="phone" type="tel" placeholder="+60123456789" pattern="\+60[0-9]{8,10}" autoComplete="tel" /></div>
      <div className="grid gap-2"><Label htmlFor="signup-password">{t("Password")}</Label><Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required /><p className="text-xs text-muted">{t("Use at least 8 characters.")}</p></div>
      <div className="grid gap-2"><Label htmlFor="signup-confirm">{t("Confirm password")}</Label><Input id="signup-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required /></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" size="lg" disabled={loading}>{loading && <LoaderCircle className="size-4 animate-spin" />}{t("Create account")}</Button>
      <p className="text-center text-sm text-muted">{t("Already registered?")} <Link href="/login" className="font-bold text-gold hover:underline">{t("Sign in")}</Link></p>
    </form>
  );
}
