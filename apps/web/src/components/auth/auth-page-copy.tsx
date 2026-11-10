"use client";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function AuthPageCopy({ variant }: { readonly variant: "login" | "signup" }) {
  const { t } = usePreferences();
  const login = variant === "login";
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t(login ? "Welcome back" : "Join Melyia")}</p>
      <h1 className="mt-2 font-display text-4xl">{t(login ? "Sign in to Melyia" : "Create an account")}</h1>
      <p className="mt-3 mb-7 text-sm leading-6 text-muted">
        {t(login ? "Use your customer, administrator, or reseller account." : "We will email you a verification link after signup.")}
      </p>
    </>
  );
}
