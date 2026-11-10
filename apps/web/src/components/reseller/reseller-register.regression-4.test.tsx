import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/preferences/preferences-provider", () => ({
  usePreferences: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
    theme: "light",
    toggleTheme: vi.fn(),
  }),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: { getIdToken: vi.fn().mockResolvedValue("customer-token") },
    profile: {
      id: "customer-1",
      email: "customer@example.my",
      displayName: "Customer",
      phone: "+60123456789",
      role: "customer",
      isActive: true,
    },
    isLoading: false,
    refreshProfile: vi.fn(),
  }),
}));

import { ResellerRegister } from "./reseller-register";

describe("ResellerRegister SSM pattern regression", () => {
  it("emits a browser-valid Unicode Sets pattern that accepts hyphenated IDs", () => {
    render(<ResellerRegister />);

    const input = screen.getByLabelText("SSM / ROC number");
    const pattern = input.getAttribute("pattern");

    expect(pattern).toBe("[A-Za-z0-9\\-]+");
    expect(() => new RegExp(`^(?:${pattern})$`, "v")).not.toThrow();
    expect(new RegExp(`^(?:${pattern})$`, "v").test("2026-ABC123")).toBe(true);
  });
});
