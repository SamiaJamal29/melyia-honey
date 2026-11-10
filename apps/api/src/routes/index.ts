import { fileTypeFromBuffer } from "file-type";
import {
  Router,
  type Request,
  type RequestHandler,
} from "express";
import multer from "multer";
import { z } from "zod";

import { authenticate, authenticateIdentity } from "../middleware/authenticate.js";
import { AppError } from "../middleware/errors.js";
import { requireRole } from "../middleware/require-role.js";
import { parseInput } from "../middleware/validate.js";
import { calculateDiscountedPrice } from "../services/pricing.js";
import {
  bootstrapCustomerSchema,
  customerOrderCreateSchema,
  inventoryUpdateSchema,
  orderStatusUpdateSchema,
  productCreateSchema,
  productReviewSchema,
  productUpdateSchema,
  resellerProductSubmissionSchema,
  resellerProductUpdateSchema,
  resellerRegistrationSchema,
  resellerTierUpdateSchema,
  userUpdateSchema,
  type CommerceService,
  type ProductDocument,
  type ProductImageInput,
} from "../services/commerce.js";

export interface ApiRouterDependencies {
  readonly service: CommerceService;
  readonly authenticate?: RequestHandler;
  readonly authenticateIdentity?: RequestHandler;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const productSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const documentIdSchema = z.string().min(1).max(128);

const getParam = (request: Request, name: string): string => {
  const value = request.params[name];
  return parseInput(documentIdSchema, Array.isArray(value) ? value[0] : value);
};

const requirePrincipal = (request: Request): NonNullable<Request["principal"]> => {
  if (!request.principal) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication is required.");
  }
  return request.principal;
};

const requireIdentity = (request: Request): NonNullable<Request["identity"]> => {
  if (!request.identity) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication is required.");
  }
  return request.identity;
};

const serializePublicProduct = (product: ProductDocument) => ({
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
});

