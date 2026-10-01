import type { FastifyInstance } from "fastify";
import type { Database } from "../db.js";
import {
  discoverMigrations,
  migrationHistoryIsCurrent,
  type AppliedMigration,
} from "../migrate.js";

export default async function healthRoutes(app: FastifyInstance, options: { sql: Database }) {
  const expectedMigrations = await discoverMigrations();
  const expectedVersion = expectedMigrations.at(-1)?.version ?? null;

  app.get("/health", async (_request, reply) => {
    let databaseReady = false;
    try {
      await options.sql`SELECT 1 AS ready`;
      databaseReady = true;
      const appliedMigrations = await options.sql<AppliedMigration[]>`
        SELECT version, name, checksum FROM schema_migrations ORDER BY version
      `;
      const applied = appliedMigrations.length;
      const latest = appliedMigrations.at(-1)?.version ?? null;
      const current = migrationHistoryIsCurrent(appliedMigrations, expectedMigrations);
      return reply.status(current ? 200 : 503).send({
        status: current ? "ok" : "unavailable",
        database: "ready",
        migrations: {
          applied,
          latest,
          expected: expectedVersion,
          expectedCount: expectedMigrations.length,
          current,
        },
      });
    } catch {
      return reply.status(503).send({
        status: "unavailable",
        database: databaseReady ? "ready" : "not_ready",
        migrations: {
          applied: 0,
          latest: null,
          expected: expectedVersion,
          expectedCount: expectedMigrations.length,
          current: false,
        },
      });
    }
  });
}
