"use client";

import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { usePreferences } from "@/components/preferences/preferences-provider";

export function SiteFooter() {
  const { t } = usePreferences();
  return (
    <footer className="bg-dark text-cream">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr] md:py-16">
        <div>
          <BrandMark inverse />
          <p className="mt-5 max-w-sm text-sm leading-6 text-cream/65">
            {t("Pure Malaysian honey, harvested with care and kept as close to the hive as possible.")}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">{t("Explore")}</p>
          <div className="mt-4 grid gap-3 text-sm text-cream/75">
            <Link href="/shop" className="hover:text-gold">{t("Shop honey")}</Link>
            <Link href="/#story" className="hover:text-gold">{t("Our harvest")}</Link>
            <Link href="/reseller/register" className="hover:text-gold">{t("Become a reseller")}</Link>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">{t("Malaysia")}</p>
          <p className="mt-4 text-sm leading-6 text-cream/65">{t("Support available Monday–Friday, 9am–5pm MYT.")}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream/45">{t("© 2026 Melyia. Pure Malaysian honey.")}</div>
    </footer>
  );
}
