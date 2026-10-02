import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { hashPassword, verifyPassword } from "./password.js";

// Argon2id hash of the default administrator password that was shared privately with the site owner.
// Only the hash lives in the repository. Setting ADMIN_PASSWORD on Railway replaces it.
export const DEFAULT_ADMIN_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$OS1igJXFA9fLWwnYnw/F4g$Rrur0X8vgsoP7hnhqVPrsIw1zjHZ9WY2AuNAHIjNgP0";

function desiredPasswordHash(config: AppConfig) {
  return config.adminPassword === null ? Promise.resolve(DEFAULT_ADMIN_PASSWORD_HASH) : hashPassword(config.adminPassword);
}

function passwordIsCurrent(storedHash: string, config: AppConfig) {
  return config.adminPassword === null
    ? Promise.resolve(storedHash === DEFAULT_ADMIN_PASSWORD_HASH)
    : verifyPassword(storedHash, config.adminPassword);
}

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
      const passwordHash = await desiredPasswordHash(config);
      const inserted = await transaction<{ id: string }[]>`
        INSERT INTO admins (username, username_normalized, password_hash, active, environment_managed)
        VALUES (${username}, ${normalized}, ${passwordHash}, true, true)
        RETURNING id
      `;
      return inserted[0]?.id;
    }

    const passwordMatches = await passwordIsCurrent(existing.password_hash, config);
    const credentialsChanged = existing.username_normalized !== normalized || !passwordMatches;
    if (credentialsChanged) {
      const passwordHash = await desiredPasswordHash(config);
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
