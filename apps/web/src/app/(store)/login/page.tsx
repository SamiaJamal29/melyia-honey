import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/auth-forms";
import { AuthPageCopy } from "@/components/auth/auth-page-copy";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <div className="container-shell py-14 md:py-20"><div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 md:p-8"><AuthPageCopy variant="login" /><LoginForm /></div></div>;
}
