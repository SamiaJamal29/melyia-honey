import { type RequestHandler } from "express";

import { getFirebaseServices } from "../config/firebase-admin.js";
import {
  type AuthenticatedPrincipal,
  authenticationProfileSchema,
} from "../domain/auth.js";
import { AppError } from "./errors.js";

export interface VerifiedIdToken {
  readonly uid: string;
  readonly email?: string;
  readonly email_verified?: boolean;
  readonly firebase?: {
    readonly sign_in_second_factor?: string;
  };
}

export interface AuthenticationDependencies {
  readonly verifyIdToken: (token: string) => Promise<VerifiedIdToken>;
  readonly getUserProfile: (uid: string) => Promise<unknown>;
  readonly verifyAppCheckToken: (token: string) => Promise<void>;
  readonly enforceAppCheck: boolean;
  readonly requireAdminMfa: boolean;
  readonly requireVerifiedEmail: boolean;
}

export interface IdentityAuthenticationDependencies {
  readonly verifyIdToken: (token: string) => Promise<VerifiedIdToken>;
  readonly verifyAppCheckToken: (token: string) => Promise<void>;
  readonly enforceAppCheck: boolean;
}

const parseBearerToken = (authorization: string | undefined): string => {
  const [scheme, token, extra] = authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token || extra) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication is required.");
  }
  return token;
};

const verifyApplication = async (
  request: Parameters<RequestHandler>[0],
  dependencies: Pick<
    IdentityAuthenticationDependencies,
    "enforceAppCheck" | "verifyAppCheckToken"
  >,
): Promise<void> => {
  if (!dependencies.enforceAppCheck) return;

  const appCheckToken = request.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    throw new AppError(
      401,
      "APP_CHECK_REQUIRED",
      "Application verification is required.",
    );
  }
  try {
    await dependencies.verifyAppCheckToken(appCheckToken);
  } catch {
    throw new AppError(
      401,
      "APP_CHECK_INVALID",
      "Application verification failed.",
    );
  }
};

const verifyToken = async (
  authorization: string | undefined,
  verifier: (token: string) => Promise<VerifiedIdToken>,
): Promise<VerifiedIdToken> => {
  const token = parseBearerToken(authorization);
  try {
    return await verifier(token);
  } catch {
    throw new AppError(
      401,
      "AUTH_INVALID",
      "Authentication could not be verified.",
    );
  }
};

export const createIdentityAuthenticationMiddleware = (
  dependencies: IdentityAuthenticationDependencies,
): RequestHandler => {
  return async (request, _response, next) => {
    try {
      await verifyApplication(request, dependencies);
      const token = await verifyToken(
        request.header("Authorization"),
        dependencies.verifyIdToken,
      );
      if (!token.email) {
        throw new AppError(
          403,
          "EMAIL_REQUIRED",
          "A verified email address is required.",
        );
      }
      request.identity = { uid: token.uid, email: token.email };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const createAuthenticationMiddleware = (
  dependencies: AuthenticationDependencies,
): RequestHandler => {
  return async (request, _response, next) => {
    try {
      await verifyApplication(request, dependencies);
      const verifiedToken = await verifyToken(
        request.header("Authorization"),
        dependencies.verifyIdToken,
      );

      if (
        dependencies.requireVerifiedEmail &&
        verifiedToken.email_verified !== true
      ) {
        throw new AppError(
          403,
          "EMAIL_UNVERIFIED",
          "Verify your email address before continuing.",
        );
      }

      const rawProfile = await dependencies.getUserProfile(verifiedToken.uid);
      if (!rawProfile) {
        throw new AppError(
          403,
          "PROFILE_REQUIRED",
          "An application profile is required.",
        );
      }

      const profile = authenticationProfileSchema.safeParse(rawProfile);
      if (!profile.success) {
        throw new AppError(403, "PROFILE_INVALID", "The account profile is invalid.");
      }
      if (!profile.data.isActive) {
        throw new AppError(403, "ACCOUNT_DISABLED", "This account is disabled.");
      }

      const secondFactor = verifiedToken.firebase?.sign_in_second_factor;
      if (
        dependencies.requireAdminMfa &&
        profile.data.role === "admin" &&
        !secondFactor
      ) {
        throw new AppError(
          403,
          "MFA_REQUIRED",
          "Multi-factor authentication is required.",
        );
      }

      const principal: AuthenticatedPrincipal = {
        uid: verifiedToken.uid,
        email: verifiedToken.email ?? profile.data.email,
        role: profile.data.role,
        isActive: true,
        ...(secondFactor ? { secondFactor } : {}),
      };
      request.principal = principal;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const isEnabled = (value: string | undefined): boolean => value === "true";

const verifyFirebaseToken = async (token: string): Promise<VerifiedIdToken> => {
  const decodedToken = await getFirebaseServices().auth.verifyIdToken(token, true);
  return {
    uid: decodedToken.uid,
    ...(decodedToken.email ? { email: decodedToken.email } : {}),
    ...(typeof decodedToken.email_verified === "boolean"
      ? { email_verified: decodedToken.email_verified }
      : {}),
    firebase: {
      ...(decodedToken.firebase.sign_in_second_factor
        ? {
            sign_in_second_factor: decodedToken.firebase.sign_in_second_factor,
          }
        : {}),
    },
  };
};

const verifyFirebaseAppCheck = async (token: string): Promise<void> => {
  await getFirebaseServices().appCheck.verifyToken(token);
};

export const authenticateIdentity: RequestHandler =
  createIdentityAuthenticationMiddleware({
    verifyIdToken: verifyFirebaseToken,
    verifyAppCheckToken: verifyFirebaseAppCheck,
    enforceAppCheck: isEnabled(process.env.ENFORCE_APP_CHECK),
  });

export const authenticate: RequestHandler = createAuthenticationMiddleware({
  verifyIdToken: verifyFirebaseToken,
  getUserProfile: async (uid) => {
    const snapshot = await getFirebaseServices().db.collection("users").doc(uid).get();
    return snapshot.exists ? snapshot.data() ?? null : null;
  },
  verifyAppCheckToken: verifyFirebaseAppCheck,
  enforceAppCheck: isEnabled(process.env.ENFORCE_APP_CHECK),
  requireAdminMfa: isEnabled(process.env.REQUIRE_ADMIN_MFA),
  requireVerifiedEmail: process.env.REQUIRE_VERIFIED_EMAIL !== "false",
});
