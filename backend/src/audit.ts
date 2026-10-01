import type { FastifyRequest } from "fastify";
import type { Database } from "./db.js";

export type AuditInput = {
  adminId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordAudit(sql: Database, request: FastifyRequest, input: AuditInput) {
  const userAgent = request.headers["user-agent"]?.slice(0, 500) ?? null;
  await sql`
    INSERT INTO admin_audit_log (
      admin_id, action, resource_type, resource_id, request_id, request_ip, user_agent, metadata
    ) VALUES (
      ${input.adminId ?? null}, ${input.action}, ${input.resourceType}, ${input.resourceId ?? null},
      ${request.id}, ${request.ip}, ${userAgent}, ${sql.json(input.metadata ?? {})}
    )
  `;
}
