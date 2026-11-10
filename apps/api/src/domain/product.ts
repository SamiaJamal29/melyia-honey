import { z } from "zod";

import { firestoreTimestampSchema } from "./common.js";

export const productCategories = ["raw", "gift"] as const;
export const productSubmissionStatuses = ["pending", "approved", "rejected"] as const;

export const productSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(2_000),
  shortDescription: z.string().trim().min(5).max(180),
  category: z.enum(productCategories),
  origin: z.string().trim().min(2).max(80),
  weightGrams: z.number().int().positive().max(20_000),
  retailPriceSen: z.number().int().positive().max(10_000_000),
  imageUrls: z.array(z.url()).max(8),
  isPublished: z.boolean(),
  isArchived: z.boolean().default(false),
  submissionStatus: z.enum(productSubmissionStatuses).default("approved"),
  submittedBy: z.string().min(1).max(128).optional(),
  reviewedBy: z.string().min(1).max(128).optional(),
  reviewedAt: firestoreTimestampSchema.optional(),
  archivedAt: firestoreTimestampSchema.optional(),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema,
});

export type Product = z.infer<typeof productSchema>;

export const inventorySchema = z.object({
  productId: z.string().min(1).max(128),
  availableQuantity: z.number().int().nonnegative().max(1_000_000),
  lowStockThreshold: z.number().int().nonnegative().max(1_000_000),
  updatedAt: firestoreTimestampSchema,
  updatedBy: z.string().min(1).max(128),
});

export type Inventory = z.infer<typeof inventorySchema>;
