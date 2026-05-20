# ⚽ Football Game API

A robust Node.js and Express backend for the Football Game, featuring anti-cheat validation, real-time leaderboards with Redis caching, and comprehensive admin management.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Firebase Phone Auth (Player) & Custom JWT (Admin)
- **Caching:** Redis (Leaderboard)
- **Language:** TypeScript
- **Documentation:** Swagger/OpenAPI

## ✨ Features

- **Anti-Cheat System:** Validates shot logs (power, timing, duration) to ensure scores are legitimate.
- **Daily Play Limits:** Restricts players to a configurable number of matches per day.
- **Leaderboards:** Daily and all-time campaign leaderboards cached in Redis for high performance.
- **Admin Panel API:** Manage players (block/unblock), export winners, and adjust campaign settings.
- **QR Tracking:** Tracks entries from different QR campaign sources.
- **Rate Limiting:** Protects sensitive endpoints (OTP verify, score submission).

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v18+)
- Redis instance
- Supabase project
- Firebase project (for Phone Auth)

### 1. Clone & Install

```bash
cd football-game-api
npm install
```

### 2. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key variables to configure:
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `REDIS_URL`
- `DEFAULT_ADMIN_EMAIL` & `DEFAULT_ADMIN_PASSWORD` (for seeding the admin)

### 3. Database Schema

Run the SQL found in `supabase/schema.sql` in your Supabase SQL Editor. 
**Important:** Ensure the `admins` table is created for the backend to bootstrap successfully.

### 4. Run the Server

```bash
# Development
npm run dev

# Build & Production
npm run build
npm start
```

The API will be available at `http://localhost:4000`.
Documentation is available at `http://localhost:4000/docs`.

## 📖 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/verify` | Verify Firebase token & login |
| GET | `/api/v1/players/me` | Get current player profile |
| POST | `/api/v1/scores` | Submit match score (Anti-cheat) |
| GET | `/api/v1/leaderboard/daily` | Get today's top players |
| POST | `/api/v1/admin/auth/login` | Admin login |

## 🧪 Testing

Ensure all tests pass before deployment:
- Verify Firebase ID token integration.
- Test anti-cheat logic with manipulated payloads.
- Check daily play limit enforcement.
- Validate Redis cache invalidation on score submission.
