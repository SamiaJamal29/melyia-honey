"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { localeDetails, locales, translate, type Locale, type ThemePreference } from "@/lib/i18n";

interface PreferencesContextValue {
  readonly locale: Locale;
  readonly theme: ThemePreference;
  readonly setLocale: (locale: Locale) => void;
  readonly toggleTheme: () => void;
  readonly t: (key: string, values?: Readonly<Record<string, string | number>>) => string;
}

const localeStorageKey = "melyia-locale";
const themeStorageKey = "melyia-theme";
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const applyLocale = (locale: Locale): void => {
  const details = localeDetails[locale];
  document.documentElement.lang = details.htmlLang;
  document.documentElement.dir = details.direction;
};

const applyTheme = (theme: ThemePreference): void => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

export function PreferencesProvider({ children }: { readonly children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>("ar");
  const [theme, updateTheme] = useState<ThemePreference>("light");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLocale = window.localStorage.getItem(localeStorageKey);
      const nextLocale = locales.find((candidate) => candidate === savedLocale) ?? "ar";
      const nextTheme = window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
      updateLocale(nextLocale);
      updateTheme(nextTheme);
      applyLocale(nextLocale);
      applyTheme(nextTheme);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    updateLocale(nextLocale);
    window.localStorage.setItem(localeStorageKey, nextLocale);
    applyLocale(nextLocale);
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      window.localStorage.setItem(themeStorageKey, nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    locale,
    theme,
    setLocale,
    toggleTheme,
    t: (key, values) => translate(locale, key, values),
  }), [locale, setLocale, theme, toggleTheme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider.");
  return value;
}
