import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());
const getIdTokenMock = vi.hoisted(() => vi.fn().mockResolvedValue("customer-token"));

vi.mock("@/lib/api-client", () => ({ apiRequest: apiRequestMock }));
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
    user: { getIdToken: getIdTokenMock },
    profile: {
      id: "customer-1",
      email: "customer@example.my",
      displayName: "Customer",
      role: "customer",
      isActive: true,
    },
    isLoading: false,
    signOut: vi.fn(),
  }),
}));

import { AdminPortal } from "./admin-portal";

describe("AdminPortal role-gating regression", () => {
  afterEach(() => {
    vi.useRealTimers();
    apiRequestMock.mockReset();
    getIdTokenMock.mockClear();
  });

  it("does not load protected admin data for a signed-in customer", async () => {
    vi.useFakeTimers();
    render(<AdminPortal />);

    await act(async () => vi.runAllTimersAsync());

    expect(screen.getByRole("heading", { name: "Admin access required" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(getIdTokenMock).not.toHaveBeenCalled();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
