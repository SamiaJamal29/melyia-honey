import { describe, expect, it } from "vitest";

import { isResellerProductImageUrlAllowed } from "../src/services/firestore-commerce.js";

describe("reseller product image ownership", () => {
  const options = {
    bucketName: "demo-melyia.appspot.com",
    resellerUid: "reseller-uid",
    storageOrigin: "https://firebasestorage.googleapis.com",
  } as const;

  it("accepts tokenized images stored beneath the reseller's own path", () => {
    expect(
      isResellerProductImageUrlAllowed(
        "https://firebasestorage.googleapis.com/v0/b/demo-melyia.appspot.com/o/products%2Freseller-uid%2Fhoney.webp?alt=media&token=upload-token",
        options,
      ),
    ).toBe(true);
  });

  it("rejects another reseller's image and external tracking URLs", () => {
    expect(
      isResellerProductImageUrlAllowed(
        "https://firebasestorage.googleapis.com/v0/b/demo-melyia.appspot.com/o/products%2Fother-uid%2Fhoney.webp?alt=media&token=upload-token",
        options,
      ),
    ).toBe(false);
    expect(
      isResellerProductImageUrlAllowed(
        "https://tracker.example/honey.webp?alt=media&token=upload-token",
        options,
      ),
    ).toBe(false);
  });
});
