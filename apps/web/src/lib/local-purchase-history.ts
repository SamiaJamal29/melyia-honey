import type { CartItem } from "@/components/cart/cart-provider";

export interface LocalPurchaseItem {
  readonly productId: string;
  readonly slug: string;
  readonly name: string;
  readonly unitPriceSen: number;
  readonly weightGrams: number;
  readonly quantity: number;
}

export interface LocalPurchase {
  readonly reference: string;
  readonly purchasedAt: string;
  readonly totalSen: number;
  readonly paymentMethod: string;
  readonly items: readonly LocalPurchaseItem[];
}

const storagePrefix = "melyia-purchase-history-bhd-demo-v1";
const maximumPurchases = 50;

export const purchaseHistoryStorageKey = (userId: string): string =>
  `${storagePrefix}:${encodeURIComponent(userId)}`;

const isPurchaseItem = (value: unknown): value is LocalPurchaseItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LocalPurchaseItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    Number.isInteger(item.unitPriceSen) &&
    (item.unitPriceSen ?? -1) >= 0 &&
    Number.isInteger(item.weightGrams) &&
    (item.weightGrams ?? 0) > 0 &&
    Number.isInteger(item.quantity) &&
    (item.quantity ?? 0) > 0 &&
    (item.quantity ?? 0) <= 99
  );
};

const isPurchase = (value: unknown): value is LocalPurchase => {
  if (!value || typeof value !== "object") return false;
  const purchase = value as Partial<LocalPurchase>;
  return (
    typeof purchase.reference === "string" &&
    typeof purchase.purchasedAt === "string" &&
    !Number.isNaN(Date.parse(purchase.purchasedAt)) &&
    Number.isInteger(purchase.totalSen) &&
    (purchase.totalSen ?? -1) >= 0 &&
    typeof purchase.paymentMethod === "string" &&
    Array.isArray(purchase.items) &&
    purchase.items.length > 0 &&
    purchase.items.every(isPurchaseItem)
  );
};

export const snapshotPurchaseItems = (
  items: readonly CartItem[],
): readonly LocalPurchaseItem[] =>
  items.map((item) => ({
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    unitPriceSen: item.priceSen,
    weightGrams: item.weightGrams,
    quantity: item.quantity,
  }));

export const readLocalPurchaseHistory = (
  userId: string,
): readonly LocalPurchase[] => {
  if (typeof window === "undefined" || !userId) return [];
  const key = purchaseHistoryStorageKey(userId);
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPurchase).slice(0, maximumPurchases);
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
};

export const appendLocalPurchase = (
  userId: string,
  purchase: LocalPurchase,
): void => {
  if (typeof window === "undefined" || !userId || !isPurchase(purchase)) return;
  const existing = readLocalPurchaseHistory(userId).filter(
    (entry) => entry.reference !== purchase.reference,
  );
  window.localStorage.setItem(
    purchaseHistoryStorageKey(userId),
    JSON.stringify([purchase, ...existing].slice(0, maximumPurchases)),
  );
};
