import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RouteHandlerMethod } from "fastify";
import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST"
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorEnvelope(code: ErrorCode, message: string, requestId: string) {
  return { error: { code, message, requestId } };
}

function sendError(reply: FastifyReply, requestId: string, statusCode: number, code: ErrorCode, message: string) {
  return reply.status(statusCode).send(errorEnvelope(code, message, requestId));
}

export function installErrorHandling(app: FastifyInstance, notFoundHandler?: RouteHandlerMethod) {
  app.setNotFoundHandler(
    notFoundHandler ?? ((request, reply) =>
      sendError(reply, request.id, 404, "NOT_FOUND", "The requested resource was not found.")),
  );

  app.setErrorHandler((error: FastifyError | AppError | ZodError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return sendError(reply, request.id, error.statusCode, error.code, error.message);
    }
    if (error instanceof ZodError) {
      return sendError(reply, request.id, 400, "BAD_REQUEST", "The request data is invalid.");
    }
    if (error.statusCode === 429) {
      return sendError(reply, request.id, 429, "RATE_LIMITED", "Too many requests. Please try again later.");
    }
    if (error.statusCode === 413 || error.code === "FST_REQ_FILE_TOO_LARGE") {
      return sendError(reply, request.id, 413, "PAYLOAD_TOO_LARGE", "The request is larger than the allowed limit.");
    }
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return sendError(reply, request.id, error.statusCode, "BAD_REQUEST", "The request could not be processed.");
    }
    request.log.error({ err: error }, "request failed");
    return sendError(reply, request.id, 500, "INTERNAL_ERROR", "The service could not complete the request.");
  });
}
