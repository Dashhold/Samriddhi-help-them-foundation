import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { contentUpdateSchema } from "../content/site-content-schema.js";
import { getAdminContent, getPublishedContent, updatePublishedContent } from "../content/repository.js";

type RouteOptions = {
  sql: Database;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

export default async function contentRoutes(app: FastifyInstance, options: RouteOptions) {
  app.get("/api/content", async () => getPublishedContent(options.sql));

  app.get("/api/admin/content", { preHandler: options.requireAdmin }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return getAdminContent(options.sql);
  });

  app.put("/api/admin/content", { preHandler: options.requireAdmin }, async (request) => {
    const parsed = contentUpdateSchema.safeParse(request.body);
    if (!parsed.success) throw new AppError(400, "BAD_REQUEST", "The content document is invalid.");
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    return updatePublishedContent(
      options.sql,
      request,
      parsed.data.content,
      parsed.data.expectedRevision,
      request.admin.id,
    );
  });
}
