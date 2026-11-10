import { z } from "zod";

import {
  firestoreTimestampSchema,
  malaysiaAddressSchema,
  malaysiaPhoneSchema,
} from "./common.js";

export const resellerTierDiscounts = {
  starter: 2_500,
  silver: 3_000,
  gold: 3_500,
} as const;

export const resellerTiers = ["starter", "silver", "gold"] as const;

export const resellerSchema = z
  .object({
    userId: z.string().min(1).max(128),
    companyName: z.string().trim().min(2).max(160),
    registrationNumber: z
      .string()
      .trim()
      .min(5)
      .max(30)
      .regex(/^[A-Za-z0-9-]+$/),
    contactName: z.string().trim().min(2).max(120),
    phone: malaysiaPhoneSchema,
    billingAddress: malaysiaAddressSchema,
    tier: z.enum(resellerTiers),
    discountBasisPoints: z.number().int().min(0).max(10_000),
    status: z.enum(["active", "suspended"]),
    createdAt: firestoreTimestampSchema,
    updatedAt: firestoreTimestampSchema,
  })
  .superRefine((reseller, context) => {
    if (reseller.discountBasisPoints !== resellerTierDiscounts[reseller.tier]) {
      context.addIssue({
        code: "custom",
        path: ["discountBasisPoints"],
        message: "The discount must match the server-defined reseller tier.",
      });
    }
  });

export type Reseller = z.infer<typeof resellerSchema>;
