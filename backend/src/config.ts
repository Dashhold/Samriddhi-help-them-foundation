import { z } from "zod";

export const DEFAULT_ADMIN_USERNAME = "jagbir-samriddhi";

const MISSING_DATABASE_MESSAGE =
  "DATABASE_URL is not set. In Railway open the backend service > Variables, add DATABASE_URL with the value " +
  "${{Postgres.DATABASE_URL}} (use your PostgreSQL service name), then deploy again.";

function present(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// Accept the connection variables Railway's PostgreSQL service exposes, under any of their usual names.
function resolveDatabaseUrl(env: NodeJS.ProcessEnv) {
  for (const key of ["DATABASE_URL", "DATABASE_PRIVATE_URL", "POSTGRES_URL", "POSTGRESQL_URL", "DATABASE_PUBLIC_URL"]) {
    const value = present(env[key]);
    if (value) return value;
  }
  const host = present(env.PGHOST);
  const user = present(env.PGUSER);
  const database = present(env.PGDATABASE);
  if (host && user && database) {
    const password = present(env.PGPASSWORD);
    const credentials = password
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
      : encodeURIComponent(user);
    return `postgresql://${credentials}@${host}:${present(env.PGPORT) ?? "5432"}/${encodeURIComponent(database)}`;
  }
  return undefined;
}

// Defaults that let the API boot on Railway with only a database connection configured.
function withDefaults(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const databaseUrl = resolveDatabaseUrl(env);
  if (!databaseUrl) throw new Error(MISSING_DATABASE_MESSAGE);
  const railwayDomain = present(env.RAILWAY_PUBLIC_DOMAIN);
  return {
    ...env,
    DATABASE_URL: databaseUrl,
    PUBLIC_API_URL:
      present(env.PUBLIC_API_URL) ?? (railwayDomain ? `https://${railwayDomain}` : `http://localhost:${env.PORT ?? 3000}`),
    ADMIN_USERNAME: present(env.ADMIN_USERNAME) ?? DEFAULT_ADMIN_USERNAME,
    ADMIN_PASSWORD: env.ADMIN_PASSWORD?.trim() ? env.ADMIN_PASSWORD : undefined,
  };
}

function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || /^127(?:\.\d{1,3}){3}$/.test(hostname) || hostname === "[::1]";
}

// Railway shows domains without a scheme, so accept "my-app.up.railway.app" as HTTPS.
function withScheme(value: string) {
  return value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? `https://${value}` : value;
}

function exactOriginSchema(variableName: string) {
  return z.string().transform((rawValue, context) => {
    const value = withScheme(rawValue.trim());
    try {
      if (!/^https?:\/\/[^/?#]+\/?$/i.test(value)) {
        throw new Error("Origin must contain only scheme, host, and optional port.");
      }
      const url = new URL(value);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.hostname.includes("*") ||
        (url.protocol === "http:" && !isLoopbackHostname(url.hostname))
      ) {
        throw new Error("Origin is not trusted.");
      }
      return url.origin;
    } catch {
      context.addIssue({ code: "custom", message: `Invalid ${variableName} origin: ${rawValue}` });
      return z.NEVER;
    }
  });
}

const databaseSchema = z.object({
  DATABASE_URL: z.string().min(1, MISSING_DATABASE_MESSAGE),
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((value) => (["require", "true", "1", "yes"].includes(value?.trim().toLowerCase() ?? "") ? "require" : "disable")),
});

const appSchema = databaseSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_API_URL: exactOriginSchema("PUBLIC_API_URL"),
  FRONTEND_ORIGINS: z.string().default("").transform((value, context) => {
    const values = value.split(",").map((origin) => origin.trim()).filter(Boolean);
    const result = z.array(exactOriginSchema("FRONTEND_ORIGINS")).safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        context.addIssue({ code: "custom", message: issue.message });
      }
      return z.NEVER;
    }
    return [...new Set(result.data)];
  }),
  ADMIN_USERNAME: z.string().trim().min(3).max(100),
  ADMIN_PASSWORD: z.string().min(12).max(512).optional(),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(8),
  REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).max(12 * 1024 * 1024).default(11 * 1024 * 1024),
});

export type DatabaseConfig = {
  databaseUrl: string;
  databaseSsl: false | "require";
};

export type AppConfig = DatabaseConfig & {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  publicApiUrl: string;
  frontendOrigins: string[];
  adminUsername: string;
  /** `null` means the built-in default administrator password is used. */
  adminPassword: string | null;
  sessionTtlHours: number;
  requestBodyLimitBytes: number;
};

function formatConfigError(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`).join("; ");
}

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const result = databaseSchema.safeParse(withDefaults(env));
  if (!result.success) throw new Error(`Invalid server configuration: ${formatConfigError(result.error)}`);
  return {
    databaseUrl: result.data.DATABASE_URL,
    databaseSsl: result.data.DATABASE_SSL === "require" ? "require" : false,
  };
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = appSchema.safeParse(withDefaults(env));
  if (!result.success) throw new Error(`Invalid server configuration: ${formatConfigError(result.error)}`);
  return {
    nodeEnv: result.data.NODE_ENV,
    host: result.data.HOST,
    port: result.data.PORT,
    publicApiUrl: result.data.PUBLIC_API_URL,
    frontendOrigins: result.data.FRONTEND_ORIGINS,
    adminUsername: result.data.ADMIN_USERNAME,
    adminPassword: result.data.ADMIN_PASSWORD ?? null,
    sessionTtlHours: result.data.SESSION_TTL_HOURS,
    requestBodyLimitBytes: result.data.REQUEST_BODY_LIMIT_BYTES,
    databaseUrl: result.data.DATABASE_URL,
    databaseSsl: result.data.DATABASE_SSL === "require" ? "require" : false,
  };
}
