import { z } from "zod";

import {
  orderStatuses,
  simulatedPaymentMethods,
} from "../domain/order.js";
import { productCategories } from "../domain/product.js";
import type { productSubmissionStatuses } from "../domain/product.js";
import { resellerTiers } from "../domain/reseller.js";
import {
  malaysiaAddressSchema,
  malaysiaPhoneSchema,
} from "../domain/common.js";

export interface ProductDocument {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly category: (typeof productCategories)[number];
  readonly origin: string;
  readonly weightGrams: number;
  readonly retailPriceSen: number;
  readonly imageUrls: readonly string[];
  readonly isPublished: boolean;
  readonly isArchived?: boolean;
  readonly submissionStatus: (typeof productSubmissionStatuses)[number];
  readonly submittedBy?: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: unknown;
  readonly archivedAt?: unknown;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
}

export interface UserDocument {
  readonly id: string;
  readonly email: string;
  readonly displayName?: string;
  readonly phone?: string;
  readonly role: "customer" | "admin" | "reseller";
  readonly isActive: boolean;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
}

export interface ResellerDocument {
  readonly id: string;
  readonly userId: string;
  readonly companyName: string;
  readonly registrationNumber: string;
  readonly contactName: string;
  readonly phone: string;
  readonly billingAddress: z.infer<typeof malaysiaAddressSchema>;
  readonly tier: (typeof resellerTiers)[number];
  readonly discountBasisPoints: number;
  readonly status: "active" | "suspended";
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
}

export interface InventoryDocument {
  readonly id: string;
  readonly productId: string;
  readonly availableQuantity: number;
  readonly lowStockThreshold: number;
  readonly updatedAt: unknown;
  readonly updatedBy: string;
}

export interface OrderDocument {
  readonly id: string;
  readonly userId: string;
  readonly status: (typeof orderStatuses)[number];
  readonly [key: string]: unknown;
}

export const productCreateSchema = z
  .object({
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
  })
  .strict();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const resellerProductSubmissionSchema = productCreateSchema
  .omit({ isPublished: true })
  .extend({ imageUrls: z.array(z.url()).min(1).max(4) })
  .strict();

export type ResellerProductSubmissionInput = z.infer<
  typeof resellerProductSubmissionSchema
>;

export const resellerProductUpdateSchema = resellerProductSubmissionSchema
  .omit({ slug: true })
  .partial()
  .refine((input) => Object.keys(input).length > 0, "At least one field is required.");

export type ResellerProductUpdateInput = z.infer<
  typeof resellerProductUpdateSchema
>;

export const productReviewSchema = z
  .object({ status: z.enum(["approved", "rejected"]) })
  .strict();

export type ProductReviewInput = z.infer<typeof productReviewSchema>;

export const productUpdateSchema = productCreateSchema
  .omit({ slug: true })
  .partial()
  .refine((input) => Object.keys(input).length > 0, "At least one field is required.");

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const bootstrapCustomerSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120),
    phone: malaysiaPhoneSchema.optional(),
  })
  .strict();

export type BootstrapCustomerInput = z.infer<typeof bootstrapCustomerSchema>;

export const userUpdateSchema = z
  .object({
    role: z.enum(["customer", "reseller"]).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, "At least one field is required.");

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const resellerRegistrationSchema = z
  .object({
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
  })
  .strict();

export type ResellerRegistrationInput = z.infer<
  typeof resellerRegistrationSchema
>;

export const resellerTierUpdateSchema = z
  .object({ tier: z.enum(resellerTiers) })
  .strict();

export type ResellerTierUpdateInput = z.infer<
  typeof resellerTierUpdateSchema
>;

export const inventoryUpdateSchema = z
  .object({
    adjustment: z.number().int().min(-1_000_000).max(1_000_000).optional(),
    availableQuantity: z.number().int().nonnegative().max(1_000_000).optional(),
    lowStockThreshold: z.number().int().nonnegative().max(1_000_000).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, "At least one field is required.")
  .refine(
    (input) => !(input.adjustment !== undefined && input.availableQuantity !== undefined),
    "Use either adjustment or availableQuantity, not both.",
  );

export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;

const customerOrderItemSchema = z
  .object({
    productId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/, "A valid product ID is required."),
    quantity: z.number().int().positive().max(99),
  })
  .strict();

export const customerOrderCreateSchema = z
  .object({
    checkoutId: z.uuid(),
    items: z.array(customerOrderItemSchema).min(1).max(50),
    contactName: z.string().trim().min(2).max(120),
    contactPhone: malaysiaPhoneSchema,
    shippingAddress: malaysiaAddressSchema,
    paymentMethod: z.enum(simulatedPaymentMethods),
  })
  .strict()
  .superRefine((input, context) => {
    const productIds = new Set<string>();
    input.items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Each product may appear only once per order.",
        });
      }
      productIds.add(item.productId);
    });
  });

