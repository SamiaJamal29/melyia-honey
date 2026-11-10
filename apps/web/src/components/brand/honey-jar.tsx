import { cn } from "@/lib/utils";
import type { HoneyTone } from "@/lib/products";

const honeyColors: Record<Exclude<HoneyTone, "trio">, string> = {
  amber: "#bd7610",
  gold: "#d99618",
  forest: "#8a6b16",
  pale: "#efc457",
};

function SingleJar({ tone }: { readonly tone: Exclude<HoneyTone, "trio"> }) {
  const honey = honeyColors[tone];
  return (
    <svg viewBox="0 0 180 280" className="h-full w-full" fill="none" aria-hidden="true">
      <ellipse cx="90" cy="250" rx="50" ry="9" fill="#000" fillOpacity=".14" />
      <path d="M55 33h70v21H55z" fill="#17120d" />
      <path d="M61 25h58c5 0 9 4 9 9v6H52v-6c0-5 4-9 9-9Z" fill="#2b2217" />
      <path d="M59 51h62c8 0 14 6 15 14l8 162c.7 14-10 25-24 25H60c-14 0-25-11-24-25L44 65c1-8 7-14 15-14Z" fill="#7f7769" fillOpacity=".48" stroke="#fff" strokeOpacity=".45" strokeWidth="2" />
      <path d="M38 123c32-14 72-14 104 0l2 104c.7 14-10 25-24 25H60c-14 0-25-11-24-25l2-104Z" fill={honey} />
      <path d="M51 72 45 215" stroke="#fff" strokeOpacity=".75" strokeWidth="5" strokeLinecap="round" />
      <rect x="51" y="139" width="78" height="72" rx="2" fill="#f6efe1" />
      <path d="M51 139h78v10H51z" fill="#e4c466" />
      <text x="90" y="165" textAnchor="middle" fill="#8a6414" fontSize="8" letterSpacing="2">PURE HONEY</text>
      <text x="90" y="184" textAnchor="middle" fill="#17120d" fontFamily="Georgia,serif" fontSize="18">Melyia</text>
      <text x="90" y="198" textAnchor="middle" fill="#8a6414" fontSize="7" letterSpacing="1.5">MALAYSIA</text>
    </svg>
  );
}

export function HoneyJar({ tone, className }: { readonly tone: HoneyTone; readonly className?: string }) {
  if (tone === "trio") {
    return (
      <div className={cn("flex h-full w-full items-end justify-center", className)} aria-hidden="true">
        <SingleJar tone="forest" />
        <SingleJar tone="amber" />
        <SingleJar tone="pale" />
      </div>
    );
  }
  return <div className={cn("h-full w-full", className)}><SingleJar tone={tone} /></div>;
}
