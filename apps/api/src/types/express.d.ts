import { type AuthenticatedPrincipal } from "../domain/auth.js";

declare global {
  namespace Express {
    interface AuthenticatedIdentity {
      uid: string;
      email: string;
    }

    interface Request {
      identity?: AuthenticatedIdentity;
      principal?: AuthenticatedPrincipal;
      requestId?: string;
    }
  }
}

export {};
