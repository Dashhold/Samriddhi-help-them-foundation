import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { recordAudit } from "../audit.js";
import { normalizeUsername } from "../auth/bootstrap.js";
import { verifyAgainstDummy, verifyPassword } from "../auth/password.js";
import { bearerToken, createAdminSession, hashSessionToken } from "../auth/sessions.js";
import type { AuthenticatedAdmin } from "../auth/middleware.js";

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(512),
}).strict();

const ACCOUNT_LOGIN_MAX_ATTEMPTS = 5;

type AdminRow = {
  id: string;
  username: string;
  password_hash: string;
  credential_version: number;
};

type AccountLoginAttempt = {
  attempt_count: number;
};

type RouteOptions = {
  sql: Database;
  config: AppConfig;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

async function enforceAccountLoginLimit(sql: Database, username: string) {
  const normalized = normalizeUsername(username);
  const identityHash = createHash("sha256").update(normalized).digest("hex");
  const rows = await sql.begin(async (transaction) => {
    await transaction`
      DELETE FROM admin_login_rate_limits
      WHERE updated_at < now() - interval '1 day'
    `;
    return transaction<AccountLoginAttempt[]>`
      INSERT INTO admin_login_rate_limits (identity_hash, window_started_at, attempt_count, updated_at)
      VALUES (${identityHash}, now(), 1, now())
      ON CONFLICT (identity_hash) DO UPDATE
      SET attempt_count = CASE
            WHEN admin_login_rate_limits.window_started_at <= now() - interval '1 minute' THEN 1
            ELSE admin_login_rate_limits.attempt_count + 1
          END,
          window_started_at = CASE
            WHEN admin_login_rate_limits.window_started_at <= now() - interval '1 minute' THEN now()
            ELSE admin_login_rate_limits.window_started_at
          END,
          updated_at = now()
      RETURNING attempt_count
    `;
  });
  if (Number(rows[0]?.attempt_count ?? ACCOUNT_LOGIN_MAX_ATTEMPTS + 1) > ACCOUNT_LOGIN_MAX_ATTEMPTS) {
    throw new AppError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
  }
}

export default async function authRoutes(app: FastifyInstance, options: RouteOptions) {
  const { sql, config, requireAdmin } = options;
  const loginIpLimit = app.createRateLimit({
    max: 20,
    timeWindow: "1 minute",
    keyGenerator: (request) => `login:ip:${request.ip}`,
  });
  const enforceLoginLimit = async (request: FastifyRequest) => {
    const ipResult = await loginIpLimit(request);
    if (!ipResult.isAllowed && ipResult.isExceeded) {
      throw new AppError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
    }
    const body = request.body as { username?: unknown } | undefined;
    const username = typeof body?.username === "string" ? body.username : "invalid";
    await enforceAccountLoginLimit(sql, username);
  };

  app.post("/api/auth/login", { preHandler: enforceLoginLimit }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) throw new AppError(401, "AUTH_FAILED", "Invalid username or password.");
    const normalized = normalizeUsername(parsed.data.username);
    const rows = await sql<AdminRow[]>`
      SELECT id, username, password_hash, credential_version
      FROM admins
      WHERE username_normalized = ${normalized} AND active = true
      LIMIT 1
    `;
    const admin = rows[0];
    const matches = admin
      ? await verifyPassword(admin.password_hash, parsed.data.password)
      : await verifyAgainstDummy(parsed.data.password);
    if (!admin || !matches) {
      await recordAudit(sql, request, {
        action: "auth.login_failed",
        resourceType: "admin_session",
        metadata: { reason: "invalid_credentials" },
      });
      throw new AppError(401, "AUTH_FAILED", "Invalid username or password.");
    }

    const session = await sql.begin(async (transaction) => {
      const database = transaction as Database;
      const created = await createAdminSession(database, {
        id: admin.id,
        credentialVersion: admin.credential_version,
      }, config.sessionTtlHours);
      await recordAudit(database, request, {
        adminId: admin.id,
        action: "auth.login",
        resourceType: "admin_session",
      });
      return created;
    });
    return reply.send({
      token: session.token,
      expiresAt: session.expiresAt,
      admin: { id: admin.id, username: admin.username },
    });
  });

  app.get("/api/auth/session", { preHandler: requireAdmin }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const admin = request.admin as AuthenticatedAdmin;
    return {
      expiresAt: admin.expiresAt,
      admin: { id: admin.id, username: admin.username },
    };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const token = bearerToken(request.headers.authorization);
    if (token) {
      await sql.begin(async (transaction) => {
        const database = transaction as Database;
        const rows = await database<{ admin_id: string; id: string }[]>`
          UPDATE admin_sessions
          SET revoked_at = COALESCE(revoked_at, now())
          WHERE token_hash = ${hashSessionToken(token)}
          RETURNING admin_id, id
        `;
        const session = rows[0];
        if (session) {
          await recordAudit(database, request, {
            adminId: session.admin_id,
            action: "auth.logout",
            resourceType: "admin_session",
            resourceId: session.id,
          });
        }
      });
    }
    return reply.status(204).send();
  });
}