export type CustomerOrderCreateInput = z.infer<
  typeof customerOrderCreateSchema
>;

export const orderStatusUpdateSchema = z
  .object({ status: z.enum(orderStatuses) })
  .strict();

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export interface ProductImageInput {
  readonly buffer: Buffer;
  readonly extension: "jpg" | "png" | "webp";
  readonly mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export interface ProductImageResult {
  readonly path: string;
  readonly url: string;
}

export interface CommerceService {
  listPublishedProducts(): Promise<readonly ProductDocument[]>;
  listProducts(): Promise<readonly ProductDocument[]>;
  getPublishedProductBySlug(slug: string): Promise<ProductDocument | null>;
  createProduct(input: ProductCreateInput, actorUid: string): Promise<ProductDocument>;
  updateProduct(
    id: string,
    input: ProductUpdateInput,
    actorUid: string,
  ): Promise<ProductDocument>;
  archiveProduct(id: string, actorUid: string): Promise<void>;
  submitResellerProduct(
    input: ResellerProductSubmissionInput,
    resellerUid: string,
  ): Promise<ProductDocument>;
  listResellerProducts(resellerUid: string): Promise<readonly ProductDocument[]>;
  updateResellerProduct(
    id: string,
    input: ResellerProductUpdateInput,
    resellerUid: string,
  ): Promise<ProductDocument>;
  archiveResellerProduct(id: string, resellerUid: string): Promise<void>;
  reviewResellerProduct(
    id: string,
    input: ProductReviewInput,
    actorUid: string,
  ): Promise<ProductDocument>;
  bootstrapCustomer(
    uid: string,
    email: string,
    input: BootstrapCustomerInput,
  ): Promise<UserDocument>;
  getUser(uid: string): Promise<UserDocument | null>;
  listUsers(): Promise<readonly UserDocument[]>;
  updateUser(
    uid: string,
    input: UserUpdateInput,
    actorUid: string,
  ): Promise<UserDocument | null>;
  registerReseller(
    uid: string,
    email: string,
    input: ResellerRegistrationInput,
  ): Promise<ResellerDocument>;
  getReseller(uid: string): Promise<ResellerDocument | null>;
  listResellers(): Promise<readonly ResellerDocument[]>;
  updateResellerTier(
    uid: string,
    input: ResellerTierUpdateInput,
    actorUid: string,
  ): Promise<ResellerDocument | null>;
  listInventory(): Promise<readonly InventoryDocument[]>;
  updateInventory(
    productId: string,
    input: InventoryUpdateInput,
    actorUid: string,
  ): Promise<InventoryDocument | null>;
  createCustomerOrder(
    input: CustomerOrderCreateInput,
    customerUid: string,
    customerEmail: string,
  ): Promise<OrderDocument>;
  listOrdersForUser(uid: string): Promise<readonly OrderDocument[]>;
  listOrders(): Promise<readonly OrderDocument[]>;
  getOrder(id: string): Promise<OrderDocument | null>;
  updateOrderStatus(
    id: string,
    input: OrderStatusUpdateInput,
    actorUid: string,
  ): Promise<OrderDocument | null>;
  deleteOrder(id: string, actorUid: string): Promise<void>;
  uploadProductImage(
    image: ProductImageInput,
    actorUid: string,
  ): Promise<ProductImageResult>;
}
