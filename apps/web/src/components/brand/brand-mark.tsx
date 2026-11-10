import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  readonly className?: string;
  readonly compact?: boolean;
  readonly inverse?: boolean;
  readonly subtitle?: string;
}

const defaultSubtitle = "Pure Malaysian Honey";

export function BrandMark({
  className,
  compact = false,
  inverse = false,
  subtitle = defaultSubtitle,
}: BrandMarkProps) {
  const showPortalLabel = !compact && subtitle !== defaultSubtitle;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        showPortalLabel ? "gap-3" : undefined,
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center",
        )}
      >
        <Image
          src={inverse ? "/brand/melyia-word-light.svg" : "/brand/melyia.svg"}
          alt="Melyia, Pure Malaysian Honey"
          width={315}
          height={160}
          priority
          className={cn(
            "h-auto w-[7.6rem] sm:w-[8.8rem]",
            compact && "w-24",
            inverse && "h-9 w-auto max-w-none",
          )}
        />
      </span>
      {showPortalLabel ? (
        <span
          className={cn(
            "hidden font-mono text-[8px] font-semibold uppercase tracking-[0.24em] sm:block",
            inverse ? "text-gold" : "text-muted",
          )}
        >
          {subtitle}
        </span>
      ) : null}
    </span>
  );
}
