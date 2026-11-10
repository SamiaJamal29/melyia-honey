import express, { type Express, type RequestHandler } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApiRouter } from "../src/routes/index.js";
import type {
  CommerceService,
  ProductCreateInput,
  ResellerRegistrationInput,
} from "../src/services/commerce.js";
import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from "../src/middleware/errors.js";

const now = "2026-07-15T00:00:00.000Z";

const product = {
  id: "tualang-raw-honey",
  name: "Tualang Raw Honey",
  slug: "tualang-raw-honey",
  description: "Wild forest honey harvested responsibly in Pahang.",
  shortDescription: "Bold Malaysian forest honey.",
  category: "raw",
  origin: "Pahang",
  weightGrams: 500,
  retailPriceSen: 4_800,
  imageUrls: [],
  isPublished: true,
  submissionStatus: "approved",
  createdAt: now,
  updatedAt: now,
} as const;

const publicProduct = {
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  shortDescription: product.shortDescription,
  category: product.category,
  origin: product.origin,
  weightGrams: product.weightGrams,
  retailPriceSen: product.retailPriceSen,
  imageUrls: product.imageUrls,
  isPublished: product.isPublished,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
} as const;

const registration = {
  companyName: "Kedai Madu Sdn Bhd",
  registrationNumber: "202601234567",
  contactName: "Amina Rahman",
  phone: "+60123456789",
  billingAddress: {
    line1: "12 Jalan Damai",
    city: "Kuala Lumpur",
    state: "Wilayah Persekutuan Kuala Lumpur",
    postcode: "50450",
    country: "MY",
  },
} as const;

const checkout = {
  checkoutId: "4f403ed2-c8ea-4f92-a68e-2fca61c8856a",
  items: [{ productId: product.id, quantity: 1 }],
  contactName: "Nurul Aina",
  contactPhone: "+60123456789",
  shippingAddress: {
    line1: "12 Jalan Damai",
    city: "Kuala Lumpur",
    state: "Wilayah Persekutuan Kuala Lumpur",
    postcode: "50450",
    country: "MY",
  },
  paymentMethod: "duitnow",
} as const;

