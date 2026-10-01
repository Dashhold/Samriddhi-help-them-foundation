import postgres, { type Sql } from "postgres";
import type { DatabaseConfig } from "./config.js";

export type Database = Sql<Record<string, never>>;

export function createDatabase(config: DatabaseConfig): Database {
  return postgres(config.databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: config.databaseSsl,
    prepare: true,
    onnotice: () => undefined,
  });
}

export async function closeDatabase(sql: Database) {
  await sql.end({ timeout: 5 });
}
