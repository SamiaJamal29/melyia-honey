import { beforeEach, describe, expect, it } from "vitest";

import {
  appendLocalPurchase,
  purchaseHistoryStorageKey,
  readLocalPurchaseHistory,
} from "./local-purchase-history";

describe("local purchase history", () => {
  beforeEach(() => window.localStorage.clear());

  it("isolates validated purchases by Firebase user id", () => {
    appendLocalPurchase("customer-a", {
      reference: "MLY-DEMO-1",
      purchasedAt: "2026-07-15T10:00:00.000Z",
      totalSen: 4_800,
      paymentMethod: "DuitNow QR",
      items: [{
        productId: "tualang-raw-honey",
        slug: "tualang-raw-honey",
        name: "Tualang Raw Honey",
        unitPriceSen: 4_800,
        weightGrams: 500,
        quantity: 1,
      }],
    });

    expect(readLocalPurchaseHistory("customer-a")).toHaveLength(1);
    expect(readLocalPurchaseHistory("customer-b")).toEqual([]);
    expect(window.localStorage.getItem(purchaseHistoryStorageKey("customer-a"))).toContain(
      "Tualang Raw Honey",
    );
  });

  it("rejects malformed browser data", () => {
    window.localStorage.setItem(
      purchaseHistoryStorageKey("customer-a"),
      JSON.stringify([{ reference: "tampered" }]),
    );

    expect(readLocalPurchaseHistory("customer-a")).toEqual([]);
  });
});
