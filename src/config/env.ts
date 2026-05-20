import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CAMPAIGN_START_DATE: z.string().min(1),
  CAMPAIGN_END_DATE: z.string().min(1),
  DAILY_PLAY_LIMIT: z
    .string()
    .default("3")
    .transform((v) => Number(v)),
  // Default admin seed (upserted on startup)
  DEFAULT_ADMIN_EMAIL: z.email(),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8),
  // Admin JWT — can reuse JWT_SECRET or set separately
  ADMIN_JWT_SECRET: z.string().min(32).optional(),
  ADMIN_JWT_EXPIRES_IN: z.string().default('12h'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