const singleImageUpload: RequestHandler = (request, response, next) => {
  upload.single("image")(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      next(new AppError(400, "UPLOAD_INVALID", "Upload one image up to 5 MB."));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};

const readProductImage = async (request: Request): Promise<ProductImageInput> => {
  if (!request.file) {
    throw new AppError(400, "IMAGE_REQUIRED", "A product image is required.");
  }

  const detected = await fileTypeFromBuffer(request.file.buffer);
  const supported =
    detected?.mime === "image/jpeg" ||
    detected?.mime === "image/png" ||
    detected?.mime === "image/webp";
  if (!supported) {
    throw new AppError(
      400,
      "IMAGE_TYPE_INVALID",
      "Only JPEG, PNG, and WebP images are supported.",
    );
  }

  const extension = detected.ext === "jpeg" ? "jpg" : detected.ext;
  if (extension !== "jpg" && extension !== "png" && extension !== "webp") {
    throw new AppError(400, "IMAGE_TYPE_INVALID", "The image type is invalid.");
  }

  return {
    buffer: request.file.buffer,
    extension,
    mimeType: detected.mime,
  };
};

export const createApiRouter = ({
  service,
  authenticate: authenticateRequest = authenticate,
  authenticateIdentity: authenticateIdentityRequest = authenticateIdentity,
}: ApiRouterDependencies): Router => {
  const router = Router();

  router.get("/products", async (_request, response) => {
    const products = await service.listPublishedProducts();
    response.json({ data: products.map(serializePublicProduct) });
  });

  router.get(
    "/products/manage",
    authenticateRequest,
    requireRole("admin"),
    async (_request, response) => {
      response.json({ data: await service.listProducts() });
    },
  );

  router.get("/products/:slug", async (request, response) => {
    const slug = parseInput(productSlugSchema, request.params.slug);
    const product = await service.getPublishedProductBySlug(slug);
    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }
    response.json({ data: serializePublicProduct(product) });
  });

  router.post(
    "/products",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const principal = requirePrincipal(request);
      const input = parseInput(productCreateSchema, request.body);
      const product = await service.createProduct(input, principal.uid);
      response.status(201).json({ data: product });
    },
  );

  router.patch(
    "/products/:id",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const principal = requirePrincipal(request);
      const input = parseInput(productUpdateSchema, request.body);
      const product = await service.updateProduct(
        getParam(request, "id"),
        input,
        principal.uid,
      );
      response.json({ data: product });
    },
  );

  router.delete(
    "/products/:id",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const principal = requirePrincipal(request);
      await service.archiveProduct(getParam(request, "id"), principal.uid);
      response.status(204).end();
    },
  );

  router.patch(
    "/products/:id/review",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const product = await service.reviewResellerProduct(
        getParam(request, "id"),
        parseInput(productReviewSchema, request.body),
        requirePrincipal(request).uid,
      );
      response.json({ data: product });
    },
  );

  router.post(
    "/users/bootstrap",
    authenticateIdentityRequest,
    async (request, response) => {
      const identity = requireIdentity(request);
      const input = parseInput(bootstrapCustomerSchema, request.body);
      const user = await service.bootstrapCustomer(
        identity.uid,
        identity.email,
        input,
      );
      response.status(201).json({ data: user });
    },
  );

  router.get("/users/me", authenticateRequest, async (request, response) => {
    const principal = requirePrincipal(request);
    const user = await service.getUser(principal.uid);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    response.json({ data: user });
  });

  router.get(
    "/users",
    authenticateRequest,
    requireRole("admin"),
    async (_request, response) => {
      response.json({ data: await service.listUsers() });
    },
  );

  router.patch(
    "/users/:uid",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const principal = requirePrincipal(request);
      const uid = getParam(request, "uid");
      const input = parseInput(userUpdateSchema, request.body);
      if (uid === principal.uid && input.isActive === false) {
        throw new AppError(
          400,
          "SELF_DISABLE_FORBIDDEN",
          "Administrators cannot disable their own account.",
        );
      }
      const user = await service.updateUser(uid, input, principal.uid);
      if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
      response.json({ data: user });
    },
  );

  router.post(
    "/resellers/register",
    authenticateRequest,
    requireRole("customer", "reseller"),
    async (request, response) => {
      const principal = requirePrincipal(request);
      const input = parseInput(resellerRegistrationSchema, request.body);
      const reseller = await service.registerReseller(
        principal.uid,
        principal.email,
        input,
      );
      response.status(201).json({ data: reseller });
    },
  );

  router.get(
    "/resellers/me",
    authenticateRequest,
    requireRole("reseller"),
    async (request, response) => {
      const reseller = await service.getReseller(requirePrincipal(request).uid);
      if (!reseller) {
        throw new AppError(404, "RESELLER_NOT_FOUND", "Reseller not found.");
      }
      response.json({ data: reseller });
    },
  );

  router.get(
    "/resellers/catalog",
    authenticateRequest,
    requireRole("reseller"),
    async (request, response) => {
      const reseller = await service.getReseller(requirePrincipal(request).uid);
      if (!reseller || reseller.status !== "active") {
        throw new AppError(
          403,
          "RESELLER_INACTIVE",
          "The reseller account is not active.",
        );
      }
      const products = await service.listPublishedProducts();
      response.json({
        data: products.map((product) => ({
          ...serializePublicProduct(product),
          resellerPriceSen: calculateDiscountedPrice({
            retailPriceSen: product.retailPriceSen,
            discountBasisPoints: reseller.discountBasisPoints,
          }),
          discountBasisPoints: reseller.discountBasisPoints,
        })),
      });
    },
  );

  router.get(
    "/resellers/products",
    authenticateRequest,
    requireRole("reseller"),
    async (request, response) => {
      response.json({
        data: await service.listResellerProducts(requirePrincipal(request).uid),
      });
    },
  );

  router.post(
    "/resellers/products",
    authenticateRequest,
    requireRole("reseller"),
    async (request, response) => {
      const product = await service.submitResellerProduct(
        parseInput(resellerProductSubmissionSchema, request.body),
        requirePrincipal(request).uid,
      );
      response.status(201).json({ data: product });
    },
  );

  router.patch(
    "/resellers/products/:id",
    authenticateRequest,
    requireRole("reseller"),
    async (request, response) => {
      const product = await service.updateResellerProduct(
        getParam(request, "id"),
        parseInput(resellerProductUpdateSchema, request.body),
        requirePrincipal(request).uid,
      );
      response.json({ data: product });
    },
  );

  router.delete(
    "/resellers/products/:id",
    authenticateRequest,
    requireRole("reseller"),
    async (request, response) => {
      await service.archiveResellerProduct(
        getParam(request, "id"),
        requirePrincipal(request).uid,
      );
      response.status(204).end();
    },
  );

  router.get(
    "/resellers",
    authenticateRequest,
    requireRole("admin"),
    async (_request, response) => {
      response.json({ data: await service.listResellers() });
    },
  );

  router.patch(
    "/resellers/:uid/tier",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const input = parseInput(resellerTierUpdateSchema, request.body);
      const reseller = await service.updateResellerTier(
        getParam(request, "uid"),
        input,
        requirePrincipal(request).uid,
      );
      if (!reseller) {
        throw new AppError(404, "RESELLER_NOT_FOUND", "Reseller not found.");
      }
      response.json({ data: reseller });
    },
  );

  router.get(
    "/inventory",
    authenticateRequest,
    requireRole("admin"),
    async (_request, response) => {
      response.json({ data: await service.listInventory() });
    },
  );

  router.patch(
    "/inventory/:productId",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const inventory = await service.updateInventory(
        getParam(request, "productId"),
        parseInput(inventoryUpdateSchema, request.body),
        requirePrincipal(request).uid,
      );
      if (!inventory) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      }
      response.json({ data: inventory });
    },
  );

  router.get("/orders/me", authenticateRequest, async (request, response) => {
    response.json({
      data: await service.listOrdersForUser(requirePrincipal(request).uid),
    });
  });

  router.post(
    "/orders",
    authenticateRequest,
    requireRole("customer"),
    async (request, response) => {
      const principal = requirePrincipal(request);
      const order = await service.createCustomerOrder(
        parseInput(customerOrderCreateSchema, request.body),
        principal.uid,
        principal.email,
      );
      response.status(201).json({ data: order });
    },
  );

  router.get(
    "/orders",
    authenticateRequest,
    requireRole("admin"),
    async (_request, response) => {
      response.json({ data: await service.listOrders() });
    },
  );

  router.get("/orders/:id", authenticateRequest, async (request, response) => {
    const principal = requirePrincipal(request);
    const order = await service.getOrder(getParam(request, "id"));
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
    if (principal.role !== "admin" && order.userId !== principal.uid) {
      throw new AppError(403, "FORBIDDEN", "You do not have access to this order.");
    }
    response.json({ data: order });
  });

  router.patch(
    "/orders/:id",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      const order = await service.updateOrderStatus(
        getParam(request, "id"),
        parseInput(orderStatusUpdateSchema, request.body),
        requirePrincipal(request).uid,
      );
      if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
      response.json({ data: order });
    },
  );

  router.delete(
    "/orders/:id",
    authenticateRequest,
    requireRole("admin"),
    async (request, response) => {
      await service.deleteOrder(
        getParam(request, "id"),
        requirePrincipal(request).uid,
      );
      response.status(204).end();
    },
  );

  router.post(
    "/uploads/product-image",
    authenticateRequest,
    requireRole("admin", "reseller"),
    singleImageUpload,
    async (request, response) => {
      const principal = requirePrincipal(request);
      if (principal.role === "reseller") {
        const reseller = await service.getReseller(principal.uid);
        if (!reseller || reseller.status !== "active") {
          throw new AppError(
            403,
            "RESELLER_INACTIVE",
            "The reseller account is not active.",
          );
        }
      }
      const image = await readProductImage(request);
      const uploaded = await service.uploadProductImage(
        image,
        principal.uid,
      );
      response.status(201).json({ data: uploaded });
    },
  );

  return router;
};
