import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-seal px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-on-seal",
        className,
      )}
      {...props}
    />
  );
}
