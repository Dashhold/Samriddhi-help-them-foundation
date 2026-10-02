import { buildApp } from "./app.js";
import { bootstrapAdmin } from "./auth/bootstrap.js";
import { loadAppConfig } from "./config.js";
import { closeDatabase, createDatabase } from "./db.js";

async function start() {
  const config = loadAppConfig();
  const sql = createDatabase(config);
  const app = await buildApp({
    sql,
    config,
    logger: {
      level: config.nodeEnv === "development" ? "debug" : "info",
      redact: {
        paths: [
          "req.headers.authorization",
          "request.headers.authorization",
          "req.body.username",
          "req.body.password",
          "body.username",
          "body.password",
          "username",
          "password",
          "token",
          "err.detail",
          "err.query",
          "err.parameters",
        ],
        censor: "[REDACTED]",
      },
    },
  });

  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, "shutting down");
    await app.close();
    await closeDatabase(sql);
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));

  try {
    await sql`SELECT 1`;
    await bootstrapAdmin(sql, config);
    app.log.info(
      `Admin login ready for "${config.adminUsername}" (${config.adminPassword === null ? "default password" : "ADMIN_PASSWORD"}).`,
    );
    await sql`
      UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now())
      WHERE expires_at <= now() AND revoked_at IS NULL
    `;
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    app.log.error({ err: error }, "API startup failed");
    await app.close();
    await closeDatabase(sql);
    process.exitCode = 1;
  }
}

void start();
