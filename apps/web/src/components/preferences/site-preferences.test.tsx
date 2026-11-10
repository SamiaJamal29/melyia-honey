import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PreferencesProvider, usePreferences } from "./preferences-provider";
import { SitePreferences } from "./site-preferences";

function LanguageProbe() {
  const { t } = usePreferences();
  return <span>{t("Home")}</span>;
}

describe("SitePreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "ar-BH";
    document.documentElement.dir = "rtl";
  });

  it("offers only Arabic and English and closes after selection", async () => {
    render(
      <PreferencesProvider>
        <SitePreferences showTheme={false} />
        <LanguageProbe />
      </PreferencesProvider>,
    );

    await waitFor(() => expect(screen.getByText("الرئيسية")).toBeInTheDocument());
    const trigger = screen.getByRole("button", { name: "اختر اللغة: العربية" });
    fireEvent.click(trigger);

    expect(screen.getByRole("menuitemradio", { name: "العربية" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "English" })).toBeInTheDocument();
    expect(screen.queryByText("Bahasa Melayu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitemradio", { name: "English" }));
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("button", { name: "Choose language: English" })).toHaveAttribute("aria-expanded", "false");
  });
});
