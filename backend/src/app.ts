import { fileURLToPath } from "node:url";
import Fastify, { LogController, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import type { AppConfig } from "./config.js";
import type { Database } from "./db.js";
import { errorEnvelope, installErrorHandling } from "./errors.js";
import { createRequireAdmin } from "./auth/middleware.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import assetRoutes from "./routes/assets.js";
import donationRoutes from "./routes/donations.js";

export type BuildAppOptions = {
  sql: Database;
  config: AppConfig;
  logger?: FastifyServerOptions["logger"];
  serveFrontend?: boolean;
  frontendDistDirectory?: string;
};

const defaultFrontendDistDirectory = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));

export async function buildApp({
  sql,
  config,
  logger = false,
  serveFrontend = false,
  frontendDistDirectory = defaultFrontendDistDirectory,
}: BuildAppOptions) {
  const app = Fastify({
    logger,
    trustProxy: (_address: string, hop: number) => hop === 0,
    bodyLimit: config.requestBodyLimitBytes,
    requestIdHeader: false,
    logController: new LogController({ disableRequestLogging: true }),
  });
  app.decorateRequest("admin", null);

  const allowedOrigins = new Set([config.publicApiUrl, ...config.frontendOrigins]);
  await app.register(cors, {
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: false,
    methods: ["GET", "PUT", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "If-None-Match"],
    exposedHeaders: ["ETag"],
    maxAge: 86400,
    strictPreflight: true,
  });
  await app.register(rateLimit, {
    global: true,
    max: 240,
    timeWindow: "1 minute",
  });
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 10 * 1024 * 1024,
      fields: 4,
      parts: 5,
    },
  });

  installErrorHandling(
    app,
    serveFrontend
      ? ((request, reply) => {
          const pathname = request.url.split("?", 1)[0] ?? "";
          const acceptsHtml = request.headers.accept?.includes("text/html") ?? false;
          if (request.method === "GET" && acceptsHtml && pathname !== "/api" && !pathname.startsWith("/api/")) {
            reply.header("Cache-Control", "no-cache");
            return reply.sendFile("index.html");
          }
          return reply
            .status(404)
            .send(errorEnvelope("NOT_FOUND", "The requested resource was not found.", request.id));
        })
      : undefined,
  );
  const requireAdmin = createRequireAdmin(sql);
  await app.register(healthRoutes, { sql });
  await app.register(authRoutes, { sql, config, requireAdmin });
  await app.register(contentRoutes, { sql, requireAdmin });
  await app.register(assetRoutes, { sql, config, requireAdmin });
  await app.register(donationRoutes, { sql, requireAdmin });

  if (serveFrontend) {
    await app.register(fastifyStatic, {
      root: frontendDistDirectory,
      prefix: "/",
      setHeaders(response, filePath) {
        if (filePath.endsWith("index.html")) response.header("Cache-Control", "no-cache");
      },
    });
  }

  return app;
}

export default buildApp;
