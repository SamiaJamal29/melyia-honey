import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

// Legacy *Sen keys in the isolated demo hold BHD fils; old MYR data uses separate storage keys.
export const formatMoney = (fils: number): string =>
  new Intl.NumberFormat("en-BH", { style: "currency", currency: "BHD", currencyDisplay: "code",
    minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(fils / 1000);

export const formatServerMoney = (sen: number): string =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: sen % 100 === 0 ? 0 : 2,
  }).format(sen / 100);
