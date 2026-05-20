"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default("4000"),
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    FRONTEND_URL: zod_1.z.url(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    SUPABASE_URL: zod_1.z.url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    FIREBASE_PROJECT_ID: zod_1.z.string().min(1),
    FIREBASE_CLIENT_EMAIL: zod_1.z.email(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().min(1),
    CAMPAIGN_START_DATE: zod_1.z.string().min(1),
    CAMPAIGN_END_DATE: zod_1.z.string().min(1),
    DAILY_PLAY_LIMIT: zod_1.z
        .string()
        .default("3")
        .transform((v) => Number(v)),
    ADMIN_SECRET: zod_1.z.string().min(1),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
