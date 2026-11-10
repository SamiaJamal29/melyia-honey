import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CartProvider, useCart } from "./cart-provider";

vi.mock("@/components/preferences/preferences-provider", () => ({
  usePreferences: () => ({ t: (key: string) => key }),
}));

const TestCart = () => {
  const { addItem, itemCount, subtotalSen } = useCart();
  return (
    <div>
      <output aria-label="Cart count">{itemCount}</output>
      <output aria-label="Subtotal">{subtotalSen}</output>
      <button
        type="button"
        onClick={() =>
          addItem({
            productId: "tualang-raw-honey",
            slug: "tualang-raw-honey",
            name: "Tualang Raw Honey",
            priceSen: 4_800,
            weightGrams: 500,
          })
        }
      >
        Add honey
      </button>
    </div>
  );
};

describe("CartProvider", () => {
  it("updates totals and persists client-side only", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestCart />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Add honey" }));
    expect(screen.getByText("Added to cart").closest('[role="status"]')).toHaveTextContent("Tualang Raw Honey");
    expect(screen.getByRole("link", { name: "View cart" })).toHaveAttribute("href", "/cart");
    await user.click(screen.getByRole("button", { name: "Add honey" }));

    expect(screen.getByLabelText("Cart count")).toHaveTextContent("2");
    expect(screen.getByLabelText("Subtotal")).toHaveTextContent("9600");
    expect(JSON.parse(window.localStorage.getItem("melyia-cart-bhd-demo-v1") ?? "[]"))
      .toMatchObject([{ productId: "tualang-raw-honey", quantity: 2 }]);
  });
});
