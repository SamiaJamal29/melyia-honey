import { randomUUID } from "node:crypto";

import {
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { z } from "zod";

import { getFirebaseServices } from "../config/firebase-admin.js";
import { roleSchema } from "../domain/auth.js";
import { malaysiaPhoneSchema } from "../domain/common.js";
import { orderSchema, type Order } from "../domain/order.js";
import { inventorySchema, productSchema } from "../domain/product.js";
import {
  resellerSchema,
  resellerTierDiscounts,
} from "../domain/reseller.js";
import { AppError } from "../middleware/errors.js";
import type {
  BootstrapCustomerInput,
  CommerceService,
  CustomerOrderCreateInput,
  InventoryDocument,
  InventoryUpdateInput,
  OrderDocument,
  OrderStatusUpdateInput,
  ProductCreateInput,
  ProductDocument,
  ProductImageInput,
  ProductImageResult,
  ProductReviewInput,
  ProductUpdateInput,
  ResellerDocument,
  ResellerRegistrationInput,
  ResellerProductSubmissionInput,
  ResellerProductUpdateInput,
  ResellerTierUpdateInput,
  UserDocument,
  UserUpdateInput,
} from "./commerce.js";

const userStorageSchema = z.object({
  email: z.email(),
  displayName: z.string().trim().min(2).max(120).optional(),
  phone: malaysiaPhoneSchema.optional(),
  role: roleSchema,
  isActive: z.boolean(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

const asIsoString = (timestamp: Timestamp): string =>
  timestamp.toDate().toISOString();

const serializeProduct = (id: string, raw: unknown): ProductDocument => {
  const product = productSchema.parse(raw);
  const {
    createdAt,
    archivedAt,
    reviewedAt,
    reviewedBy,
    submittedBy,
    updatedAt,
    ...fields
  } = product;
  return {
    id,
    ...fields,
    ...(submittedBy ? { submittedBy } : {}),
    ...(reviewedBy ? { reviewedBy } : {}),
    ...(reviewedAt ? { reviewedAt: asIsoString(reviewedAt) } : {}),
    ...(archivedAt ? { archivedAt: asIsoString(archivedAt) } : {}),
    createdAt: asIsoString(createdAt),
    updatedAt: asIsoString(updatedAt),
  };
};

const serializeUser = (id: string, raw: unknown): UserDocument => {
  const user = userStorageSchema.parse(raw);
  return {
    id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    ...(user.displayName ? { displayName: user.displayName } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    createdAt: asIsoString(user.createdAt),
    updatedAt: asIsoString(user.updatedAt),
  };
};

const serializeReseller = (id: string, raw: unknown): ResellerDocument => {
  const reseller = resellerSchema.parse(raw);
  return {
    id,
    ...reseller,
    createdAt: asIsoString(reseller.createdAt),
    updatedAt: asIsoString(reseller.updatedAt),
  };
};

const serializeInventory = (id: string, raw: unknown): InventoryDocument => {
  const inventory = inventorySchema.parse(raw);
  return {
    id,
    ...inventory,
    updatedAt: asIsoString(inventory.updatedAt),
  };
};

const serializeOrder = (id: string, raw: unknown): OrderDocument => {
  const order = orderSchema.parse(raw);
  return {
    id,
    ...order,
    createdAt: asIsoString(order.createdAt),
    updatedAt: asIsoString(order.updatedAt),
  };
};

const mapDocuments = <T>(
  documents: readonly QueryDocumentSnapshot<DocumentData>[],
  serializer: (id: string, raw: unknown) => T,
): readonly T[] => documents.map((document) => serializer(document.id, document.data()));

const allowedStatusTransitions: Readonly<
  Record<Order["status"], readonly Order["status"][]>
> = {
  placed: ["packing", "cancelled"],
  packing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

interface ResellerProductImageUrlOptions {
  readonly bucketName: string;
  readonly resellerUid: string;
  readonly storageOrigin: string;
}

export const isResellerProductImageUrlAllowed = (
  imageUrl: string,
  { bucketName, resellerUid, storageOrigin }: ResellerProductImageUrlOptions,
): boolean => {
  try {
    const url = new URL(imageUrl);
    const decodedPath = decodeURIComponent(url.pathname);
    const expectedPrefix = `/v0/b/${bucketName}/o/products/${resellerUid}/`;
    return (
      url.origin === storageOrigin &&
      decodedPath.startsWith(expectedPrefix) &&
      url.searchParams.get("alt") === "media" &&
      Boolean(url.searchParams.get("token"))
    );
  } catch {
    return false;
  }
};

const assertResellerImageOwnership = (
  imageUrls: readonly string[],
  resellerUid: string,
): void => {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    throw new AppError(503, "STORAGE_NOT_CONFIGURED", "Image storage is not configured.");
  }
  const storageOrigin = process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
    : "https://firebasestorage.googleapis.com";
  if (
    !imageUrls.every((imageUrl) =>
      isResellerProductImageUrlAllowed(imageUrl, {
        bucketName,
        resellerUid,
        storageOrigin,
      }),
    )
  ) {
    throw new AppError(
      400,
      "IMAGE_URL_INVALID",
      "Use only product images uploaded by this reseller account.",
    );
  }
};

export class FirestoreCommerceService implements CommerceService {
  public async listPublishedProducts(): Promise<readonly ProductDocument[]> {
    const snapshot = await getFirebaseServices()
      .db.collection("products")
      .where("isPublished", "==", true)
      .limit(100)
      .get();
    return mapDocuments(snapshot.docs, serializeProduct).filter(
      (product) => !product.isArchived,
    );
  }

  public async listProducts(): Promise<readonly ProductDocument[]> {
    const snapshot = await getFirebaseServices().db.collection("products").limit(100).get();
    return mapDocuments(snapshot.docs, serializeProduct);
  }

  public async getPublishedProductBySlug(
    slug: string,
  ): Promise<ProductDocument | null> {
    const snapshot = await getFirebaseServices().db.collection("products").doc(slug).get();
    if (!snapshot.exists) return null;
    const product = serializeProduct(snapshot.id, snapshot.data());
    return product.isPublished && !product.isArchived ? product : null;
  }

  public async createProduct(
    input: ProductCreateInput,
    _actorUid: string,
  ): Promise<ProductDocument> {
    const { db } = getFirebaseServices();
    const reference = db.collection("products").doc(input.slug);
    const product = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        throw new AppError(409, "PRODUCT_EXISTS", "A product with this slug exists.");
      }
      const timestamp = Timestamp.now();
      const created = productSchema.parse({
        ...input,
        submissionStatus: "approved",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.create(reference, created);
      return created;
    });
    return serializeProduct(reference.id, product);
  }

  public async updateProduct(
    id: string,
    input: ProductUpdateInput,
    _actorUid: string,
  ): Promise<ProductDocument> {
    const { db } = getFirebaseServices();
    const reference = db.collection("products").doc(id);
    const product = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (!existing.exists) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      const current = productSchema.parse(existing.data());
      const updated = productSchema.parse({
        ...current,
        ...input,
        updatedAt: Timestamp.now(),
      });
      transaction.set(reference, updated);
      return updated;
    });
    return serializeProduct(reference.id, product);
  }

  public async archiveProduct(id: string, _actorUid: string): Promise<void> {
    const { db } = getFirebaseServices();
    const reference = db.collection("products").doc(id);
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (!existing.exists) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      transaction.update(reference, {
        isPublished: false,
        isArchived: true,
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
  }

  public async submitResellerProduct(
    input: ResellerProductSubmissionInput,
    resellerUid: string,
  ): Promise<ProductDocument> {
    assertResellerImageOwnership(input.imageUrls, resellerUid);

    const { db } = getFirebaseServices();
    const resellerReference = db.collection("resellers").doc(resellerUid);
    const productReference = db.collection("products").doc(input.slug);
    const product = await db.runTransaction(async (transaction) => {
      const [resellerSnapshot, productSnapshot] = await transaction.getAll(
        resellerReference,
        productReference,
      );
      if (!resellerSnapshot || !productSnapshot) {
        throw new Error("Firestore transaction returned incomplete snapshots.");
      }
      if (!resellerSnapshot.exists) {
        throw new AppError(403, "RESELLER_NOT_FOUND", "A reseller profile is required.");
      }
      const reseller = resellerSchema.parse(resellerSnapshot.data());
      if (reseller.status !== "active") {
        throw new AppError(403, "RESELLER_INACTIVE", "The reseller account is not active.");
      }
      if (productSnapshot.exists) {
        throw new AppError(409, "PRODUCT_EXISTS", "A product with this slug exists.");
      }

      const timestamp = Timestamp.now();
      const created = productSchema.parse({
        ...input,
        isPublished: false,
        submissionStatus: "pending",
        submittedBy: resellerUid,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.create(productReference, created);
      return created;
    });
    return serializeProduct(productReference.id, product);
  }

  public async listResellerProducts(
    resellerUid: string,
  ): Promise<readonly ProductDocument[]> {
    const snapshot = await getFirebaseServices()
      .db.collection("products")
      .where("submittedBy", "==", resellerUid)
      .limit(100)
      .get();
    return mapDocuments(snapshot.docs, serializeProduct).filter(
      (product) => !product.isArchived,
    );
  }

  public async updateResellerProduct(
    id: string,
    input: ResellerProductUpdateInput,
    resellerUid: string,
  ): Promise<ProductDocument> {
    if (input.imageUrls) assertResellerImageOwnership(input.imageUrls, resellerUid);

    const { db } = getFirebaseServices();
    const productReference = db.collection("products").doc(id);
    const resellerReference = db.collection("resellers").doc(resellerUid);
    const product = await db.runTransaction(async (transaction) => {
      const [productSnapshot, resellerSnapshot] = await transaction.getAll(
        productReference,
        resellerReference,
      );
      if (!productSnapshot || !resellerSnapshot) {
        throw new Error("Firestore transaction returned incomplete snapshots.");
      }
      if (!productSnapshot.exists) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      const current = productSchema.parse(productSnapshot.data());
      if (current.submittedBy !== resellerUid || current.isArchived) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      if (
        !resellerSnapshot.exists ||
        resellerSchema.parse(resellerSnapshot.data()).status !== "active"
      ) {
        throw new AppError(403, "RESELLER_INACTIVE", "The reseller account is not active.");
      }

      const updated = productSchema.parse({
        ...current,
        ...input,
        isPublished: false,
        submissionStatus: "pending",
        updatedAt: Timestamp.now(),
      });
      transaction.set(productReference, updated);
      return updated;
    });
    return serializeProduct(productReference.id, product);
  }

  public async archiveResellerProduct(
    id: string,
    resellerUid: string,
  ): Promise<void> {
    const { db } = getFirebaseServices();
    const reference = db.collection("products").doc(id);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      const product = productSchema.parse(snapshot.data());
      if (product.submittedBy !== resellerUid || product.isArchived) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      const timestamp = Timestamp.now();
      transaction.update(reference, {
        isPublished: false,
        isArchived: true,
        archivedAt: timestamp,
        updatedAt: timestamp,
      });
    });
  }

  public async reviewResellerProduct(
    id: string,
    input: ProductReviewInput,
    actorUid: string,
  ): Promise<ProductDocument> {
    const { db } = getFirebaseServices();
    const reference = db.collection("products").doc(id);
    const inventoryReference = db.collection("inventory").doc(id);
    const product = await db.runTransaction(async (transaction) => {
      const [snapshot, inventorySnapshot] = await transaction.getAll(
        reference,
        inventoryReference,
      );
      if (!snapshot || !inventorySnapshot) {
        throw new Error("Firestore transaction returned incomplete snapshots.");
      }
      if (!snapshot.exists) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      const current = productSchema.parse(snapshot.data());
      if (current.isArchived) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      if (!current.submittedBy) {
        throw new AppError(
          409,
          "REVIEW_NOT_REQUIRED",
          "This product was not submitted by a reseller.",
        );
      }
      const timestamp = Timestamp.now();
      const updated = productSchema.parse({
        ...current,
        submissionStatus: input.status,
        isPublished: input.status === "approved",
        reviewedBy: actorUid,
        reviewedAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.set(reference, updated);
      if (input.status === "approved" && !inventorySnapshot.exists) {
        transaction.create(
          inventoryReference,
          inventorySchema.parse({
            productId: id,
            availableQuantity: 0,
            lowStockThreshold: 5,
            updatedAt: timestamp,
            updatedBy: actorUid,
          }),
        );
      }
      return updated;
    });
    return serializeProduct(reference.id, product);
  }

  public async bootstrapCustomer(
    uid: string,
    email: string,
    input: BootstrapCustomerInput,
  ): Promise<UserDocument> {
    const { db } = getFirebaseServices();
    const reference = db.collection("users").doc(uid);
    const user = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) return userStorageSchema.parse(existing.data());

      const timestamp = Timestamp.now();
      const created = userStorageSchema.parse({
        email: email.toLowerCase(),
        ...input,
        role: "customer",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.create(reference, created);
      return created;
    });
    return serializeUser(reference.id, user);
  }

  public async getUser(uid: string): Promise<UserDocument | null> {
    const snapshot = await getFirebaseServices().db.collection("users").doc(uid).get();
    return snapshot.exists ? serializeUser(snapshot.id, snapshot.data()) : null;
  }

  public async listUsers(): Promise<readonly UserDocument[]> {
    const snapshot = await getFirebaseServices().db.collection("users").limit(100).get();
    return mapDocuments(snapshot.docs, serializeUser);
  }

  public async updateUser(
    uid: string,
    input: UserUpdateInput,
    _actorUid: string,
  ): Promise<UserDocument | null> {
    const { db } = getFirebaseServices();
    const userReference = db.collection("users").doc(uid);
    const resellerReference = db.collection("resellers").doc(uid);
    return db.runTransaction(async (transaction) => {
      const [userSnapshot, resellerSnapshot] = await transaction.getAll(
        userReference,
        resellerReference,
      );
      if (!userSnapshot || !resellerSnapshot) {
        throw new Error("Firestore transaction returned incomplete snapshots.");
      }
      if (!userSnapshot.exists) return null;
      const current = userStorageSchema.parse(userSnapshot.data());
      if (current.role === "admin") {
        throw new AppError(
          403,
          "ADMIN_IMMUTABLE",
          "Administrator accounts require the trusted bootstrap workflow.",
        );
      }
      if (input.role === "reseller" && !resellerSnapshot.exists) {
        throw new AppError(
          409,
          "RESELLER_PROFILE_REQUIRED",
          "Register the company before assigning the reseller role.",
        );
      }

      const updated = userStorageSchema.parse({
        ...current,
        ...input,
        updatedAt: Timestamp.now(),
      });
      transaction.set(userReference, updated);
      if (input.role === "customer" && resellerSnapshot.exists) {
        transaction.update(resellerReference, {
          status: "suspended",
          updatedAt: Timestamp.now(),
        });
      }
      return serializeUser(userReference.id, updated);
    });
  }

  public async registerReseller(
    uid: string,
    email: string,
    input: ResellerRegistrationInput,
  ): Promise<ResellerDocument> {
    const { db } = getFirebaseServices();
    const userReference = db.collection("users").doc(uid);
    const resellerReference = db.collection("resellers").doc(uid);
    const reseller = await db.runTransaction(async (transaction) => {
      const [userSnapshot, resellerSnapshot] = await transaction.getAll(
        userReference,
        resellerReference,
      );
      if (!userSnapshot || !resellerSnapshot) {
        throw new Error("Firestore transaction returned incomplete snapshots.");
      }
      if (!userSnapshot.exists) {
        throw new AppError(409, "PROFILE_REQUIRED", "Create a user profile first.");
      }
      const user = userStorageSchema.parse(userSnapshot.data());
      if (user.role === "admin") {
        throw new AppError(403, "FORBIDDEN", "Administrators cannot register here.");
      }
      if (user.email.toLowerCase() !== email.toLowerCase()) {
        throw new AppError(403, "IDENTITY_MISMATCH", "The account identity is invalid.");
      }
      if (resellerSnapshot.exists) {
        return resellerSchema.parse(resellerSnapshot.data());
      }

      const timestamp = Timestamp.now();
      const created = resellerSchema.parse({
        userId: uid,
        ...input,
        tier: "starter",
        discountBasisPoints: resellerTierDiscounts.starter,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.create(resellerReference, created);
      transaction.update(userReference, {
        role: "reseller",
        updatedAt: timestamp,
      });
      return created;
    });
    return serializeReseller(resellerReference.id, reseller);
  }

  public async getReseller(uid: string): Promise<ResellerDocument | null> {
    const snapshot = await getFirebaseServices().db.collection("resellers").doc(uid).get();
    return snapshot.exists ? serializeReseller(snapshot.id, snapshot.data()) : null;
  }

  public async listResellers(): Promise<readonly ResellerDocument[]> {
    const snapshot = await getFirebaseServices().db.collection("resellers").limit(100).get();
    return mapDocuments(snapshot.docs, serializeReseller);
  }

  public async updateResellerTier(
    uid: string,
    input: ResellerTierUpdateInput,
    _actorUid: string,
  ): Promise<ResellerDocument | null> {
    const { db } = getFirebaseServices();
    const reference = db.collection("resellers").doc(uid);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return null;
      const current = resellerSchema.parse(snapshot.data());
      const updated = resellerSchema.parse({
        ...current,
        tier: input.tier,
        discountBasisPoints: resellerTierDiscounts[input.tier],
        updatedAt: Timestamp.now(),
      });
      transaction.set(reference, updated);
      return serializeReseller(reference.id, updated);
    });
  }

  public async listInventory(): Promise<readonly InventoryDocument[]> {
    const snapshot = await getFirebaseServices().db.collection("inventory").limit(100).get();
    return mapDocuments(snapshot.docs, serializeInventory);
  }

  public async updateInventory(
    productId: string,
    input: InventoryUpdateInput,
    actorUid: string,
  ): Promise<InventoryDocument | null> {
    const { db } = getFirebaseServices();
    const productReference = db.collection("products").doc(productId);
    const inventoryReference = db.collection("inventory").doc(productId);
    return db.runTransaction(async (transaction) => {
      const [productSnapshot, inventorySnapshot] = await transaction.getAll(
        productReference,
        inventoryReference,
      );
      if (!productSnapshot || !inventorySnapshot) {
        throw new Error("Firestore transaction returned incomplete snapshots.");
      }
      if (!productSnapshot.exists) return null;
      const current = inventorySnapshot.exists
        ? inventorySchema.parse(inventorySnapshot.data())
        : undefined;
      const baseQuantity = input.availableQuantity ?? current?.availableQuantity ?? 0;
      const availableQuantity = baseQuantity + (input.adjustment ?? 0);
      if (availableQuantity < 0) {
        throw new AppError(
          409,
          "INSUFFICIENT_INVENTORY",
          "Inventory cannot be reduced below zero.",
        );
      }
      const updated = inventorySchema.parse({
        productId,
        availableQuantity,
        lowStockThreshold: input.lowStockThreshold ?? current?.lowStockThreshold ?? 5,
        updatedAt: Timestamp.now(),
        updatedBy: actorUid,
      });
      transaction.set(inventoryReference, updated);
      return serializeInventory(inventoryReference.id, updated);
    });
  }

  public async listOrdersForUser(uid: string): Promise<readonly OrderDocument[]> {
    const snapshot = await getFirebaseServices()
      .db.collection("orders")
      .where("userId", "==", uid)
      .limit(100)
      .get();
    return mapDocuments(snapshot.docs, serializeOrder);
  }

  public async createCustomerOrder(
    input: CustomerOrderCreateInput,
    customerUid: string,
    customerEmail: string,
  ): Promise<OrderDocument> {
    const { db } = getFirebaseServices();
    const orderReference = db.collection("orders").doc(input.checkoutId);
    const productReferences = input.items.map((item) =>
      db.collection("products").doc(item.productId),
    );
    const inventoryReferences = input.items.map((item) =>
      db.collection("inventory").doc(item.productId),
    );

    return db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(
        orderReference,
        ...productReferences,
        ...inventoryReferences,
      );
      const existingOrder = snapshots[0];
      if (!existingOrder) {
        throw new Error("Firestore transaction returned an incomplete order snapshot.");
      }
      if (existingOrder.exists) {
        const order = serializeOrder(existingOrder.id, existingOrder.data());
        if (order.userId !== customerUid) {
          throw new AppError(
            409,
            "CHECKOUT_ID_CONFLICT",
            "This checkout reference is already in use.",
          );
        }
        return order;
      }

      const productSnapshots = snapshots.slice(1, 1 + input.items.length);
      const inventorySnapshots = snapshots.slice(1 + input.items.length);
      const timestamp = Timestamp.now();
      const orderItems = input.items.map((item, index) => {
        const productSnapshot = productSnapshots[index];
        const inventorySnapshot = inventorySnapshots[index];
        if (!productSnapshot?.exists) {
          throw new AppError(
            409,
            "PRODUCT_UNAVAILABLE",
            `Product ${item.productId} is no longer available.`,
          );
        }
        const product = productSchema.parse(productSnapshot.data());
        if (
          !product.isPublished ||
          product.isArchived ||
          product.submissionStatus !== "approved"
        ) {
          throw new AppError(
            409,
            "PRODUCT_UNAVAILABLE",
            `${product.name} is no longer available.`,
          );
        }
        if (!inventorySnapshot?.exists) {
          throw new AppError(
            409,
            "INVENTORY_UNAVAILABLE",
            `${product.name} is temporarily unavailable.`,
          );
        }
        const inventory = inventorySchema.parse(inventorySnapshot.data());
        if (inventory.productId !== item.productId) {
          throw new Error("Inventory product ID does not match its document ID.");
        }
        if (inventory.availableQuantity < item.quantity) {
          throw new AppError(
            409,
            "INSUFFICIENT_INVENTORY",
            `Only ${inventory.availableQuantity} unit(s) of ${product.name} remain.`,
          );
        }

        const updatedInventory = inventorySchema.parse({
          ...inventory,
          availableQuantity: inventory.availableQuantity - item.quantity,
          updatedAt: timestamp,
          updatedBy: customerUid,
        });
        transaction.set(inventoryReferences[index]!, updatedInventory);

        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unitPriceSen: product.retailPriceSen,
          lineTotalSen: product.retailPriceSen * item.quantity,
        };
      });
      const subtotalSen = orderItems.reduce(
        (sum, item) => sum + item.lineTotalSen,
        0,
      );
      const shippingSen = subtotalSen >= 12_000 ? 0 : 1_000;
      const created = orderSchema.parse({
        userId: customerUid,
        buyerRole: "customer",
        items: orderItems,
        subtotalSen,
        shippingSen,
        totalSen: subtotalSen + shippingSen,
        currency: "MYR",
        shippingAddress: input.shippingAddress,
        contactName: input.contactName,
        contactEmail: customerEmail,
        contactPhone: input.contactPhone,
        paymentMethod: input.paymentMethod,
        paymentStatus: "paid_simulated",
        status: "placed",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.create(orderReference, created);
      return serializeOrder(orderReference.id, created);
    });
  }

  public async listOrders(): Promise<readonly OrderDocument[]> {
    const snapshot = await getFirebaseServices().db.collection("orders").limit(100).get();
    return mapDocuments(snapshot.docs, serializeOrder);
  }

  public async getOrder(id: string): Promise<OrderDocument | null> {
    const snapshot = await getFirebaseServices().db.collection("orders").doc(id).get();
    return snapshot.exists ? serializeOrder(snapshot.id, snapshot.data()) : null;
  }

  public async updateOrderStatus(
    id: string,
    input: OrderStatusUpdateInput,
    _actorUid: string,
  ): Promise<OrderDocument | null> {
    const { db } = getFirebaseServices();
    const reference = db.collection("orders").doc(id);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return null;
      const current = orderSchema.parse(snapshot.data());
      if (!allowedStatusTransitions[current.status].includes(input.status)) {
        throw new AppError(
          409,
          "ORDER_TRANSITION_INVALID",
          `An order cannot move from ${current.status} to ${input.status}.`,
        );
      }
      const updated = orderSchema.parse({
        ...current,
        status: input.status,
        updatedAt: Timestamp.now(),
      });
      transaction.set(reference, updated);
      return serializeOrder(reference.id, updated);
    });
  }

  public async deleteOrder(id: string, _actorUid: string): Promise<void> {
    const { db } = getFirebaseServices();
    const reference = db.collection("orders").doc(id);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
      }
      const order = orderSchema.parse(snapshot.data());
      if (order.status !== "cancelled") {
        throw new AppError(
          409,
          "ORDER_DELETE_FORBIDDEN",
          "Only cancelled orders can be deleted.",
        );
      }
      transaction.delete(reference);
    });
  }

  public async uploadProductImage(
    image: ProductImageInput,
    actorUid: string,
  ): Promise<ProductImageResult> {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new AppError(
        503,
        "STORAGE_NOT_CONFIGURED",
        "Image storage is not configured.",
      );
    }

    const token = randomUUID();
    const path = `products/${actorUid}/${randomUUID()}.${image.extension}`;
    const bucket = getFirebaseServices().storage.bucket(bucketName);
    await bucket.file(path).save(image.buffer, {
      resumable: false,
      validation: "crc32c",
      metadata: {
        contentType: image.mimeType,
        cacheControl: "public,max-age=31536000,immutable",
        metadata: {
          firebaseStorageDownloadTokens: token,
          uploadedBy: actorUid,
        },
      },
    });

    const storageOrigin = process.env.FIREBASE_STORAGE_EMULATOR_HOST
      ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
      : "https://firebasestorage.googleapis.com";
    const url = `${storageOrigin}/v0/b/${encodeURIComponent(
      bucketName,
    )}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return { path, url };
  }
}
