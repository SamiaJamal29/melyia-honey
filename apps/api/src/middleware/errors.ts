import { randomUUID } from "node:crypto";

import {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";

export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  request.requestId = requestId;
  response.setHeader("X-Request-Id", requestId);
  next();
};

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", "The requested resource was not found."));
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  const requestId = request.requestId ?? randomUUID();

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message, requestId },
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  console.error({ requestId, message });
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
      requestId,
    },
  });
};
