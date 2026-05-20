# ⚽ Football Game — Backend Build Guide

**Stack:** Node.js · Express · Supabase (PostgreSQL) · Firebase Phone Auth · Redis (leaderboard cache) · TypeScript  
**Frontend repo:** `football-game/` (Next.js 16)  
**Full game guide:** `football-game-build-guide.md`

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Environment Variables](#4-environment-variables)
5. [Supabase Schema](#5-supabase-schema)
6. [Firebase Phone Auth Integration](#6-firebase-phone-auth-integration)
7. [Express App Entry Point](#7-express-app-entry-point)
8. [Middleware](#8-middleware)
9. [Auth Module](#9-auth-module)
10. [Player Module](#10-player-module)
11. [Score Module & Anti-Cheat](#11-score-module--anti-cheat)
12. [Leaderboard Module](#12-leaderboard-module)
13. [Admin Module](#13-admin-module)
14. [Analytics Module](#14-analytics-module)
15. [Redis Caching](#15-redis-caching)
16. [API Reference](#16-api-reference)
17. [Frontend Integration Points](#17-frontend-integration-points)
18. [Deployment](#18-deployment)
19. [Testing Checklist](#19-testing-checklist)
20. [Build Order](#20-build-order)

---

## 1. Project Setup

### Initialize project

```bash
mkdir football-game-api
cd football-game-api
npm init -y
npm install typescript ts-node-dev @types/node --save-dev
npx tsc --init
```

### Install dependencies

```bash
# Core
npm install express cors helmet dotenv

# Supabase
npm install @supabase/supabase-js

# Firebase Admin (verify ID tokens server-side)
npm install firebase-admin

# Redis (leaderboard cache)
npm install ioredis

# Validation
npm install zod

# JWT
npm install jsonwebtoken
npm install @types/jsonwebtoken --save-dev

# Rate limiting
npm install express-rate-limit

# Logging
npm install winston

# Types
npm install @types/express @types/cors --save-dev
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## 2. Folder Structure

```
football-game-api/
├── src/
│   ├── index.ts                    # Express app entry point
│   ├── app.ts                      # App factory (middleware, routes)
│   ├── config/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── firebase.ts             # Firebase Admin init
│   │   ├── redis.ts                # Redis client
│   │   └── env.ts                  # Validated env vars (zod)
│   ├── middleware/
│   │   ├── auth.ts                 # JWT verification middleware
│   │   ├── adminAuth.ts            # Admin-only guard
│   │   ├── rateLimiter.ts          # Per-route rate limiters
│   │   └── errorHandler.ts         # Global error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts      # Zod validation schemas
│   │   ├── player/
│   │   │   ├── player.router.ts
│   │   │   ├── player.controller.ts
│   │   │   ├── player.service.ts
│   │   │   └── player.schema.ts
│   │   ├── score/
│   │   │   ├── score.router.ts
│   │   │   ├── score.controller.ts
│   │   │   ├── score.service.ts
│   │   │   ├── score.validator.ts  # Anti-cheat logic
│   │   │   └── score.schema.ts
│   │   ├── leaderboard/
│   │   │   ├── leaderboard.router.ts
│   │   │   ├── leaderboard.controller.ts
│   │   │   └── leaderboard.service.ts
│   │   ├── admin/
│   │   │   ├── admin.router.ts
│   │   │   ├── admin.controller.ts
│   │   │   └── admin.service.ts
│   │   └── analytics/
│   │       ├── analytics.router.ts
│   │       ├── analytics.controller.ts
│   │       └── analytics.service.ts
│   ├── types/
│   │   └── index.ts                # Shared TypeScript interfaces
│   └── utils/
│       ├── logger.ts
│       ├── response.ts             # Standardized API response helpers
│       └── pagination.ts
├── .env
├── .env.example
├── football-game-backend-build-guide.md
└── package.json
```

---

## 3. Architecture Overview

```
Client (Next.js 16)
        │
        │  HTTPS
        ▼
┌─────────────────────────┐
│   Express API Server    │
│                         │
│  ┌─────────────────┐    │
│  │   Middleware    │    │
│  │ • helmet        │    │
│  │ • cors          │    │
│  │ • rate limiter  │    │
│  │ • JWT verify    │    │
│  └────────┬────────┘    │
│           │             │
│  ┌────────▼────────┐    │
│  │    Routers      │    │
│  │ /auth           │    │
│  │ /players        │    │
│  │ /scores         │    │
│  │ /leaderboard    │    │
│  │ /admin          │    │
│  │ /analytics      │    │
│  └────────┬────────┘    │
└───────────┼─────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
 Supabase       Redis
 (PostgreSQL)   (leaderboard
                 cache)
     │
     ▼
 Firebase Admin
 (token verify)
```

### Request flow for a scored match

```
POST /api/scores
  → auth middleware (verify JWT)
  → rate limiter (max 1 match per 30s)
  → score.controller
  → score.validator (anti-cheat: validate shot log)
  → score.service (save to Supabase)
  → leaderboard.service (invalidate Redis cache)
  → 201 { score, rank }
```

---

## 4. Environment Variables

### `.env.example`

```bash
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # NOT the anon key

# Firebase Admin
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Redis (Upstash recommended for Railway/Render)
REDIS_URL=redis://localhost:6379

# Campaign
CAMPAIGN_START_DATE=2025-06-01
CAMPAIGN_END_DATE=2025-06-30
DAILY_PLAY_LIMIT=3

# Admin
ADMIN_SECRET=your-admin-panel-secret-key
```

### `src/config/env.ts`

```ts
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string(),
  REDIS_URL: z.string(),
  CAMPAIGN_START_DATE: z.string(),
  CAMPAIGN_END_DATE: z.string(),
  DAILY_PLAY_LIMIT: z.string().transform(Number).default("3"),
  ADMIN_SECRET: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

---

## 5. Supabase Schema

Run these in the **Supabase SQL Editor** in order.

### Players table

```sql
CREATE TABLE players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  firebase_uid  TEXT UNIQUE NOT NULL,
  play_count    INTEGER NOT NULL DEFAULT 0,
  is_blocked    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_phone        ON players(phone);
CREATE INDEX idx_players_firebase_uid ON players(firebase_uid);
CREATE INDEX idx_players_is_blocked   ON players(is_blocked);
```

### Scores table

```sql
CREATE TABLE scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  total_score   INTEGER NOT NULL DEFAULT 0,
  goals         INTEGER NOT NULL DEFAULT 0,   -- out of 5
  perfect_shots INTEGER NOT NULL DEFAULT 0,
  difficulty    NUMERIC(4,3) NOT NULL DEFAULT 0,
  shot_log      JSONB NOT NULL,               -- full shot data for anti-cheat audit
  is_flagged    BOOLEAN NOT NULL DEFAULT false,
  qr_ref        TEXT,                         -- QR campaign source
  played_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_goals         CHECK (goals BETWEEN 0 AND 5),
  CONSTRAINT valid_perfect_shots CHECK (perfect_shots BETWEEN 0 AND 5),
  CONSTRAINT valid_total_score   CHECK (total_score BETWEEN 0 AND 750)
);

CREATE INDEX idx_scores_player_id  ON scores(player_id);
CREATE INDEX idx_scores_played_at  ON scores(played_at DESC);
CREATE INDEX idx_scores_total      ON scores(total_score DESC);
CREATE INDEX idx_scores_is_flagged ON scores(is_flagged);
```

### Daily play tracking

```sql
CREATE TABLE daily_plays (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  play_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  play_count INTEGER NOT NULL DEFAULT 1,

  UNIQUE(player_id, play_date)
);

CREATE INDEX idx_daily_plays_player_date ON daily_plays(player_id, play_date);
```

### Campaign settings table (admin-controlled)

```sql
CREATE TABLE campaign_settings (
  id                 SERIAL PRIMARY KEY,
  campaign_start     TIMESTAMPTZ NOT NULL,
  campaign_end       TIMESTAMPTZ NOT NULL,
  daily_play_limit   INTEGER NOT NULL DEFAULT 3,
  difficulty_base    NUMERIC(4,3) NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO campaign_settings (campaign_start, campaign_end)
VALUES (now(), now() + interval '30 days');
```

### Leaderboard view (daily)

```sql
CREATE VIEW daily_leaderboard AS
SELECT
  p.id          AS player_id,
  p.display_name,
  p.phone,
  MAX(s.total_score) AS best_score,
  MAX(s.goals)       AS best_goals,
  COUNT(s.id)        AS matches_played,
  DATE(s.played_at AT TIME ZONE 'Asia/Dhaka') AS play_date
FROM scores s
JOIN players p ON p.id = s.player_id
WHERE s.is_flagged = false
  AND p.is_blocked = false
GROUP BY p.id, p.display_name, p.phone, DATE(s.played_at AT TIME ZONE 'Asia/Dhaka')
ORDER BY best_score DESC, best_goals DESC;
```

### Leaderboard view (campaign)

```sql
CREATE VIEW campaign_leaderboard AS
SELECT
  p.id          AS player_id,
  p.display_name,
  p.phone,
  MAX(s.total_score) AS best_score,
  MAX(s.goals)       AS best_goals,
  COUNT(s.id)        AS matches_played
FROM scores s
JOIN players p ON p.id = s.player_id
WHERE s.is_flagged = false
  AND p.is_blocked = false
GROUP BY p.id, p.display_name, p.phone
ORDER BY best_score DESC, best_goals DESC;
```

### RLS (Row Level Security)

```sql
-- Enable RLS on all tables
ALTER TABLE players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plays  ENABLE ROW LEVEL SECURITY;

-- Since we use service role key on the backend, all backend access bypasses RLS.
-- No client-side Supabase access from frontend — all goes through Express API.
```

---

## 6. Firebase Phone Auth Integration

Firebase handles SMS OTP on the **frontend**. The backend only **verifies the ID token** Firebase issues after successful OTP verification.

### Flow

```
Frontend                          Firebase               Backend
   │                                 │                      │
   ├─ signInWithPhoneNumber() ───────►│                      │
   │                                 │  sends SMS OTP        │
   ├─ user enters OTP ───────────────►│                      │
   │                                 │  returns ID token     │
   │◄────────────────────────────────│                      │
   │                                                         │
   ├─ POST /api/auth/verify  { idToken } ───────────────────►│
   │                                                         ├─ firebase.verifyIdToken()
   │                                                         ├─ upsert player in Supabase
   │                                                         ├─ sign JWT
   │◄── { jwt, player } ────────────────────────────────────│
```

### `src/config/firebase.ts`

```ts
import admin from "firebase-admin";
import { env } from "./env";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const firebaseAdmin = admin;
```

### `src/config/supabase.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Always use service role key on backend — never anon key
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  },
);
```

### `src/config/redis.ts`

```ts
import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});
```

---

## 7. Express App Entry Point

### `src/index.ts`

```ts
import { createApp } from "./app";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { logger } from "./utils/logger";

async function main() {
  await redis.connect();
  logger.info("Redis connected");

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
```

### `src/app.ts`

```ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.router";
import { playerRouter } from "./modules/player/player.router";
import { scoreRouter } from "./modules/score/score.router";
import { leaderboardRouter } from "./modules/leaderboard/leaderboard.router";
import { adminRouter } from "./modules/admin/admin.router";
import { analyticsRouter } from "./modules/analytics/analytics.router";

export function createApp() {
  const app = express();

  // ── Security ────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    }),
  );

  // ── Parsing ─────────────────────────────────────────────
  app.use(express.json({ limit: "50kb" })); // limit payload size

  // ── Health check ────────────────────────────────────────
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // ── Routes ──────────────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/players", playerRouter);
  app.use("/api/scores", scoreRouter);
  app.use("/api/leaderboard", leaderboardRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/analytics", analyticsRouter);

  // ── 404 ─────────────────────────────────────────────────
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

  // ── Global error handler ─────────────────────────────────
  app.use(errorHandler);

  return app;
}
```

---

## 8. Middleware

### `src/middleware/auth.ts`

```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  playerId?: string;
  phone?: string;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      playerId: string;
      phone: string;
    };
    req.playerId = payload.playerId;
    req.phone = payload.phone;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

### `src/middleware/adminAuth.ts`

```ts
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const secret = req.headers["x-admin-secret"];

  if (secret !== env.ADMIN_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
```

### `src/middleware/rateLimiter.ts`

```ts
import rateLimit from "express-rate-limit";

// OTP verify: 5 attempts per 10 minutes per IP
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP attempts. Try again in 10 minutes." },
});

// Score submit: 1 match per 30 seconds per IP
export const scoreRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
  message: { error: "Please wait before submitting another score." },
});

// General API: 100 requests per minute
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests." },
});
```

### `src/middleware/errorHandler.ts`

```ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  logger.error(err.message, { stack: err.stack });

  res.status(500).json({ error: "Internal server error" });
}
```

### `src/utils/response.ts`

```ts
import { Response } from "express";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, error: message });
}
```

---

## 9. Auth Module

### `src/modules/auth/auth.schema.ts`

```ts
import { z } from "zod";

export const verifyOtpSchema = z.object({
  idToken: z.string().min(10),
  displayName: z.string().min(2).max(30).trim(),
  qrRef: z.string().optional(), // QR campaign source
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
```

### `src/modules/auth/auth.service.ts`

```ts
import jwt from "jsonwebtoken";
import { firebaseAdmin } from "../../config/firebase";
import { supabase } from "../../config/supabase";
import { env } from "../../config/env";
import type { VerifyOtpInput } from "./auth.schema";

export async function verifyFirebaseToken(input: VerifyOtpInput) {
  // 1. Verify Firebase ID token
  const decoded = await firebaseAdmin.auth().verifyIdToken(input.idToken);
  const phone = decoded.phone_number;
  const firebaseUid = decoded.uid;

  if (!phone) throw new Error("No phone number in Firebase token");

  // 2. Upsert player in Supabase
  const { data: player, error } = await supabase
    .from("players")
    .upsert(
      {
        firebase_uid: firebaseUid,
        phone,
        display_name: input.displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "firebase_uid", ignoreDuplicates: false },
    )
    .select("id, phone, display_name, play_count, is_blocked")
    .single();

  if (error) throw error;
  if (player.is_blocked) throw new Error("This account has been blocked.");

  // 3. Sign our own JWT
  const token = jwt.sign(
    { playerId: player.id, phone: player.phone },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  return { token, player };
}
```

### `src/modules/auth/auth.controller.ts`

```ts
import { Request, Response, NextFunction } from "express";
import { verifyOtpSchema } from "./auth.schema";
import { verifyFirebaseToken } from "./auth.service";
import { ok, fail } from "../../utils/response";

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = verifyOtpSchema.parse(req.body);
    const result = await verifyFirebaseToken(input);
    ok(res, result, 201);
  } catch (err: any) {
    if (err.message?.includes("blocked")) {
      fail(res, err.message, 403);
      return;
    }
    next(err);
  }
}
```

### `src/modules/auth/auth.router.ts`

```ts
import { Router } from "express";
import { verifyOtp } from "./auth.controller";
import { otpRateLimiter } from "../../middleware/rateLimiter";

export const authRouter = Router();

authRouter.post("/verify", otpRateLimiter, verifyOtp);
```

---

## 10. Player Module

### `src/modules/player/player.service.ts`

```ts
import { supabase } from "../../config/supabase";
import { env } from "../../config/env";

export async function getPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("id, display_name, phone, play_count, created_at")
    .eq("id", playerId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerDifficulty(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from("players")
    .select("play_count")
    .eq("id", playerId)
    .single();

  if (error) throw error;

  const level = Math.min(data.play_count * 0.08, 1.0);
  return level;
}

export async function getDailyPlaysRemaining(
  playerId: string,
): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_plays")
    .select("play_count")
    .eq("player_id", playerId)
    .eq("play_date", today)
    .maybeSingle();

  if (error) throw error;

  const used = data?.play_count ?? 0;
  return Math.max(0, env.DAILY_PLAY_LIMIT - used);
}
```

### `src/modules/player/player.router.ts`

```ts
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { getMe, getDifficulty, getPlaysRemaining } from "./player.controller";

export const playerRouter = Router();

playerRouter.use(authMiddleware);

playerRouter.get("/me", getMe);
playerRouter.get("/me/difficulty", getDifficulty);
playerRouter.get("/me/plays-remaining", getPlaysRemaining);
```

---

## 11. Score Module & Anti-Cheat

### `src/types/index.ts`

```ts
export interface ShotLog {
  shotIndex: number; // 0–4
  power: number; // 0–1
  timing: number; // 0–1
  directionX: number; // -1 to 1
  result: "goal" | "saved" | "miss";
  points: number;
  durationMs: number; // time taken for this shot in ms
}

export interface SubmitScoreInput {
  totalScore: number;
  goals: number;
  perfectShots: number;
  difficulty: number;
  shotLog: ShotLog[];
  qrRef?: string;
}
```

### `src/modules/score/score.schema.ts`

```ts
import { z } from "zod";

const shotLogSchema = z.object({
  shotIndex: z.number().int().min(0).max(4),
  power: z.number().min(0).max(1),
  timing: z.number().min(0).max(1),
  directionX: z.number().min(-1).max(1),
  result: z.enum(["goal", "saved", "miss"]),
  points: z.number().int().min(0).max(200),
  durationMs: z.number().int().min(500).max(30000),
});

export const submitScoreSchema = z.object({
  totalScore: z.number().int().min(0).max(750),
  goals: z.number().int().min(0).max(5),
  perfectShots: z.number().int().min(0).max(5),
  difficulty: z.number().min(0).max(1),
  shotLog: z.array(shotLogSchema).length(5),
  qrRef: z.string().optional(),
});
```

### `src/modules/score/score.validator.ts` — Anti-cheat

```ts
import type { ShotLog } from "../../types";

const BASE_GOAL_POINTS = 100;
const PERFECT_POINTS = 200;
const MAX_SCORE = 750; // 5 × 150 average max realistic

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateShotLog(
  shotLog: ShotLog[],
  totalScore: number,
  goals: number,
  perfectShots: number,
): ValidationResult {
  // ── 1. Shot count ──────────────────────────────────────
  if (shotLog.length !== 5) {
    return { valid: false, reason: "Shot count mismatch" };
  }

  // ── 2. Recalculate score from shot log ─────────────────
  let recalcScore = 0;
  let recalcGoals = 0;
  let recalcPerfect = 0;

  for (const shot of shotLog) {
    if (shot.result === "goal") {
      recalcGoals++;
      if (shot.timing >= 0.85) {
        recalcPerfect++;
        recalcScore += PERFECT_POINTS;
      } else {
        recalcScore += Math.round(BASE_GOAL_POINTS * (0.6 + shot.timing * 0.4));
      }
    }
    // saved/miss = 0 points
  }

  // Allow ±5 points tolerance for floating point rounding
  if (Math.abs(recalcScore - totalScore) > 5) {
    return {
      valid: false,
      reason: `Score mismatch: got ${totalScore}, expected ~${recalcScore}`,
    };
  }

  if (recalcGoals !== goals) {
    return {
      valid: false,
      reason: `Goals mismatch: got ${goals}, expected ${recalcGoals}`,
    };
  }

  if (recalcPerfect !== perfectShots) {
    return { valid: false, reason: `Perfect shots mismatch` };
  }

  // ── 3. Humanly impossible speed check ─────────────────
  // Each shot must have taken at least 500ms
  const tooFast = shotLog.some((s) => s.durationMs < 500);
  if (tooFast) {
    return { valid: false, reason: "Shots taken too fast (bot suspected)" };
  }

  // ── 4. Total match duration sanity ────────────────────
  const totalMs = shotLog.reduce((sum, s) => sum + s.durationMs, 0);
  if (totalMs < 3000) {
    return { valid: false, reason: "Match completed too quickly" };
  }

  // ── 5. Score ceiling ───────────────────────────────────
  if (totalScore > MAX_SCORE) {
    return { valid: false, reason: "Score exceeds maximum possible" };
  }

  // ── 6. Perfect shot physics check ─────────────────────
  // A perfect shot requires timing ≥ 0.85 and power > 0.3
  for (const shot of shotLog) {
    if (shot.result === "goal" && shot.timing >= 0.85 && shot.power < 0.3) {
      return { valid: false, reason: "Perfect shot with impossible low power" };
    }
  }

  return { valid: true };
}
```

### `src/modules/score/score.service.ts`

```ts
import { supabase } from "../../config/supabase";
import { invalidateLeaderboardCache } from "../leaderboard/leaderboard.service";
import { validateShotLog } from "./score.validator";
import type { SubmitScoreInput } from "../../types";

export async function submitScore(
  playerId: string,
  input: SubmitScoreInput,
): Promise<{ scoreId: string; flagged: boolean }> {
  // ── 1. Anti-cheat validation ───────────────────────────
  const validation = validateShotLog(
    input.shotLog,
    input.totalScore,
    input.goals,
    input.perfectShots,
  );

  const isFlagged = !validation.valid;

  // ── 2. Check daily play limit ──────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const { data: dailyPlay } = await supabase
    .from("daily_plays")
    .select("play_count")
    .eq("player_id", playerId)
    .eq("play_date", today)
    .maybeSingle();

  const currentCount = dailyPlay?.play_count ?? 0;

  // Get campaign settings
  const { data: settings } = await supabase
    .from("campaign_settings")
    .select("daily_play_limit")
    .eq("is_active", true)
    .single();

  const limit = settings?.daily_play_limit ?? 3;

  if (currentCount >= limit) {
    throw new Error(`Daily play limit of ${limit} reached`);
  }

  // ── 3. Save score ──────────────────────────────────────
  const { data: score, error: scoreError } = await supabase
    .from("scores")
    .insert({
      player_id: playerId,
      total_score: isFlagged ? 0 : input.totalScore, // zero out flagged scores
      goals: input.goals,
      perfect_shots: input.perfectShots,
      difficulty: input.difficulty,
      shot_log: input.shotLog,
      is_flagged: isFlagged,
      qr_ref: input.qrRef ?? null,
    })
    .select("id")
    .single();

  if (scoreError) throw scoreError;

  // ── 4. Increment play count ────────────────────────────
  await supabase.rpc("increment_play_count", { p_player_id: playerId });

  // ── 5. Upsert daily play count ─────────────────────────
  await supabase
    .from("daily_plays")
    .upsert(
      { player_id: playerId, play_date: today, play_count: currentCount + 1 },
      { onConflict: "player_id,play_date" },
    );

  // ── 6. Bust leaderboard cache ──────────────────────────
  if (!isFlagged) {
    await invalidateLeaderboardCache();
  }

  return { scoreId: score.id, flagged: isFlagged };
}
```

Add this Supabase RPC function in SQL Editor:

```sql
CREATE OR REPLACE FUNCTION increment_play_count(p_player_id UUID)
RETURNS void AS $$
  UPDATE players
  SET play_count = play_count + 1,
      updated_at = now()
  WHERE id = p_player_id;
$$ LANGUAGE sql;
```

### `src/modules/score/score.router.ts`

```ts
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { scoreRateLimiter } from "../../middleware/rateLimiter";
import { submit } from "./score.controller";

export const scoreRouter = Router();

scoreRouter.post("/", authMiddleware, scoreRateLimiter, submit);
```

---

## 12. Leaderboard Module

### `src/modules/leaderboard/leaderboard.service.ts`

```ts
import { supabase } from "../../config/supabase";
import { redis } from "../../config/redis";

const CACHE_TTL = 60; // seconds

export async function getDailyLeaderboard(date: string, limit = 50) {
  const cacheKey = `leaderboard:daily:${date}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { data, error } = await supabase
    .from("daily_leaderboard")
    .select("player_id, display_name, best_score, best_goals, matches_played")
    .eq("play_date", date)
    .order("best_score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
  return data;
}

export async function getCampaignLeaderboard(limit = 100) {
  const cacheKey = "leaderboard:campaign";
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { data, error } = await supabase
    .from("campaign_leaderboard")
    .select("player_id, display_name, best_score, best_goals, matches_played")
    .order("best_score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
  return data;
}

export async function getPlayerRank(
  playerId: string,
  type: "daily" | "campaign",
  date?: string,
): Promise<number | null> {
  if (type === "daily" && date) {
    const board = await getDailyLeaderboard(date, 1000);
    const idx = board.findIndex((e: any) => e.player_id === playerId);
    return idx === -1 ? null : idx + 1;
  }

  const board = await getCampaignLeaderboard(1000);
  const idx = board.findIndex((e: any) => e.player_id === playerId);
  return idx === -1 ? null : idx + 1;
}

export async function invalidateLeaderboardCache() {
  const today = new Date().toISOString().split("T")[0];
  await redis.del(`leaderboard:daily:${today}`);
  await redis.del("leaderboard:campaign");
}
```

### `src/modules/leaderboard/leaderboard.router.ts`

```ts
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { getDaily, getCampaign, getMyRank } from "./leaderboard.controller";

export const leaderboardRouter = Router();

leaderboardRouter.use(authMiddleware);

leaderboardRouter.get("/daily", getDaily);
leaderboardRouter.get("/campaign", getCampaign);
leaderboardRouter.get("/my-rank", getMyRank);
```

---

## 13. Admin Module

### `src/modules/admin/admin.service.ts`

```ts
import { supabase } from "../../config/supabase";

export async function listPlayers(page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  return { data, total: count };
}

export async function blockPlayer(playerId: string) {
  const { error } = await supabase
    .from("players")
    .update({ is_blocked: true, updated_at: new Date().toISOString() })
    .eq("id", playerId);

  if (error) throw error;
}

export async function unblockPlayer(playerId: string) {
  const { error } = await supabase
    .from("players")
    .update({ is_blocked: false, updated_at: new Date().toISOString() })
    .eq("id", playerId);

  if (error) throw error;
}

export async function flagScore(scoreId: string) {
  const { error } = await supabase
    .from("scores")
    .update({ is_flagged: true })
    .eq("id", scoreId);

  if (error) throw error;
}

export async function getDailyWinners(date: string) {
  const { data, error } = await supabase
    .from("daily_leaderboard")
    .select("player_id, display_name, phone, best_score, best_goals")
    .eq("play_date", date)
    .order("best_score", { ascending: false })
    .limit(10); // top 10 daily winners

  if (error) throw error;
  return data;
}

export async function exportWinnersCSV(date: string): Promise<string> {
  const winners = await getDailyWinners(date);

  const header = "Rank,Name,Phone,Score,Goals\n";
  const rows = winners
    .map(
      (w, i) =>
        `${i + 1},${w.display_name},${w.phone},${w.best_score},${w.best_goals}`,
    )
    .join("\n");

  return header + rows;
}

export async function updateCampaignSettings(settings: {
  campaignStart?: string;
  campaignEnd?: string;
  dailyPlayLimit?: number;
  difficultyBase?: number;
}) {
  const { error } = await supabase
    .from("campaign_settings")
    .update({
      ...(settings.campaignStart && { campaign_start: settings.campaignStart }),
      ...(settings.campaignEnd && { campaign_end: settings.campaignEnd }),
      ...(settings.dailyPlayLimit && {
        daily_play_limit: settings.dailyPlayLimit,
      }),
      ...(settings.difficultyBase && {
        difficulty_base: settings.difficultyBase,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("is_active", true);

  if (error) throw error;
}

export async function getFlaggedScores(page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error } = await supabase
    .from("scores")
    .select(
      `
      id,
      total_score,
      goals,
      is_flagged,
      played_at,
      shot_log,
      players (display_name, phone)
    `,
    )
    .eq("is_flagged", true)
    .order("played_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  return data;
}
```

### `src/modules/admin/admin.router.ts`

```ts
import { Router } from "express";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import {
  listPlayers,
  blockPlayer,
  unblockPlayer,
  getDailyWinners,
  exportWinners,
  updateSettings,
  getFlaggedScores,
} from "./admin.controller";

export const adminRouter = Router();

adminRouter.use(adminAuthMiddleware);

adminRouter.get("/players", listPlayers);
adminRouter.patch("/players/:id/block", blockPlayer);
adminRouter.patch("/players/:id/unblock", unblockPlayer);
adminRouter.get("/winners", getDailyWinners);
adminRouter.get("/winners/export", exportWinners);
adminRouter.get("/scores/flagged", getFlaggedScores);
adminRouter.patch("/settings", updateSettings);
```

---

## 14. Analytics Module

### `src/modules/analytics/analytics.service.ts`

```ts
import { supabase } from "../../config/supabase";

export async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];

  const [totalPlayers, todayScores, flaggedScores, avgScore] =
    await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase
        .from("scores")
        .select("id", { count: "exact", head: true })
        .gte("played_at", `${today}T00:00:00`),
      supabase
        .from("scores")
        .select("id", { count: "exact", head: true })
        .eq("is_flagged", true),
      supabase
        .from("scores")
        .select("total_score")
        .eq("is_flagged", false)
        .then(({ data }) => {
          if (!data?.length) return 0;
          return Math.round(
            data.reduce((s, r) => s + r.total_score, 0) / data.length,
          );
        }),
    ]);

  return {
    totalPlayers: totalPlayers.count ?? 0,
    todayMatches: todayScores.count ?? 0,
    flaggedScores: flaggedScores.count ?? 0,
    avgScore,
  };
}

export async function getScoreDistribution() {
  const { data, error } = await supabase
    .from("scores")
    .select("total_score")
    .eq("is_flagged", false);

  if (error) throw error;

  const buckets: Record<string, number> = {
    "0": 0,
    "1-100": 0,
    "101-200": 0,
    "201-300": 0,
    "301-400": 0,
    "401-500": 0,
    "500+": 0,
  };

  for (const row of data ?? []) {
    const s = row.total_score;
    if (s === 0) buckets["0"]++;
    else if (s <= 100) buckets["1-100"]++;
    else if (s <= 200) buckets["101-200"]++;
    else if (s <= 300) buckets["201-300"]++;
    else if (s <= 400) buckets["301-400"]++;
    else if (s <= 500) buckets["401-500"]++;
    else buckets["500+"]++;
  }

  return buckets;
}
```

### `src/modules/analytics/analytics.router.ts`

```ts
import { Router } from "express";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import { getDashboard, getDistribution } from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.use(adminAuthMiddleware);

analyticsRouter.get("/dashboard", getDashboard);
analyticsRouter.get("/distribution", getDistribution);
```

---

## 15. Redis Caching

### Caching strategy

| Data                 | Cache key                       | TTL | Invalidated when    |
| -------------------- | ------------------------------- | --- | ------------------- |
| Daily leaderboard    | `leaderboard:daily:YYYY-MM-DD`  | 60s | New score submitted |
| Campaign leaderboard | `leaderboard:campaign`          | 60s | New score submitted |
| Player difficulty    | Not cached — read from Supabase | —   | On score submit     |

### Why 60 seconds?

- Leaderboard feels real-time to users
- Protects Supabase from N simultaneous leaderboard reads after a popular peak moment
- Supabase free tier has connection limits — Redis absorbs burst reads

---

## 16. API Reference

### Auth

| Method | Endpoint           | Auth | Body                               | Response            |
| ------ | ------------------ | ---- | ---------------------------------- | ------------------- |
| POST   | `/api/auth/verify` | None | `{ idToken, displayName, qrRef? }` | `{ token, player }` |

### Player

| Method | Endpoint                          | Auth | Response             |
| ------ | --------------------------------- | ---- | -------------------- |
| GET    | `/api/players/me`                 | JWT  | Player profile       |
| GET    | `/api/players/me/difficulty`      | JWT  | `{ level: 0–1 }`     |
| GET    | `/api/players/me/plays-remaining` | JWT  | `{ remaining: 0–3 }` |

### Score

| Method | Endpoint      | Auth | Body                                                                 | Response               |
| ------ | ------------- | ---- | -------------------------------------------------------------------- | ---------------------- |
| POST   | `/api/scores` | JWT  | `{ totalScore, goals, perfectShots, difficulty, shotLog[], qrRef? }` | `{ scoreId, flagged }` |

### Leaderboard

| Method | Endpoint                    | Auth | Query                         | Response          |
| ------ | --------------------------- | ---- | ----------------------------- | ----------------- |
| GET    | `/api/leaderboard/daily`    | JWT  | `?date=YYYY-MM-DD&limit=50`   | Array of entries  |
| GET    | `/api/leaderboard/campaign` | JWT  | `?limit=100`                  | Array of entries  |
| GET    | `/api/leaderboard/my-rank`  | JWT  | `?type=daily&date=YYYY-MM-DD` | `{ rank, score }` |

### Admin (`x-admin-secret` header required)

| Method | Endpoint                         | Query/Body                                       | Response                      |
| ------ | -------------------------------- | ------------------------------------------------ | ----------------------------- |
| GET    | `/api/admin/players`             | `?page=1&limit=50`                               | Paginated players             |
| PATCH  | `/api/admin/players/:id/block`   | —                                                | 200 OK                        |
| PATCH  | `/api/admin/players/:id/unblock` | —                                                | 200 OK                        |
| GET    | `/api/admin/winners`             | `?date=YYYY-MM-DD`                               | Top 10 winners                |
| GET    | `/api/admin/winners/export`      | `?date=YYYY-MM-DD`                               | CSV download                  |
| GET    | `/api/admin/scores/flagged`      | `?page=1`                                        | Flagged scores with shot logs |
| PATCH  | `/api/admin/settings`            | `{ dailyPlayLimit, campaignStart, campaignEnd }` | 200 OK                        |

### Analytics (admin)

| Method | Endpoint                      | Response                                                  |
| ------ | ----------------------------- | --------------------------------------------------------- |
| GET    | `/api/analytics/dashboard`    | `{ totalPlayers, todayMatches, flaggedScores, avgScore }` |
| GET    | `/api/analytics/distribution` | Score bucket distribution                                 |

---

## 17. Frontend Integration Points

These are the exact files to update in the Next.js project:

### 1. Auth — add before `/menu`

Create `src/app/auth/page.tsx`:

- Render Firebase UI or custom phone input + OTP input
- On Firebase `signInWithPhoneNumber` success → get `idToken`
- Call `POST /api/auth/verify` → receive JWT
- Store JWT in `useGameStore` (add `token` field)
- Navigate to `/menu`

### 2. API client utility

Create `src/utils/api.ts`:

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiCall<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "API error");
  }

  return res.json();
}
```

### 3. Score submission — `src/utils/storage.ts`

Replace `saveToLeaderboard()`:

```ts
// Before (localStorage only)
export function saveToLeaderboard(entry) { ... }

// After (API call)
export async function saveToLeaderboard(entry, token: string) {
  return apiCall('/api/scores', {
    method: 'POST',
    body: JSON.stringify(entry),
  }, token)
}
```

### 4. Leaderboard page — `src/app/leaderboard/page.tsx`

Replace `getLeaderboard()` calls with:

```ts
const daily = await apiCall("/api/leaderboard/daily?date=TODAY", {}, token);
const campaign = await apiCall("/api/leaderboard/campaign", {}, token);
```

### 5. Difficulty — `src/game/systems/DifficultyManager.ts`

Replace constructor localStorage read with API call (call before Phaser boots):

```ts
// In PhaserGame.tsx, before new Phaser.Game():
const { data } = await apiCall("/api/players/me/difficulty", {}, token);
game.registry.set("difficultyLevel", data.level);
```

### 6. Add `NEXT_PUBLIC_API_URL` to `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 18. Deployment

### Backend — Railway (recommended for BD latency)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

Set all env vars in Railway dashboard under **Variables**.

### Alternatively — Render

- New Web Service → connect GitHub repo
- Build command: `npm run build`
- Start command: `npm start`
- Add env vars in Render dashboard

### Redis — Upstash (serverless Redis, free tier)

1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database → copy `REDIS_URL`
3. Paste into Railway/Render env vars

### Frontend — Vercel

```bash
vercel --prod
```

Add `NEXT_PUBLIC_API_URL=https://your-api.railway.app` in Vercel environment variables.

### CORS — update after deploy

```ts
// src/app.ts
app.use(
  cors({
    origin: "https://your-game.vercel.app", // production URL
  }),
);
```

---

## 19. Testing Checklist

### Auth

- [ ] `POST /api/auth/verify` with valid Firebase ID token returns JWT + player
- [ ] `POST /api/auth/verify` with invalid token returns 401
- [ ] Blocked player gets 403 on verify
- [ ] New player created in Supabase on first login
- [ ] Existing player updated (not duplicated) on repeat login

### Score submission

- [ ] Valid score saves to Supabase and returns `scoreId`
- [ ] Manipulated `totalScore` (doesn't match shot log) returns `flagged: true`
- [ ] Shot taken in < 500ms gets flagged
- [ ] Score > 750 gets rejected by Zod schema
- [ ] 4th submission on same day returns 400 (daily limit)
- [ ] Rate limiter blocks 2nd submit within 30 seconds

### Leaderboard

- [ ] Daily leaderboard filters by today's date correctly
- [ ] Campaign leaderboard shows all-time best scores
- [ ] Redis cache hit on second request within 60s
- [ ] Cache invalidates after new score submitted
- [ ] Flagged scores excluded from leaderboard
- [ ] Blocked players excluded from leaderboard

### Admin

- [ ] `x-admin-secret` missing returns 403
- [ ] Block player → player's verify returns 403
- [ ] Winners export returns valid CSV with correct columns
- [ ] Flagged scores list shows shot log data
- [ ] Campaign settings update reflects in daily play limit

### Anti-cheat

- [ ] Score mismatch between `totalScore` and recalculated from `shotLog` → flagged
- [ ] Perfect shot with power < 0.3 → flagged
- [ ] All 5 shots in < 3 seconds total → flagged
- [ ] Flagged score saved with `total_score = 0` in DB

---

## 20. Build Order

| Day    | Task                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| **1**  | Project init, `tsconfig`, folder structure, env validation, Supabase schema, `app.ts` skeleton |
| **2**  | Firebase Admin config, `POST /api/auth/verify`, JWT signing, Supabase player upsert            |
| **3**  | Player module (`/me`, `/difficulty`, `/plays-remaining`)                                       |
| **4**  | Score schema (Zod), anti-cheat validator, `POST /api/scores` with daily limit check            |
| **5**  | Leaderboard module, Redis caching, daily + campaign endpoints                                  |
| **6**  | Admin module (block/unblock, winners, export CSV, settings)                                    |
| **7**  | Analytics module, error handler polish, rate limiters                                          |
| **8**  | Frontend integration (API client util, swap localStorage calls, auth page)                     |
| **9**  | Deploy backend to Railway, Redis to Upstash, frontend to Vercel, CORS update                   |
| **10** | End-to-end test on real device, anti-cheat tuning, load test leaderboard                       |
