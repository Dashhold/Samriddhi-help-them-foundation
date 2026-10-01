import { createHash, randomBytes } from "node:crypto";
import type { Database } from "../db.js";

export const SESSION_TOKEN_BYTES = 32;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createOpaqueToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export async function createAdminSession(
  sql: Database,
  admin: { id: string; credentialVersion: number },
  ttlHours: number,
) {
  const token = createOpaqueToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await sql`
    INSERT INTO admin_sessions (token_hash, admin_id, credential_version, expires_at)
    VALUES (${tokenHash}, ${admin.id}, ${admin.credentialVersion}, ${expiresAt})
  `;
  return { token, expiresAt: expiresAt.toISOString() };
}

export function bearerToken(authorization: string | undefined) {
  if (!authorization) return null;
  const match = /^Bearer ([A-Za-z0-9_-]{40,200})$/.exec(authorization);
  return match?.[1] ?? null;
}
