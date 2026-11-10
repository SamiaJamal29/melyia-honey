export const calculateDiscountedPrice = ({
  retailPriceSen,
  discountBasisPoints,
}: {
  readonly retailPriceSen: number;
  readonly discountBasisPoints: number;
}): number => {
  if (!Number.isInteger(retailPriceSen) || retailPriceSen < 0) {
    throw new RangeError("retailPriceSen must be a non-negative integer.");
  }
  if (
    !Number.isInteger(discountBasisPoints) ||
    discountBasisPoints < 0 ||
    discountBasisPoints > 10_000
  ) {
    throw new RangeError("discountBasisPoints must be between 0 and 10000.");
  }
  return Math.round(
    (retailPriceSen * (10_000 - discountBasisPoints)) / 10_000,
  );
};
