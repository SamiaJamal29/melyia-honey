"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { localeDetails, locales } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { usePreferences } from "./preferences-provider";

interface SitePreferencesProps {
  readonly className?: string;
  readonly showTheme?: boolean;
}

export function SitePreferences({ className, showTheme = true }: SitePreferencesProps) {
  const { locale, setLocale, t, theme, toggleTheme } = usePreferences();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageMenuId = useId();
  const languageRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isLanguageOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!languageRef.current?.contains(event.target as Node)) setIsLanguageOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsLanguageOpen(false);
      languageButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [isLanguageOpen]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div ref={languageRef} className="relative">
        <button
          ref={languageButtonRef}
          type="button"
          className="grid size-10 place-items-center rounded-full border border-line bg-transparent text-[11px] font-semibold tracking-wide text-foreground transition-colors hover:border-foreground/35 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`${t("Choose language")}: ${localeDetails[locale].label}`}
          aria-haspopup="menu"
          aria-expanded={isLanguageOpen}
          aria-controls={languageMenuId}
          onClick={() => setIsLanguageOpen((open) => !open)}
        >
          {localeDetails[locale].code}
        </button>
        <div id={languageMenuId} hidden={!isLanguageOpen} className="absolute end-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-line bg-surface p-2 text-foreground shadow-2xl" role="menu" aria-label={t("Choose language")}>
          {locales.map((candidate) => <button key={candidate} type="button" role="menuitemradio" aria-checked={locale === candidate} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-start text-sm font-semibold hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" onClick={() => { setLocale(candidate); setIsLanguageOpen(false); languageButtonRef.current?.focus(); }}><span lang={localeDetails[candidate].htmlLang} dir={localeDetails[candidate].direction}>{localeDetails[candidate].label}</span>{locale === candidate && <Check className="size-4 text-gold" aria-hidden="true" />}</button>)}
        </div>
      </div>
      {showTheme && <button type="button" onClick={toggleTheme} className="grid size-10 place-items-center rounded-full border border-line bg-transparent text-foreground transition-colors hover:border-foreground/35 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label={t(theme === "light" ? "Switch to dark mode" : "Switch to light mode")}>
        {theme === "light" ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
      </button>}
    </div>
  );
}
