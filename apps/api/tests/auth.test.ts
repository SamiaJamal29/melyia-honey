import express, { type Express } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  createAuthenticationMiddleware,
  type AuthenticationDependencies,
  type VerifiedIdToken,
} from "../src/middleware/authenticate.js";
import {
  errorHandler,
  requestIdMiddleware,
} from "../src/middleware/errors.js";
import { requireRole } from "../src/middleware/require-role.js";

const activeAdmin = {
  email: "admin@melyia.my",
  displayName: "Melyia Admin",
  phone: "+60123456789",
  role: "admin",
  isActive: true,
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
  lastLoginAt: "2026-07-15T00:00:00.000Z",
} as const;

const verifiedToken: VerifiedIdToken = {
  uid: "admin-uid",
  email: "admin@melyia.my",
  email_verified: true,
  firebase: {},
};

interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
}

const readError = (response: { readonly body: unknown }): ApiErrorBody["error"] =>
  (response.body as ApiErrorBody).error;

const createDependencies = (
  overrides: Partial<AuthenticationDependencies> = {},
): AuthenticationDependencies => ({
  verifyIdToken: () => Promise.resolve(verifiedToken),
  getUserProfile: () => Promise.resolve(activeAdmin),
  verifyAppCheckToken: () => Promise.resolve(),
  enforceAppCheck: false,
  requireAdminMfa: false,
  requireVerifiedEmail: true,
  ...overrides,
});

const createTestApp = (
  overrides: Partial<AuthenticationDependencies> = {},
): Express => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get(
    "/admin",
    createAuthenticationMiddleware(createDependencies(overrides)),
    requireRole("admin"),
    (_request, response) => response.status(204).end(),
  );
  app.use(errorHandler);
  return app;
};

describe("Firebase authentication and role enforcement", () => {
  it("rejects a request without a Bearer token", async () => {
    const response = await request(createTestApp()).get("/admin");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: { code: "AUTH_REQUIRED", message: "Authentication is required." },
    });
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
  });

  it("returns a generic error for an invalid or revoked token", async () => {
    const app = createTestApp({
      verifyIdToken: () => Promise.reject(new Error("auth/id-token-revoked")),
    });

    const response = await request(app)
      .get("/admin")
      .set("Authorization", "Bearer revoked-token");

    expect(response.status).toBe(401);
    expect(readError(response)).toMatchObject({
      code: "AUTH_INVALID",
      message: "Authentication could not be verified.",
    });
    expect(JSON.stringify(response.body)).not.toContain("revoked");
  });

  it("rejects an authenticated user without a profile", async () => {
    const response = await request(
      createTestApp({ getUserProfile: () => Promise.resolve(null) }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(readError(response).code).toBe("PROFILE_REQUIRED");
  });

  it("rejects an inactive user", async () => {
    const response = await request(
      createTestApp({
        getUserProfile: () =>
          Promise.resolve({ ...activeAdmin, isActive: false }),
      }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(readError(response).code).toBe("ACCOUNT_DISABLED");
  });

  it("rejects an unverified email on protected application routes", async () => {
    const response = await request(
      createTestApp({
        verifyIdToken: () =>
          Promise.resolve({ ...verifiedToken, email_verified: false }),
      }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(readError(response).code).toBe("EMAIL_UNVERIFIED");
  });

  it("denies a customer access to an administrator route", async () => {
    const response = await request(
      createTestApp({
        getUserProfile: () =>
          Promise.resolve({ ...activeAdmin, role: "customer" }),
      }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(readError(response).code).toBe("FORBIDDEN");
  });

  it("allows an active administrator", async () => {
    const response = await request(createTestApp())
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(204);
  });

  it("requires a second factor for administrator routes when enabled", async () => {
    const withoutMfa = await request(
      createTestApp({ requireAdminMfa: true }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    const withMfa = await request(
      createTestApp({
        requireAdminMfa: true,
        verifyIdToken: () =>
          Promise.resolve({
            ...verifiedToken,
            firebase: { sign_in_second_factor: "totp" },
          }),
      }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    expect(withoutMfa.status).toBe(403);
    expect(readError(withoutMfa).code).toBe("MFA_REQUIRED");
    expect(withMfa.status).toBe(204);
  });

  it("requires and verifies App Check when enforcement is enabled", async () => {
    const withoutAppCheck = await request(
      createTestApp({ enforceAppCheck: true }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token");

    const withAppCheck = await request(
      createTestApp({ enforceAppCheck: true }),
    )
      .get("/admin")
      .set("Authorization", "Bearer valid-token")
      .set("X-Firebase-AppCheck", "valid-app-check-token");

    expect(withoutAppCheck.status).toBe(401);
    expect(readError(withoutAppCheck).code).toBe("APP_CHECK_REQUIRED");
    expect(withAppCheck.status).toBe(204);
  });
});
