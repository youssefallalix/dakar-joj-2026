import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MONGODB_CONNECTION_STRING: z.string().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().min(1).optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_DATABASE_URL: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().default("session"),
  SESSION_EXPIRES_DAYS: z.coerce.number().int().positive().default(5),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  ORS_API_KEY: z.string().optional(),
  ORS_BASE_URL: z.string().url().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  PAYDUNYA_MASTER_KEY: z.string().optional(),
  PAYDUNYA_PRIVATE_KEY: z.string().optional(),
  PAYDUNYA_PUBLIC_KEY: z.string().optional(),
  PAYDUNYA_TOKEN: z.string().optional(),
  PAYDUNYA_MODE: z.enum(["test", "live"]).default("test"),
  PAYDUNYA_STORE_NAME: z.string().default("My App"),
  APP_BASE_URL: z.string().url().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(parsed.error.message);
}

export const env = parsed.data;