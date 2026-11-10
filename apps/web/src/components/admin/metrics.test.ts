import { describe, expect, it } from "vitest";

import { getAdminMetrics } from "./metrics";

describe("getAdminMetrics", () => {
  it("derives safe operational counts from API records", () => {
    expect(
      getAdminMetrics({
        orders: [
          { id: "1", status: "packing", totalSen: 4_800 },
          { id: "2", status: "completed", totalSen: 6_800 },
        ],
        inventory: [
          { productId: "a", availableQuantity: 2, lowStockThreshold: 5 },
          { productId: "b", availableQuantity: 20, lowStockThreshold: 5 },
        ],
        users: [
          { id: "u1", role: "customer", isActive: true },
          { id: "u2", role: "reseller", isActive: true },
          { id: "u3", role: "customer", isActive: false },
        ],
      }),
    ).toEqual({
      activeUsers: 2,
      grossOrderValueSen: 11_600,
      openOrders: 1,
      lowStockProducts: 1,
    });
  });
});
