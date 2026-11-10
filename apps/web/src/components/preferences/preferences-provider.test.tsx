import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PreferencesProvider, usePreferences } from "./preferences-provider";

function PreferenceProbe() {
  const { locale, theme, setLocale, toggleTheme, t } = usePreferences();
  return (
    <div>
      <span>{locale}</span>
      <span>{theme}</span>
      <span>{t("Home")}</span>
      <button type="button" onClick={() => setLocale("en")}>English</button>
      <button type="button" onClick={toggleTheme}>Theme</button>
    </div>
  );
}

describe("PreferencesProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "ar-BH";
    document.documentElement.dir = "rtl";
    document.documentElement.dataset.theme = "light";
  });

  it("defaults to Arabic and persists English and dark mode choices", async () => {
    render(<PreferencesProvider><PreferenceProbe /></PreferencesProvider>);
    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 1)));

    expect(screen.getByText("الرئيسية")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "ar-BH");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en-MY");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(window.localStorage.getItem("melyia-locale")).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("melyia-theme")).toBe("dark");
  });
  it("falls back to Arabic for a previously saved Malay preference", async () => {
    window.localStorage.setItem("melyia-locale", "ms");
    render(<PreferencesProvider><PreferenceProbe /></PreferencesProvider>);
    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 1)));
    expect(screen.getByText("الرئيسية")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "ar-BH");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

});
