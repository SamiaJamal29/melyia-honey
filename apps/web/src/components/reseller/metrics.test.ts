import { describe, expect, it } from "vitest";

import { getResellerMetrics } from "./metrics";

describe("getResellerMetrics", () => {
  it("summarizes partner orders and server pricing", () => {
    expect(
      getResellerMetrics({
        discountBasisPoints: 2_500,
        orders: [
          { status: "packing", totalSen: 12_000 },
          { status: "completed", totalSen: 8_000 },
          { status: "cancelled", totalSen: 5_000 },
        ],
      }),
    ).toEqual({ activeOrders: 1, completedOrderValueSen: 8_000, discountPercent: 25 });
  });
});
