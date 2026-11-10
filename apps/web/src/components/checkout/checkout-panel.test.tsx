import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/components/cart/cart-provider";
import { translate } from "@/lib/i18n";

vi.mock("@/components/preferences/preferences-provider", () => ({
  usePreferences: () => ({ t: (key:string, values?:Record<string,string|number>) => translate("en",key,values) }),
}));
import { CheckoutPanel } from "./checkout-panel";

describe("BHD demo checkout", () => {
  afterEach(() => {vi.useRealTimers();vi.unstubAllGlobals();window.localStorage.clear();window.sessionStorage.clear();});
  it("stores a local BHD receipt without calling an order/payment API or changing old MYR data", async () => {
    vi.useFakeTimers();const network=vi.fn();vi.stubGlobal("fetch",network);
    window.localStorage.setItem("melyia-cart-v1","original MYR cart");
    window.sessionStorage.setItem("melyia-last-local-receipt","original MYR receipt");
    window.localStorage.setItem("melyia-cart-bhd-demo-v1",JSON.stringify([{
      productId:"tualang",slug:"tualang",name:"Al Deera Honey",priceSen:4500,weightGrams:500,quantity:2,
    }]));
    render(<CartProvider><CheckoutPanel /></CartProvider>);
    await act(async()=>vi.advanceTimersByTimeAsync(1));
    expect(screen.getByText(/BHD.*10\.000/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"),{target:{value:"demo@example.test"}});
    fireEvent.submit(screen.getByRole("button",{name:"Simulate payment"}).closest("form")!);
    await act(async()=>vi.advanceTimersByTimeAsync(2100));
    expect(screen.getByRole("heading",{name:"Demo payment successful"})).toBeInTheDocument();
    expect(network).not.toHaveBeenCalled();
    const receipt=JSON.parse(window.sessionStorage.getItem("melyia-last-bhd-demo-receipt")!);
    expect(receipt.totalSen).toBe(10000);expect(receipt.savedToHistory).toBe(false);
    expect(window.localStorage.getItem("melyia-cart-bhd-demo-v1")).toBe("[]");
    expect(window.localStorage.getItem("melyia-cart-v1")).toBe("original MYR cart");
    expect(window.sessionStorage.getItem("melyia-last-local-receipt")).toBe("original MYR receipt");
  });
});
