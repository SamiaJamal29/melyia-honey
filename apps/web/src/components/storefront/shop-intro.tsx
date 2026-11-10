"use client";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function ShopIntro() {
  const { t } = usePreferences();

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[.22em] text-gold">{t("The harvest")}</p>
      <div className="mt-3 max-w-3xl">
        <h1 className="font-display text-5xl sm:text-6xl">{t("Malaysian honey, kept true to place.")}</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          {t("Discover Melyia originals and approved partner harvests from across Malaysia.")}
        </p>
      </div>
    </div>
  );
}
