import type { FastifyReply, FastifyRequest } from "fastify";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { bearerToken, hashSessionToken } from "./sessions.js";

export type AuthenticatedAdmin = {
  id: string;
  username: string;
  sessionId: string;
  expiresAt: string;
};

declare module "fastify" {
  interface FastifyRequest {
    admin: AuthenticatedAdmin | null;
  }
}

type SessionRow = {
  session_id: string;
  admin_id: string;
  username: string;
  expires_at: Date;
};

export function createRequireAdmin(sql: Database) {
  return async function requireAdmin(request: FastifyRequest, _reply: FastifyReply) {
    const token = bearerToken(request.headers.authorization);
    if (!token) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const rows = await sql<SessionRow[]>`
      SELECT s.id AS session_id, a.id AS admin_id, a.username, s.expires_at
      FROM admin_sessions s
      JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ${hashSessionToken(token)}
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND a.active = true
        AND s.credential_version = a.credential_version
      LIMIT 1
    `;
    const session = rows[0];
    if (!session) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    request.admin = {
      id: session.admin_id,
      username: session.username,
      sessionId: session.session_id,
      expiresAt: new Date(session.expires_at).toISOString(),
    };
    await sql`
      UPDATE admin_sessions
      SET last_seen_at = now()
      WHERE id = ${session.session_id} AND last_seen_at < now() - interval '5 minutes'
    `;
  };
}
