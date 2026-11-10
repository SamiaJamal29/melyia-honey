import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const clearCartMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const getIdTokenMock = vi.hoisted(() => vi.fn(() => Promise.resolve("customer-token")));

vi.mock("@/components/cart/cart-provider", () => ({
  useCart: () => ({
    items: [{
      productId: "tualang-raw-honey",
      slug: "tualang-raw-honey",
      name: "Tualang Raw Honey",
      priceSen: 4_800,
      weightGrams: 500,
      quantity: 1,
    }],
    subtotalSen: 4_800,
    clearCart: clearCartMock,
    isHydrated: true,
  }),
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: { uid: "customer-uid", email: "customer@example.my", getIdToken: getIdTokenMock },
    profile: { role: "customer", email: "customer@example.my" },
  }),
}));
vi.mock("@/components/preferences/preferences-provider", () => ({
  usePreferences: () => ({ t: (key: string) => key }),
}));
vi.mock("@/lib/api-client", () => ({ apiRequest: apiRequestMock }));

import { CheckoutPanel } from "./checkout-panel";

describe("CheckoutPanel success-position regression", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("returns the viewport to the top after the order is saved", async () => {
    vi.useFakeTimers();
    apiRequestMock.mockResolvedValue({
      data: {
        id: "4f403ed2-c8ea-4f92-a68e-2fca61c8856a",
        totalSen: 5_800,
      },
    });
    const scrollToSpy = vi.spyOn(window, "scrollTo");
    render(<CheckoutPanel />);

    fireEvent.submit(screen.getByRole("button", { name: "Simulate payment" }).closest("form")!);
    await act(async () => vi.advanceTimersByTimeAsync(2_000));

    expect(screen.getByRole("heading", { name: "Demo payment successful" })).toBeInTheDocument();
    expect(clearCartMock).toHaveBeenCalledOnce();
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
