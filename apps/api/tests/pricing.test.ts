import { describe, expect, it } from "vitest";

import { calculateDiscountedPrice } from "../src/services/pricing.js";

describe("reseller pricing", () => {
  it("calculates the starter-tier Tualang price in integer sen", () => {
    expect(
      calculateDiscountedPrice({
        retailPriceSen: 4_800,
        discountBasisPoints: 2_500,
      }),
    ).toBe(3_600);
  });

  it("calculates the starter-tier Kelulut price in integer sen", () => {
    expect(
      calculateDiscountedPrice({
        retailPriceSen: 6_800,
        discountBasisPoints: 2_500,
      }),
    ).toBe(5_100);
  });

  it("rounds fractional sen to the nearest integer", () => {
    expect(
      calculateDiscountedPrice({
        retailPriceSen: 4_201,
        discountBasisPoints: 2_500,
      }),
    ).toBe(3_151);
  });

  it("rejects invalid money and discount inputs", () => {
    expect(() =>
      calculateDiscountedPrice({
        retailPriceSen: -1,
        discountBasisPoints: 2_500,
      }),
    ).toThrow(RangeError);
    expect(() =>
      calculateDiscountedPrice({
        retailPriceSen: 4_800,
        discountBasisPoints: 10_001,
      }),
    ).toThrow(RangeError);
  });
});
