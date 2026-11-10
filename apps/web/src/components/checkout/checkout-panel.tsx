"use client";

import { Banknote, Check, CreditCard, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  snapshotPurchaseItems,
  type LocalPurchase,
} from "@/lib/local-purchase-history";
import { formatMoney } from "@/lib/utils";

interface LocalReceipt extends LocalPurchase {
  readonly reference: string;
  readonly totalSen: number;
  readonly email: string;
  readonly paymentMethod: string;
  readonly savedToHistory: boolean;
}

const paymentMethods = [
  { value: "card", label: "Credit or debit card", detail: "Visa and Mastercard demo", icon: CreditCard },
  { value: "cod", label: "Cash on delivery", detail: "Pay when your parcel arrives", icon: Banknote },
] as const;

export function CheckoutPanel() {
  const { items, subtotalSen, clearCart, isHydrated } = useCart();
  const { t } = usePreferences();
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<LocalReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shippingSen = subtotalSen >= 12_000 ? 0 : 1_000;
  const totalSen = subtotalSen + shippingSen;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length || isProcessing) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const paymentMethod = paymentMethods.find((method) => method.value === String(data.get("paymentMethod") ?? "card"));
    const selectedPaymentMethod = t(paymentMethod?.label ?? "Local payment demo");
    setError(null);
    setIsProcessing(true);

    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 2_000));
      const purchase: LocalPurchase = {
        reference: `MLY-BHD-DEMO-${crypto.randomUUID().slice(0,8).toUpperCase()}`,
        purchasedAt: new Date().toISOString(),
        totalSen,
        paymentMethod: selectedPaymentMethod,
        items: snapshotPurchaseItems(items),
      };
      const nextReceipt: LocalReceipt = { ...purchase, email, savedToHistory: false };
      window.sessionStorage.setItem("melyia-last-bhd-demo-receipt", JSON.stringify(nextReceipt));
      clearCart();
      setReceipt(nextReceipt);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("The order could not be saved. Please try again."));
    } finally {
      setIsProcessing(false);
    }
  };

  if (receipt) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-gold">{t("Local demo complete")}</p>
        <h1 className="mt-3 font-display text-5xl">{t("Demo payment successful")}</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted">
          {t("Your simulated payment of {total} was successful. No money was charged and no order was sent to Melyia.", { total: formatMoney(receipt.totalSen) })}
        </p>
        <div className="mx-auto mt-7 max-w-md rounded-2xl border border-line bg-surface p-5 text-start text-sm">
          <div className="flex justify-between gap-4"><span className="text-muted">{t("Order reference")}</span><strong>{receipt.reference}</strong></div>
          <div className="mt-3 flex justify-between gap-4"><span className="text-muted">{t("Email")}</span><strong className="truncate">{receipt.email}</strong></div>
          <div className="mt-3 flex justify-between gap-4"><span className="text-muted">{t("Payment method")}</span><strong>{receipt.paymentMethod}</strong></div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {receipt.savedToHistory && <Link href="/account#purchase-history" className="inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal hover:bg-gold-light hover:text-ink">{t("View purchase history")}</Link>}
          <Link href="/shop" className="inline-flex min-h-11 items-center rounded-full border border-line px-6 text-sm font-bold hover:border-gold">{t("Continue shopping")}</Link>
        </div>
      </section>
    );
  }

  if (!isHydrated) {
    return <div className="container-shell my-16 h-96 animate-pulse rounded-2xl bg-ink/5" />;
  }

  if (!items.length) {
    return (
      <section className="container-shell py-20 text-center">
        <h1 className="font-display text-5xl">{t("Your cart is empty.")}</h1>
        <p className="mt-3 text-muted">{t("Choose a harvest before opening checkout.")}</p>
        <Link href="/shop" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">{t("Shop honey")}</Link>
      </section>
    );
  }

  return (
    <div className="container-shell grid gap-8 py-10 lg:grid-cols-[1fr_24rem] lg:py-16">
      <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-5 md:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><LockKeyhole className="size-5" /></span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">{t("Demo checkout")}</p>
            <h1 className="mt-1 font-display text-4xl">{t("Delivery details")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{t("This form stays in your browser. It does not create an order or contact a payment provider.")}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2"><Label htmlFor="full-name">{t("Full name")}</Label><Input id="full-name" name="fullName" autoComplete="name" required /></div>
          <div className="grid gap-2"><Label htmlFor="email">{t("Email")}</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="grid gap-2"><Label htmlFor="phone">{t("Phone")}</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" pattern="\+973[0-9]{8}" placeholder="+97312345678" required /></div>
          <div className="grid gap-2 sm:col-span-2"><Label htmlFor="address">{t("Address")}</Label><Input id="address" name="address" autoComplete="street-address" required /></div>
          <div className="grid gap-2"><Label htmlFor="city">{t("City")}</Label><Input id="city" name="city" autoComplete="address-level2" required /></div>
          <div className="grid gap-2"><Label htmlFor="state">{t("State")}</Label><Input id="state" name="state" autoComplete="address-level1" required /></div>
          <div className="grid gap-2"><Label htmlFor="postcode">{t("Block")}</Label><Input id="postcode" name="postcode" inputMode="numeric" pattern="[0-9]{3,4}" autoComplete="postal-code" required /></div>
        </div>
        <fieldset className="mt-8">
          <legend className="font-display text-3xl">{t("Choose how to pay")}</legend>
          <p className="mt-2 text-sm leading-6 text-muted">{t("All options are simulated locally. No bank, card network, or payment provider is contacted.")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {paymentMethods.map(({ value, label, detail, icon: Icon }, index) => (
              <label key={value} className="flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-background/40 p-4 transition has-[:checked]:border-gold has-[:checked]:bg-gold/10">
                <input type="radio" name="paymentMethod" value={value} defaultChecked={index === 0} required className="mt-1 size-4 shrink-0 accent-gold" />
                <Icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <span><strong className="block text-sm">{t(label)}</strong><span className="mt-1 block text-xs leading-5 text-muted">{t(detail)}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg" className="mt-8 w-full" disabled={isProcessing}>
          {isProcessing ? <><LoaderCircle className="size-4 animate-spin" />{t("Processing simulated payment…")}</> : t("Simulate payment")}
        </Button>
      </form>
      <aside className="h-fit rounded-2xl bg-dark p-6 text-cream lg:sticky lg:top-28">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">{t("Your harvest")}</p>
        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between gap-4 text-sm">
              <div><strong>{t(item.name)}</strong><p className="mt-1 text-cream/55">{item.quantity} × {item.weightGrams}g</p></div>
              <span>{formatMoney(item.priceSen * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-white/15 pt-5 text-sm">
          <div className="flex justify-between"><span className="text-cream/60">{t("Subtotal")}</span><span>{formatMoney(subtotalSen)}</span></div>
          <div className="mt-3 flex justify-between"><span className="text-cream/60">{t("Shipping")}</span><span>{shippingSen ? formatMoney(shippingSen) : t("Free")}</span></div>
          <div className="mt-5 flex justify-between text-lg font-bold"><span>{t("Total")}</span><span>{formatMoney(totalSen)}</span></div>
        </div>
      </aside>
    </div>
  );
}
