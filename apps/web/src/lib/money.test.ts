import { describe, expect, it } from "vitest";
import { formatMoney, formatServerMoney } from "./utils";
import { products } from "./products";

describe("BHD demo prices", () => {
  it("uses three decimal places and integer fils", () => {
    expect(formatMoney(4500).replace(/\s/g," ")).toBe("BHD 4.500");
    expect(formatMoney(1)).toContain("0.001");
    expect(formatServerMoney(4800)).toContain("48");
  });
  it("uses the chosen demo prices and preserves stable product links", () => {
    expect(products.map(p=>[p.slug,p.retailPriceSen])).toEqual([
      ["tualang",4500],["kelulut",6500],["acacia",4000],["gelam",5000],["gift-trio",12000],
    ]);
  });
});