const createService = (): CommerceService => ({
  listPublishedProducts: vi.fn(() => Promise.resolve([product])),
  listProducts: vi.fn(() => Promise.resolve([product])),
  getPublishedProductBySlug: vi.fn(() => Promise.resolve(product)),
  createProduct: vi.fn((_input: ProductCreateInput) => Promise.resolve(product)),
  updateProduct: vi.fn(() => Promise.resolve(product)),
  archiveProduct: vi.fn(() => Promise.resolve()),
  submitResellerProduct: vi.fn(() =>
    Promise.resolve({
      ...product,
      isPublished: false,
      submissionStatus: "pending" as const,
      submittedBy: "reseller-uid",
    }),
  ),
  listResellerProducts: vi.fn(() => Promise.resolve([])),
  updateResellerProduct: vi.fn(() =>
    Promise.resolve({
      ...product,
      isPublished: false,
      submissionStatus: "pending" as const,
      submittedBy: "reseller-uid",
    }),
  ),
  archiveResellerProduct: vi.fn(() => Promise.resolve()),
  reviewResellerProduct: vi.fn(() => Promise.resolve(product)),
  bootstrapCustomer: vi.fn(() =>
    Promise.resolve({
      id: "customer-uid",
      email: "customer@example.my",
      displayName: "Customer",
      role: "customer",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as const),
  ),
  getUser: vi.fn(() => Promise.resolve(null)),
  listUsers: vi.fn(() => Promise.resolve([])),
  updateUser: vi.fn(() => Promise.resolve(null)),
  registerReseller: vi.fn((_uid: string, _email: string, input: ResellerRegistrationInput) =>
    Promise.resolve({
      id: "customer-uid",
      userId: "customer-uid",
      ...input,
      tier: "starter",
      discountBasisPoints: 2_500,
      status: "active",
      createdAt: now,
      updatedAt: now,
    } as const),
  ),
  getReseller: vi.fn(() =>
    Promise.resolve({
      id: "reseller-uid",
      userId: "reseller-uid",
      ...registration,
      tier: "silver",
      discountBasisPoints: 3_000,
      status: "active",
      createdAt: now,
      updatedAt: now,
    } as const),
  ),
  listResellers: vi.fn(() => Promise.resolve([])),
  updateResellerTier: vi.fn(() => Promise.resolve(null)),
  listInventory: vi.fn(() => Promise.resolve([])),
  updateInventory: vi.fn(() => Promise.resolve(null)),
  createCustomerOrder: vi.fn(() =>
    Promise.resolve({
      id: checkout.checkoutId,
      userId: "customer-uid",
      buyerRole: "customer",
      items: [{
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPriceSen: product.retailPriceSen,
        lineTotalSen: product.retailPriceSen,
      }],
      subtotalSen: product.retailPriceSen,
      shippingSen: 1_000,
      totalSen: product.retailPriceSen + 1_000,
      currency: "MYR",
      shippingAddress: checkout.shippingAddress,
      contactName: checkout.contactName,
      contactEmail: "customer@example.my",
      contactPhone: checkout.contactPhone,
      paymentMethod: checkout.paymentMethod,
      paymentStatus: "paid_simulated",
      status: "placed" as const,
      createdAt: now,
      updatedAt: now,
    }),
  ),
  listOrdersForUser: vi.fn(() => Promise.resolve([])),
  listOrders: vi.fn(() => Promise.resolve([])),
  getOrder: vi.fn(() => Promise.resolve(null)),
  updateOrderStatus: vi.fn(() => Promise.resolve(null)),
  deleteOrder: vi.fn(() => Promise.resolve()),
  uploadProductImage: vi.fn(() =>
    Promise.resolve({
      path: "products/example.webp",
      url: "https://firebasestorage.googleapis.com/example.webp",
    }),
  ),
});

const identityAuthentication: RequestHandler = (req, _res, next) => {
  req.identity = { uid: "new-uid", email: "new@example.my" };
  next();
};

const roleAuthentication: RequestHandler = (req, _res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (token === "admin" || token === "customer" || token === "reseller") {
    req.principal = {
      uid: `${token}-uid`,
      email: `${token}@example.my`,
      role: token,
      isActive: true,
    };
  }
  next();
};

const createTestApp = (service: CommerceService): Express => {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(
    "/api",
    createApiRouter({
      service,
      authenticate: roleAuthentication,
      authenticateIdentity: identityAuthentication,
    }),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe("commerce API routes", () => {
  let service: CommerceService;

  beforeEach(() => {
    service = createService();
  });

  it("serves the published catalog without authentication", async () => {
    const response = await request(createTestApp(service)).get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [publicProduct] });
  });

  it("allows only administrators to create products", async () => {
    const input = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category,
      origin: product.origin,
      weightGrams: product.weightGrams,
      retailPriceSen: product.retailPriceSen,
      imageUrls: product.imageUrls,
      isPublished: true,
    };

    const denied = await request(createTestApp(service))
      .post("/api/products")
      .set("Authorization", "Bearer customer")
      .send(input);
    const allowed = await request(createTestApp(service))
      .post("/api/products")
      .set("Authorization", "Bearer admin")
      .send(input);

    expect(denied.status).toBe(403);
    expect(allowed.status).toBe(201);
    // Service methods are Vitest mocks here; no runtime `this` binding is involved.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.createProduct).toHaveBeenCalledWith(input, "admin-uid");
  });

  it("lets resellers submit image-backed products only as pending review", async () => {
    const submission = {
      name: "Sabah Forest Honey",
      slug: "sabah-forest-honey",
      description: "A bold forest honey harvested in small batches in Sabah.",
      shortDescription: "Small-batch forest honey from Sabah.",
      category: "raw",
      origin: "Sabah",
      weightGrams: 500,
      retailPriceSen: 5_900,
      imageUrls: ["https://firebasestorage.googleapis.com/example.webp"],
    } as const;

    const denied = await request(createTestApp(service))
      .post("/api/resellers/products")
      .set("Authorization", "Bearer customer")
      .send(submission);
    const publishAttempt = await request(createTestApp(service))
      .post("/api/resellers/products")
      .set("Authorization", "Bearer reseller")
      .send({ ...submission, isPublished: true });
    const allowed = await request(createTestApp(service))
      .post("/api/resellers/products")
      .set("Authorization", "Bearer reseller")
      .send(submission);

    expect(denied.status).toBe(403);
    expect(publishAttempt.status).toBe(400);
    expect(allowed.status).toBe(201);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.submitResellerProduct).toHaveBeenCalledWith(
      submission,
      "reseller-uid",
    );
  });

  it("lets resellers edit and delete only through reseller-protected routes", async () => {
    const deniedEdit = await request(createTestApp(service))
      .patch("/api/resellers/products/sabah-forest-honey")
      .set("Authorization", "Bearer customer")
      .send({ name: "Updated Sabah Honey" });
    const publishAttempt = await request(createTestApp(service))
      .patch("/api/resellers/products/sabah-forest-honey")
      .set("Authorization", "Bearer reseller")
      .send({ isPublished: true });
    const allowedEdit = await request(createTestApp(service))
      .patch("/api/resellers/products/sabah-forest-honey")
      .set("Authorization", "Bearer reseller")
      .send({ name: "Updated Sabah Honey" });
    const deniedDelete = await request(createTestApp(service))
      .delete("/api/resellers/products/sabah-forest-honey")
      .set("Authorization", "Bearer customer");
    const allowedDelete = await request(createTestApp(service))
      .delete("/api/resellers/products/sabah-forest-honey")
      .set("Authorization", "Bearer reseller");

    expect(deniedEdit.status).toBe(403);
    expect(publishAttempt.status).toBe(400);
    expect(allowedEdit.status).toBe(200);
    expect(deniedDelete.status).toBe(403);
    expect(allowedDelete.status).toBe(204);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.updateResellerProduct).toHaveBeenCalledWith(
      "sabah-forest-honey",
      { name: "Updated Sabah Honey" },
      "reseller-uid",
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.archiveResellerProduct).toHaveBeenCalledWith(
      "sabah-forest-honey",
      "reseller-uid",
    );
  });

  it("accepts signed honey images from active resellers", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZB90AAAAASUVORK5CYII=",
      "base64",
    );

    const denied = await request(createTestApp(service))
      .post("/api/uploads/product-image")
      .set("Authorization", "Bearer customer")
      .attach("image", png, { filename: "honey.png", contentType: "image/png" });
    const allowed = await request(createTestApp(service))
      .post("/api/uploads/product-image")
      .set("Authorization", "Bearer reseller")
      .attach("image", png, { filename: "honey.png", contentType: "image/png" });

    expect(denied.status).toBe(403);
    expect(allowed.status).toBe(201);
    expect(allowed.body).toMatchObject({
      data: { path: "products/example.webp" },
    });
  });

  it("lets admins review reseller products", async () => {
    const denied = await request(createTestApp(service))
      .patch("/api/products/sabah-forest-honey/review")
      .set("Authorization", "Bearer reseller")
      .send({ status: "approved" });
    const allowed = await request(createTestApp(service))
      .patch("/api/products/sabah-forest-honey/review")
      .set("Authorization", "Bearer admin")
      .send({ status: "approved" });

    expect(denied.status).toBe(403);
    expect(allowed.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.reviewResellerProduct).toHaveBeenCalledWith(
      "sabah-forest-honey",
      { status: "approved" },
      "admin-uid",
    );
  });

  it("creates customer orders with authenticated server-owned identity", async () => {
    const denied = await request(createTestApp(service))
      .post("/api/orders")
      .set("Authorization", "Bearer reseller")
      .send(checkout);
    const response = await request(createTestApp(service))
      .post("/api/orders")
      .set("Authorization", "Bearer customer")
      .send(checkout);

    expect(denied.status).toBe(403);
    expect(response.status).toBe(201);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.createCustomerOrder).toHaveBeenCalledWith(
      checkout,
      "customer-uid",
      "customer@example.my",
    );
  });

  it("rejects client-supplied order prices and duplicate products", async () => {
    const priced = await request(createTestApp(service))
      .post("/api/orders")
      .set("Authorization", "Bearer customer")
      .send({ ...checkout, subtotalSen: 1 });
    const duplicate = await request(createTestApp(service))
      .post("/api/orders")
      .set("Authorization", "Bearer customer")
      .send({ ...checkout, items: [...checkout.items, ...checkout.items] });

    expect(priced.status).toBe(400);
    expect(duplicate.status).toBe(400);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.createCustomerOrder).not.toHaveBeenCalled();
  });

  it("registers a reseller immediately with server-owned pricing fields", async () => {
    const response = await request(createTestApp(service))
      .post("/api/resellers/register")
      .set("Authorization", "Bearer customer")
      .send(registration);

    expect(response.status).toBe(201);
    // Service methods are Vitest mocks here; no runtime `this` binding is involved.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.registerReseller).toHaveBeenCalledWith(
      "customer-uid",
      "customer@example.my",
      registration,
    );
    const body = response.body as {
      data: { tier: string; discountBasisPoints: number; status: string };
    };
    expect(body.data).toMatchObject({
      tier: "starter",
      discountBasisPoints: 2_500,
      status: "active",
    });
  });

  it("rejects client attempts to choose reseller discounts", async () => {
    const response = await request(createTestApp(service))
      .post("/api/resellers/register")
      .set("Authorization", "Bearer customer")
      .send({ ...registration, tier: "gold", discountBasisPoints: 9_999 });

    expect(response.status).toBe(400);
    // Service methods are Vitest mocks here; no runtime `this` binding is involved.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.registerReseller).not.toHaveBeenCalled();
  });

  it("calculates reseller catalog pricing on the server", async () => {
    const response = await request(createTestApp(service))
      .get("/api/resellers/catalog")
      .set("Authorization", "Bearer reseller");

    expect(response.status).toBe(200);
    const body = response.body as {
      data: Array<{
        retailPriceSen: number;
        resellerPriceSen: number;
        discountBasisPoints: number;
      }>;
    };
    expect(body.data[0]).toMatchObject({
      retailPriceSen: 4_800,
      resellerPriceSen: 3_360,
      discountBasisPoints: 3_000,
    });
  });

  it("does not let an admin create another admin through user updates", async () => {
    const response = await request(createTestApp(service))
      .patch("/api/users/customer-uid")
      .set("Authorization", "Bearer admin")
      .send({ role: "admin" });

    expect(response.status).toBe(400);
    // Service methods are Vitest mocks here; no runtime `this` binding is involved.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.updateUser).not.toHaveBeenCalled();
  });
});
