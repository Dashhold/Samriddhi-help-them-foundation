import Fastify, { LogController, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import type { AppConfig } from "./config.js";
import type { Database } from "./db.js";
import { installErrorHandling } from "./errors.js";
import { createRequireAdmin } from "./auth/middleware.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import assetRoutes from "./routes/assets.js";
import donationRoutes from "./routes/donations.js";
import memberRoutes from "./routes/members.js";
import receiptRoutes from "./routes/receipts.js";

export type BuildAppOptions = {
  sql: Database;
  config: AppConfig;
  logger?: FastifyServerOptions["logger"];
};

export async function buildApp({
  sql,
  config,
  logger = false,
}: BuildAppOptions) {
  const app = Fastify({
    logger,
    trustProxy: (_address: string, hop: number) => hop === 0,
    bodyLimit: config.requestBodyLimitBytes,
    requestIdHeader: false,
    logController: new LogController({ disableRequestLogging: true }),
  });
  app.decorateRequest("admin", null);

  // With FRONTEND_ORIGINS unset any site may call the API (auth uses bearer tokens, not cookies).
  const allowedOrigins = new Set(config.frontendOrigins);
  await app.register(cors, {
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.size === 0 || allowedOrigins.has(origin));
    },
    credentials: false,
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
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

  installErrorHandling(app);
  const requireAdmin = createRequireAdmin(sql);
  await app.register(healthRoutes, { sql });
  await app.register(authRoutes, { sql, config, requireAdmin });
  await app.register(contentRoutes, { sql, requireAdmin });
  await app.register(assetRoutes, { sql, config, requireAdmin });
  await app.register(donationRoutes, { sql, requireAdmin });
  await app.register(memberRoutes, { sql, config, requireAdmin });
  await app.register(receiptRoutes, { sql, requireAdmin });

  return app;
}

export default buildApp;
