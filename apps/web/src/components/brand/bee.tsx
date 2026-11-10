import { cn } from "@/lib/utils";

export function Bee({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 88 56"
      className={cn("h-12 w-[4.75rem] drop-shadow-md", className)}
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="43" cy="19" rx="14" ry="10" fill="#fffdf8" fillOpacity=".9" transform="rotate(-24 43 19)" />
      <ellipse cx="58" cy="18" rx="14" ry="9" fill="#fffdf8" fillOpacity=".82" transform="rotate(25 58 18)" />
      <ellipse cx="48" cy="34" rx="23" ry="13" fill="#e0a83a" />
      <path d="M35 23.7c-3.8 5.1-5 11.4-2.9 17.2M45.2 21.3c-3.7 7-4.4 15.2-1.6 23M57 22.2c-3.1 6.6-3.4 13.7-.7 20.1" stroke="#1a1410" strokeWidth="6" />
      <ellipse cx="25.7" cy="32.7" rx="8.5" ry="8" fill="#1a1410" />
      <circle cx="22.8" cy="30.2" r="1.4" fill="#fffdf8" />
      <path d="M21 26.5c-4.8-6-8.6-5.9-11.3-4.2M25 25c-1.5-7.4 1.1-10.4 4-11.6" stroke="#1a1410" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m70 34 9 4-9 3" fill="#1a1410" />
    </svg>
  );
}
