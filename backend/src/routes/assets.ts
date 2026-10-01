import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { recordAudit } from "../audit.js";
import { getAsset, insertAsset, MAX_ASSET_BYTES } from "../assets/repository.js";

const assetParamsSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1).max(255),
});

type RouteOptions = {
  sql: Database;
  config: AppConfig;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

export default async function assetRoutes(app: FastifyInstance, options: RouteOptions) {
  app.post("/api/admin/assets", { preHandler: options.requireAdmin }, async (request, reply) => {
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const part = await request.file({ limits: { files: 1, fileSize: MAX_ASSET_BYTES } });
    if (!part) throw new AppError(400, "BAD_REQUEST", "Choose a file to upload.");
    const bytes = await part.toBuffer();
    if (part.file.truncated) {
      throw new AppError(413, "PAYLOAD_TOO_LARGE", "The selected file is larger than the 10 MB upload limit.");
    }
    const asset = await options.sql.begin(async (transaction) => {
      const database = transaction as Database;
      const stored = await insertAsset(database, {
        originalFilename: part.filename,
        mimeType: part.mimetype,
        bytes,
        adminId: request.admin!.id,
      });
      await recordAudit(database, request, {
        adminId: request.admin!.id,
        action: "asset.upload",
        resourceType: "cms_asset",
        resourceId: stored.id,
        metadata: { mimeType: stored.mime_type, byteSize: stored.byte_size },
      });
      return stored;
    });
    const url = `${options.config.publicApiUrl}/api/assets/${asset.id}/${encodeURIComponent(asset.safe_filename)}`;
    return reply.status(201).send({
      id: asset.id,
      url,
      fileName: asset.original_filename,
      fileSize: asset.byte_size,
      mimeType: asset.mime_type,
    });
  });

  app.get("/api/assets/:id/:filename", async (request, reply) => {
    const parsed = assetParamsSchema.safeParse(request.params);
    if (!parsed.success) throw new AppError(404, "NOT_FOUND", "The requested asset was not found.");
    const asset = await getAsset(options.sql, parsed.data.id);
    if (!asset || asset.safe_filename !== parsed.data.filename) {
      throw new AppError(404, "NOT_FOUND", "The requested asset was not found.");
    }
    const etag = `"${asset.sha256}"`;
    reply.header("ETag", etag);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Content-Disposition", `inline; filename="${asset.safe_filename}"`);
    if (request.headers["if-none-match"] === etag) return reply.status(304).send();
    return reply.type(asset.mime_type).send(asset.data);
  });
}
