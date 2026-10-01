import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { hashPassword, verifyPassword } from "./password.js";

export function normalizeUsername(username: string) {
  return username.normalize("NFKC").trim().toLowerCase();
}

type AdminRow = {
  id: string;
  username: string;
  username_normalized: string;
  password_hash: string;
  credential_version: number;
};

export async function bootstrapAdmin(sql: Database, config: AppConfig) {
  const username = config.adminUsername.normalize("NFKC").trim();
  const normalized = normalizeUsername(username);

  return sql.begin(async (transaction) => {
    const rows = await transaction<AdminRow[]>`
      SELECT id, username, username_normalized, password_hash, credential_version
      FROM admins
      WHERE environment_managed = true
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE
    `;
    const existing = rows[0];
    if (!existing) {
      const passwordHash = await hashPassword(config.adminPassword);
      const inserted = await transaction<{ id: string }[]>`
        INSERT INTO admins (username, username_normalized, password_hash, active, environment_managed)
        VALUES (${username}, ${normalized}, ${passwordHash}, true, true)
        RETURNING id
      `;
      return inserted[0]?.id;
    }

    const passwordMatches = await verifyPassword(existing.password_hash, config.adminPassword);
    const credentialsChanged = existing.username_normalized !== normalized || !passwordMatches;
    if (credentialsChanged) {
      const passwordHash = await hashPassword(config.adminPassword);
      await transaction`
        UPDATE admins
        SET username = ${username}, username_normalized = ${normalized}, password_hash = ${passwordHash},
            active = true, credential_version = credential_version + 1
        WHERE id = ${existing.id}
      `;
      await transaction`
        UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now())
        WHERE admin_id = ${existing.id} AND revoked_at IS NULL
      `;
    } else {
      await transaction`
        UPDATE admins SET username = ${username}, active = true WHERE id = ${existing.id}
      `;
    }
    return existing.id;
  });
}
