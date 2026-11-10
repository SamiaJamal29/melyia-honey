import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-5 text-center" aria-busy="true" aria-live="polite">
      <div>
        <LoaderCircle className="mx-auto size-8 animate-spin text-gold" aria-hidden="true" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">Preparing your harvest</p>
      </div>
    </main>
  );
}
