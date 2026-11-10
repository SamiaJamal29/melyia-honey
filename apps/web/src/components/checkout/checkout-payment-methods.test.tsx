import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const clearCart=vi.hoisted(()=>vi.fn());
vi.mock("@/components/cart/cart-provider",()=>({useCart:()=>({
  items:[{productId:"gift",slug:"gift-trio",name:"Honey Box",priceSen:12000,weightGrams:750,quantity:1}],
  subtotalSen:12000,clearCart,isHydrated:true,
})}));
vi.mock("@/components/preferences/preferences-provider",()=>({usePreferences:()=>({t:(key:string)=>key})}));
import { CheckoutPanel } from "./checkout-panel";
afterEach(()=>{vi.useRealTimers();window.sessionStorage.clear();});
it("supports local payment choices and free delivery at BHD 12.000",async()=>{
  vi.useFakeTimers();render(<CheckoutPanel />);
  expect(screen.getByRole("radio",{name:/Credit or debit card/})).toBeChecked();
  expect(screen.getByText("Free")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio",{name:/Cash on delivery/}));
  fireEvent.submit(screen.getByRole("button",{name:"Simulate payment"}).closest("form")!);
  await act(async()=>vi.advanceTimersByTimeAsync(2100));
  expect(screen.getByRole("heading",{name:"Demo payment successful"})).toBeInTheDocument();
  expect(clearCart).toHaveBeenCalledOnce();
  const receipt=JSON.parse(window.sessionStorage.getItem("melyia-last-bhd-demo-receipt")!);
  expect(receipt.totalSen).toBe(12000);expect(receipt.paymentMethod).toBe("Cash on delivery");
  expect(screen.queryByRole("link",{name:"View purchase history"})).not.toBeInTheDocument();
});
