import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from "./middleware/errors.js";
import { createApiRouter } from "./routes/index.js";
import { FirestoreCommerceService } from "./services/firestore-commerce.js";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "X-Firebase-AppCheck",
      ],
      credentials: false,
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api", createApiRouter({ service: new FirestoreCommerceService() }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
