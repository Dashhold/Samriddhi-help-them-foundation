import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { recordAudit } from "../audit.js";
import { deleteOfflineReceipt, issueReceipt, listReceipts, PAYMENT_MODES } from "../donations/receipts.js";

const receiptSchema = z.object({
  donorType: z.enum(["individual", "company"]),
  donorName: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(160).default(""),
  email: z.string().trim().toLowerCase().max(160).regex(/^([^\s@]+@[^\s@]+\.[^\s@]+)?$/).default(""),
  phone: z.string().trim().max(20).default(""),
  pan: z.string().trim().toUpperCase().regex(/^([A-Z]{5}[0-9]{4}[A-Z])?$/).default(""),
  address: z.string().trim().max(300).default(""),
  amount: z.number().min(1).max(1_000_000_000),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMode: z.enum(PAYMENT_MODES),
  paymentReference: z.string().trim().max(80).default(""),
  purpose: z.string().trim().min(2).max(160).default("General donation"),
  notes: z.string().trim().max(500).default(""),
}).strict();

const fieldLabels: Record<string, string> = {
  donorType: "donor type",
  donorName: "donor name",
  companyName: "company name",
  email: "email",
  phone: "phone",
  pan: "PAN",
  address: "address",
  amount: "amount",
  paymentDate: "payment date",
  paymentMode: "payment mode",
  paymentReference: "transaction reference",
  purpose: "purpose",
  notes: "notes",
};

const idParamsSchema = z.object({ id: z.string().uuid() });

type RouteOptions = {
  sql: Database;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

function isValidPaymentDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  // Allow one day ahead so a payment made today in India is accepted before UTC catches up.
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  return parsed.getUTCFullYear() >= 2000 && parsed.getTime() <= tomorrow;
}

export default async function receiptRoutes(app: FastifyInstance, options: RouteOptions) {
  const { sql, requireAdmin } = options;

  app.get("/api/admin/receipts", { preHandler: requireAdmin }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return { receipts: await listReceipts(sql) };
  });

  app.post("/api/admin/receipts", { preHandler: requireAdmin }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const parsed = receiptSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      const label = fieldLabels[String(parsed.error.issues[0]?.path[0] ?? "")];
      throw new AppError(400, "BAD_REQUEST", label ? `Please check the ${label} field.` : "Please check the receipt details.");
    }
    const input = parsed.data;
    if (input.donorType === "company" && input.companyName.length < 2) {
      throw new AppError(400, "BAD_REQUEST", "Please check the company name field.");
    }
    if (!isValidPaymentDate(input.paymentDate)) {
      throw new AppError(400, "BAD_REQUEST", "The payment date must be a real date that is not in the future.");
    }
    const adminId = request.admin.id;
    const receipt = await sql.begin(async (transaction) => {
      const database = transaction as Database;
      const issued = await issueReceipt(database, input);
      await recordAudit(database, request, {
        adminId,
        action: "receipt.issue",
        resourceType: "donation",
        resourceId: issued.id,
        metadata: { receiptNumber: issued.receiptNumber, amount: issued.amount },
      });
      return issued;
    });
    return reply.status(201).send({ receipt });
  });

  app.delete("/api/admin/receipts/:id", { preHandler: requireAdmin }, async (request, reply) => {
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const params = idParamsSchema.safeParse(request.params);
    if (!params.success) throw new AppError(404, "NOT_FOUND", "This receipt was not found.");
    const adminId = request.admin.id;
    const deleted = await sql.begin(async (transaction) => {
      const database = transaction as Database;
      const row = await deleteOfflineReceipt(database, params.data.id);
      if (!row) return null;
      await recordAudit(database, request, {
        adminId,
        action: "receipt.delete",
        resourceType: "donation",
        resourceId: row.id,
        metadata: { receiptNumber: row.receipt_number },
      });
      return row;
    });
    if (!deleted) throw new AppError(404, "NOT_FOUND", "Only receipts issued from the admin panel can be deleted.");
    return reply.status(204).send();
  });
}
