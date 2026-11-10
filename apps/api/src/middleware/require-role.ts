import { type RequestHandler } from "express";

import { type Role } from "../domain/auth.js";
import { AppError } from "./errors.js";

export const requireRole = (...allowedRoles: readonly Role[]): RequestHandler => {
  return (request, _response, next) => {
    if (!request.principal) {
      next(new AppError(401, "AUTH_REQUIRED", "Authentication is required."));
      return;
    }
    if (!allowedRoles.includes(request.principal.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have access to this resource."));
      return;
    }
    next();
  };
};
