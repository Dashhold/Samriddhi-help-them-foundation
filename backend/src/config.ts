import { z } from "zod";

const originSchema = z.string().transform((value, context) => {
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("Origin must contain only scheme, host, and optional port.");
    }
    return url.origin;
  } catch {
    context.addIssue({ code: "custom", message: `Invalid frontend origin: ${value}` });
    return z.NEVER;
  }
});

const databaseSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  DATABASE_SSL: z.enum(["disable", "require"]).default("disable"),
});

const appSchema = databaseSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_API_URL: originSchema,
  FRONTEND_ORIGINS: z.string().default("").transform((value, context) => {
    const values = value.split(",").map((origin) => origin.trim()).filter(Boolean);
    const result = z.array(originSchema).safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        context.addIssue({ code: "custom", message: issue.message });
      }
      return z.NEVER;
    }
    return [...new Set(result.data)];
  }),
  ADMIN_USERNAME: z.string().trim().min(3).max(100),
  ADMIN_PASSWORD: z.string().min(12).max(512),
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
  adminPassword: string;
  sessionTtlHours: number;
  requestBodyLimitBytes: number;
};

function formatConfigError(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`).join("; ");
}

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const result = databaseSchema.safeParse(env);
  if (!result.success) throw new Error(`Invalid server configuration: ${formatConfigError(result.error)}`);
  return {
    databaseUrl: result.data.DATABASE_URL,
    databaseSsl: result.data.DATABASE_SSL === "require" ? "require" : false,
  };
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = appSchema.safeParse(env);
  if (!result.success) throw new Error(`Invalid server configuration: ${formatConfigError(result.error)}`);
  return {
    nodeEnv: result.data.NODE_ENV,
    host: result.data.HOST,
    port: result.data.PORT,
    publicApiUrl: result.data.PUBLIC_API_URL,
    frontendOrigins: result.data.FRONTEND_ORIGINS,
    adminUsername: result.data.ADMIN_USERNAME,
    adminPassword: result.data.ADMIN_PASSWORD,
    sessionTtlHours: result.data.SESSION_TTL_HOURS,
    requestBodyLimitBytes: result.data.REQUEST_BODY_LIMIT_BYTES,
    databaseUrl: result.data.DATABASE_URL,
    databaseSsl: result.data.DATABASE_SSL === "require" ? "require" : false,
  };
}
