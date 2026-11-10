import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import {
  inventorySchema,
  productSchema,
} from "../src/domain/product.js";
import { orderSchema } from "../src/domain/order.js";
import { customerOrderCreateSchema } from "../src/services/commerce.js";
import {
  resellerSchema,
  resellerTierDiscounts,
} from "../src/domain/reseller.js";

const timestamp = Timestamp.fromDate(new Date("2026-07-15T00:00:00.000Z"));

describe("Firestore domain schemas", () => {
  it("accepts a valid Melyia product and inventory record", () => {
    expect(
      productSchema.parse({
        name: "Tualang",
        slug: "tualang",
        description: "Dark rainforest honey from Pahang.",
        shortDescription: "Bold, malty, faintly smoky. 500g.",
        category: "raw",
        origin: "Pahang",
        weightGrams: 500,
        retailPriceSen: 4_800,
        imageUrls: [],
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    ).toMatchObject({ slug: "tualang", retailPriceSen: 4_800 });

    expect(
      inventorySchema.parse({
        productId: "tualang",
        availableQuantity: 120,
        lowStockThreshold: 12,
        updatedAt: timestamp,
        updatedBy: "seed",
      }),
    ).toMatchObject({ productId: "tualang", availableQuantity: 120 });
  });

  it("rejects invalid product slugs and negative inventory", () => {
    expect(
      productSchema.safeParse({
        name: "Bad slug",
        slug: "Bad Slug!",
        description: "Invalid product record.",
        shortDescription: "Invalid.",
        category: "raw",
        origin: "Pahang",
        weightGrams: 500,
        retailPriceSen: 4_800,
        imageUrls: [],
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }).success,
    ).toBe(false);

    expect(
      inventorySchema.safeParse({
        productId: "tualang",
        availableQuantity: -1,
        lowStockThreshold: 12,
        updatedAt: timestamp,
        updatedBy: "admin-uid",
      }).success,
    ).toBe(false);
  });

  it("enforces server-owned reseller tier discounts", () => {
    expect(
      resellerSchema.parse({
        userId: "reseller-uid",
        companyName: "Kedai Madu Sdn Bhd",
        registrationNumber: "202601234567",
        contactName: "Aina Rahman",
        phone: "+60123456789",
        billingAddress: {
          line1: "12 Jalan Ampang",
          city: "Kuala Lumpur",
          state: "Kuala Lumpur",
          postcode: "50450",
          country: "MY",
        },
        tier: "starter",
        discountBasisPoints: resellerTierDiscounts.starter,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    ).toMatchObject({ tier: "starter", discountBasisPoints: 2_500 });

    expect(
      resellerSchema.safeParse({
        userId: "reseller-uid",
        companyName: "Kedai Madu Sdn Bhd",
        registrationNumber: "202601234567",
        contactName: "Aina Rahman",
        phone: "+60123456789",
        billingAddress: {
          line1: "12 Jalan Ampang",
          city: "Kuala Lumpur",
          state: "Kuala Lumpur",
          postcode: "50450",
          country: "MY",
        },
        tier: "starter",
        discountBasisPoints: 9_000,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      }).success,
    ).toBe(false);
  });

  it("rejects order records with inconsistent line or grand totals", () => {
    const baseOrder = {
      userId: "reseller-uid",
      buyerRole: "reseller",
      resellerId: "reseller-uid",
      items: [
        {
          productId: "tualang",
          name: "Tualang",
          quantity: 2,
          unitPriceSen: 3_600,
          lineTotalSen: 7_200,
        },
      ],
      subtotalSen: 7_200,
      shippingSen: 1_000,
      totalSen: 8_200,
      currency: "MYR",
      shippingAddress: {
        line1: "12 Jalan Ampang",
        city: "Kuala Lumpur",
        state: "Kuala Lumpur",
        postcode: "50450",
        country: "MY",
      },
      paymentStatus: "paid_simulated",
      status: "placed",
      createdAt: timestamp,
      updatedAt: timestamp,
    } as const;

    expect(orderSchema.parse(baseOrder).totalSen).toBe(8_200);
    expect(
      orderSchema.safeParse({ ...baseOrder, totalSen: 9_999 }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({
        ...baseOrder,
        items: [{ ...baseOrder.items[0], lineTotalSen: 1 }],
      }).success,
    ).toBe(false);
  });

  it("accepts only server-priceable customer order input", () => {
    const input = {
      checkoutId: "4f403ed2-c8ea-4f92-a68e-2fca61c8856a",
      items: [{ productId: "tualang", quantity: 2 }],
      contactName: "Nurul Aina",
      contactPhone: "+60123456789",
      shippingAddress: {
        line1: "12 Jalan Ampang",
        city: "Kuala Lumpur",
        state: "Kuala Lumpur",
        postcode: "50450",
        country: "MY",
      },
      paymentMethod: "duitnow",
    } as const;

    expect(customerOrderCreateSchema.safeParse(input).success).toBe(true);
    expect(
      customerOrderCreateSchema.safeParse({ ...input, totalSen: 1 }).success,
    ).toBe(false);
    expect(
      customerOrderCreateSchema.safeParse({
        ...input,
        items: [...input.items, ...input.items],
      }).success,
    ).toBe(false);
  });
});
