import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-5 py-16 text-center">
      <div className="max-w-lg">
        <SearchX className="mx-auto size-10 text-gold" aria-hidden="true" />
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-gold">404 · Lost in the orchard</p>
        <h1 className="mt-3 font-display text-6xl">This page has flown away.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-muted">The link may be old, but our current Malaysian harvests are ready for you.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="inline-flex min-h-11 items-center justify-center rounded-full bg-seal px-6 text-sm font-bold text-on-seal">Browse honey</Link>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-bold">Return home</Link>
        </div>
      </div>
    </main>
  );
}
