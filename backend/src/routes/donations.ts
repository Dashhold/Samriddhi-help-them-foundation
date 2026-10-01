import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { recordAudit } from "../audit.js";
import { getDonationRecords } from "../donations/repository.js";

const querySchema = z.object({
  period: z.enum(["monthly", "yearly"]),
  value: z.string().min(1).max(7),
}).strict();

type RouteOptions = {
  sql: Database;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

export default async function donationRoutes(app: FastifyInstance, options: RouteOptions) {
  app.get("/api/admin/donations", { preHandler: options.requireAdmin }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) throw new AppError(400, "BAD_REQUEST", "Choose a valid donation report period.");
    const records = await getDonationRecords(options.sql, parsed.data.period, parsed.data.value);
    await recordAudit(options.sql, request, {
      adminId: request.admin.id,
      action: "donations.read",
      resourceType: "donation_report",
      resourceId: `${parsed.data.period}:${parsed.data.value}`,
      metadata: { resultCount: records.length },
    });
    return { records };
  });
}
