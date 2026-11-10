import { z } from "zod";

import { roleSchema } from "./auth.js";
import {
  firestoreTimestampSchema,
  malaysiaAddressSchema,
  malaysiaPhoneSchema,
} from "./common.js";

export const orderStatuses = [
  "placed",
  "packing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const simulatedPaymentMethods = ["duitnow", "fpx", "card", "cod"] as const;

export const orderItemSchema = z
  .object({
    productId: z.string().min(1).max(128),
    name: z.string().trim().min(2).max(100),
    quantity: z.number().int().positive().max(10_000),
    unitPriceSen: z.number().int().nonnegative().max(10_000_000),
    lineTotalSen: z.number().int().nonnegative().max(100_000_000),
  })
  .refine((item) => item.lineTotalSen === item.unitPriceSen * item.quantity, {
    message: "Line total must equal unit price multiplied by quantity.",
    path: ["lineTotalSen"],
  });

export const orderSchema = z
  .object({
    userId: z.string().min(1).max(128),
    buyerRole: roleSchema,
    resellerId: z.string().min(1).max(128).optional(),
    items: z.array(orderItemSchema).min(1).max(100),
    subtotalSen: z.number().int().nonnegative().max(100_000_000),
    shippingSen: z.number().int().nonnegative().max(10_000_000),
    totalSen: z.number().int().nonnegative().max(110_000_000),
    currency: z.literal("MYR"),
    shippingAddress: malaysiaAddressSchema,
    contactName: z.string().trim().min(2).max(120).optional(),
    contactEmail: z.email().optional(),
    contactPhone: malaysiaPhoneSchema.optional(),
    paymentMethod: z.enum(simulatedPaymentMethods).optional(),
    paymentStatus: z.literal("paid_simulated"),
    status: z.enum(orderStatuses),
    createdAt: firestoreTimestampSchema,
    updatedAt: firestoreTimestampSchema,
  })
  .superRefine((order, context) => {
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.lineTotalSen,
      0,
    );
    if (order.subtotalSen !== subtotal) {
      context.addIssue({
        code: "custom",
        path: ["subtotalSen"],
        message: "Subtotal must equal the sum of line totals.",
      });
    }
    if (order.totalSen !== order.subtotalSen + order.shippingSen) {
      context.addIssue({
        code: "custom",
        path: ["totalSen"],
        message: "Total must equal subtotal plus shipping.",
      });
    }
    if (order.buyerRole === "reseller" && !order.resellerId) {
      context.addIssue({
        code: "custom",
        path: ["resellerId"],
        message: "Reseller orders require a reseller ID.",
      });
    }
  });

export type Order = z.infer<typeof orderSchema>;
