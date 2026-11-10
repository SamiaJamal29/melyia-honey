"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    document.title = "Something went wrong | Melyia";
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-5 py-16 text-center">
      <div className="max-w-lg rounded-3xl border border-line bg-surface p-8 shadow-sm sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-700"><AlertTriangle className="size-6" aria-hidden="true" /></span>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-gold">A small snag</p>
        <h1 className="mt-3 font-display text-5xl">We could not load this page.</h1>
        <p className="mt-4 leading-7 text-muted">Your cart and account are safe. Try the page again or return to the storefront.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}><RefreshCcw className="size-4" />Try again</Button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-bold">Return home</Link>
        </div>
      </div>
    </main>
  );
}
