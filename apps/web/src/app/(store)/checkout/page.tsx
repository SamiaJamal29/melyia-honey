import type { Metadata } from "next";

import { CheckoutPanel } from "@/components/checkout/checkout-panel";

export const metadata: Metadata = { title: "Local Demo Checkout", robots: { index: false, follow: false } };

export default function Page() { return <CheckoutPanel />; }
