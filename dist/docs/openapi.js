"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openapiSpec = void 0;
const env_1 = require("../config/env");
exports.openapiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Football Game API",
        version: "1.0.0",
        description: "Backend API for the football penalty-shootout campaign game. " +
            "All versioned endpoints live under `/api/v1`. Unversioned routes (`/health`, `/qr/{ref}`) are infrastructure. " +
            "Auth flow: Firebase Phone OTP on client → exchange Firebase ID token for app JWT at `/api/v1/auth/verify-otp`.",
    },
    servers: [
        {
            url: `http://localhost:${env_1.env.PORT}`,
            description: "Local dev (root)",
        },
    ],
    tags: [
        { name: "Auth" },
        { name: "Player" },
        { name: "Score" },
        { name: "Leaderboard" },
        { name: "Admin" },
        { name: "QR" },
        { name: "Analytics" },
        { name: "Health" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "App JWT issued by POST /api/auth/verify",
            },
            adminSecret: {
                type: "apiKey",
                in: "header",
                name: "x-admin-secret",
                description: "Admin panel shared secret",
            },
        },
        schemas: {
            SuccessEnvelope: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {},
                },
            },
            ErrorEnvelope: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    error: { type: "string" },
                },
            },
            Player: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    phone: { type: "string", example: "+8801XXXXXXXXX" },
                    display_name: { type: "string" },
                    play_count: { type: "integer" },
                    is_blocked: { type: "boolean" },
                    created_at: { type: "string", format: "date-time" },
                },
            },
            ShotLogEntry: {
                type: "object",
                required: [
                    "shotIndex",
                    "power",
                    "timing",
                    "directionX",
                    "result",
                    "points",
                    "durationMs",
                ],
                properties: {
                    shotIndex: { type: "integer", minimum: 0, maximum: 4 },
                    power: { type: "number", minimum: 0, maximum: 1 },
                    timing: { type: "number", minimum: 0, maximum: 1 },
                    directionX: { type: "number", minimum: -1, maximum: 1 },
                    result: { type: "string", enum: ["goal", "saved", "miss"] },
                    points: { type: "integer", minimum: 0, maximum: 200 },
                    durationMs: { type: "integer", minimum: 500, maximum: 30000 },
                },
            },
            CheckPhoneBody: {
                type: "object",
                required: ["phone"],
                properties: {
                    phone: {
                        type: "string",
                        example: "+8801712345678",
                        description: "E.164 phone number",
                    },
                },
            },
            VerifyOtpBody: {
                type: "object",
                required: ["idToken"],
                properties: {
                    idToken: {
                        type: "string",
                        minLength: 10,
                        description: "Firebase ID token from client-side phone OTP",
                    },
                    qrRef: { type: "string", description: "QR campaign source" },
                },
            },
            CompleteProfileBody: {
                type: "object",
                required: ["displayName"],
                properties: {
                    displayName: { type: "string", minLength: 2, maxLength: 30 },
                },
            },
            SubmitScoreBody: {
                type: "object",
                required: [
                    "totalScore",
                    "goals",
                    "perfectShots",
                    "difficulty",
                    "shotLog",
                ],
                properties: {
                    totalScore: { type: "integer", minimum: 0, maximum: 750 },
                    goals: { type: "integer", minimum: 0, maximum: 5 },
                    perfectShots: { type: "integer", minimum: 0, maximum: 5 },
                    difficulty: { type: "number", minimum: 0, maximum: 1 },
                    shotLog: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ShotLogEntry" },
                        minItems: 5,
                        maxItems: 5,
                    },
                    qrRef: { type: "string" },
                },
            },
            LeaderboardEntry: {
                type: "object",
                properties: {
                    player_id: { type: "string", format: "uuid" },
                    display_name: { type: "string" },
                    best_score: { type: "integer" },
                    best_goals: { type: "integer" },
                    matches_played: { type: "integer" },
                },
            },
            QrCode: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    ref: { type: "string", example: "AB12CD34" },
                    label: { type: "string" },
                    target_path: { type: "string", example: "/" },
                    scan_count: { type: "integer" },
                    is_active: { type: "boolean" },
                    created_at: { type: "string", format: "date-time" },
                    url: {
                        type: "string",
                        description: "Full frontend URL with ?ref=... (what to encode in the QR image)",
                    },
                },
            },
            CreateQrBody: {
                type: "object",
                required: ["label"],
                properties: {
                    label: { type: "string", minLength: 1, maxLength: 80 },
                    targetPath: {
                        type: "string",
                        description: "Path on frontend (default /)",
                    },
                    ref: {
                        type: "string",
                        description: "Optional custom ref slug; auto-generated if omitted",
                    },
                },
            },
            CampaignSettingsBody: {
                type: "object",
                properties: {
                    campaignStart: { type: "string", format: "date-time" },
                    campaignEnd: { type: "string", format: "date-time" },
                    dailyPlayLimit: { type: "integer", minimum: 1, maximum: 100 },
                    difficultyBase: { type: "number", minimum: 0, maximum: 1 },
                },
            },
        },
        responses: {
            Unauthorized: {
                description: "Missing or invalid JWT",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorEnvelope" },
                    },
                },
            },
            Forbidden: {
                description: "Admin secret missing or blocked account",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorEnvelope" },
                    },
                },
            },
            ValidationError: {
                description: "Zod validation error",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorEnvelope" },
                    },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Health check",
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { status: { type: "string", example: "ok" } },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/auth/check-phone": {
            post: {
                tags: ["Auth"],
                summary: "Check if a phone is registered (UX hint)",
                description: "Step 3 (after phone input). Tells frontend whether to show a login or sign-up label after OTP.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CheckPhoneBody" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Lookup result",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                exists: { type: "boolean" },
                                                displayName: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/ValidationError" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/auth/verify-otp": {
            post: {
                tags: ["Auth"],
                summary: "Exchange Firebase ID token for app JWT",
                description: "Step 4. If `isNew=true`, the returned token is a **pending** token (30m TTL) — frontend must call `/api/v1/auth/complete-profile` next. If `isNew=false`, the token is a full JWT.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/VerifyOtpBody" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Token + isNew flag (+ player if existing)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                token: { type: "string" },
                                                isNew: { type: "boolean" },
                                                player: {
                                                    oneOf: [
                                                        { $ref: "#/components/schemas/Player" },
                                                        { type: "null" },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/ValidationError" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/auth/complete-profile": {
            post: {
                tags: ["Auth"],
                summary: "Set displayName for new account (or update existing)",
                description: "Step 5. Accepts the pending token from `/verify-otp` (or a full JWT to rename). Returns a fresh full JWT + player.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CompleteProfileBody" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Full JWT + player",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                token: { type: "string" },
                                                player: { $ref: "#/components/schemas/Player" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/ValidationError" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/players/me": {
            get: {
                tags: ["Player"],
                summary: "Current player profile",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Player profile",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Player" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/players/me/difficulty": {
            get: {
                tags: ["Player"],
                summary: "Current adaptive difficulty level (0–1)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Difficulty",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                level: { type: "number", minimum: 0, maximum: 1 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/players/me/plays-remaining": {
            get: {
                tags: ["Player"],
                summary: "Plays remaining today",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Remaining plays",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                remaining: { type: "integer", minimum: 0 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/scores": {
            post: {
                tags: ["Score"],
                summary: "Submit a match score (anti-cheat validated)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubmitScoreBody" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Score saved",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                scoreId: { type: "string", format: "uuid" },
                                                flagged: { type: "boolean" },
                                                reason: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/ValidationError" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "429": { description: "Rate-limited (1 submit per 30s)" },
                },
            },
        },
        "/api/v1/leaderboard/daily": {
            get: {
                tags: ["Leaderboard"],
                summary: "Daily leaderboard",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "date",
                        in: "query",
                        schema: { type: "string", format: "date" },
                        description: "YYYY-MM-DD (defaults to today)",
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 50, maximum: 200 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Daily entries",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/LeaderboardEntry" },
                                },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/leaderboard/campaign": {
            get: {
                tags: ["Leaderboard"],
                summary: "Campaign leaderboard",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 100, maximum: 500 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Campaign entries",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/LeaderboardEntry" },
                                },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/leaderboard/my-rank": {
            get: {
                tags: ["Leaderboard"],
                summary: "Current player's rank",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "type",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["daily", "campaign"],
                            default: "campaign",
                        },
                    },
                    {
                        name: "date",
                        in: "query",
                        schema: { type: "string", format: "date" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Rank",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                rank: { type: "integer", nullable: true },
                                                score: { type: "integer", nullable: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/admin/players": {
            get: {
                tags: ["Admin"],
                summary: "List players (paginated)",
                security: [{ adminSecret: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 50, maximum: 200 },
                    },
                ],
                responses: {
                    "200": { description: "Paginated players" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/players/{id}/block": {
            patch: {
                tags: ["Admin"],
                summary: "Block a player",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": { description: "Blocked" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/players/{id}/unblock": {
            patch: {
                tags: ["Admin"],
                summary: "Unblock a player",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": { description: "Unblocked" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/scores/{id}/flag": {
            patch: {
                tags: ["Admin"],
                summary: "Manually flag a score (zeros it out)",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": { description: "Flagged" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/winners": {
            get: {
                tags: ["Admin"],
                summary: "Top 10 daily winners",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "date",
                        in: "query",
                        schema: { type: "string", format: "date" },
                    },
                ],
                responses: {
                    "200": { description: "Winners" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/winners/export": {
            get: {
                tags: ["Admin"],
                summary: "Export winners as CSV",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "date",
                        in: "query",
                        schema: { type: "string", format: "date" },
                    },
                ],
                responses: {
                    "200": {
                        description: "CSV file",
                        content: { "text/csv": { schema: { type: "string" } } },
                    },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/scores/flagged": {
            get: {
                tags: ["Admin"],
                summary: "List flagged scores with shot logs",
                security: [{ adminSecret: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 50 },
                    },
                ],
                responses: {
                    "200": { description: "Flagged scores" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/settings": {
            patch: {
                tags: ["Admin"],
                summary: "Update campaign settings",
                security: [{ adminSecret: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CampaignSettingsBody" },
                        },
                    },
                },
                responses: {
                    "200": { description: "Updated" },
                    "400": { $ref: "#/components/responses/ValidationError" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/qr/{ref}": {
            get: {
                tags: ["QR"],
                summary: "Public scan endpoint — 302 redirect to frontend",
                description: "Embed this URL in the printed QR image. Increments scan_count, then redirects to FRONTEND_URL + target_path + ?ref=<ref>.",
                parameters: [
                    {
                        name: "ref",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "302": { description: "Redirect to frontend" },
                    "404": { description: "QR not found or inactive" },
                },
            },
        },
        "/api/v1/admin/qr-codes": {
            post: {
                tags: ["QR"],
                summary: "Create a QR code",
                security: [{ adminSecret: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateQrBody" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "QR created",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: { $ref: "#/components/schemas/QrCode" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/ValidationError" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "409": { description: "ref already exists" },
                },
            },
            get: {
                tags: ["QR"],
                summary: "List QR codes",
                security: [{ adminSecret: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 50, maximum: 200 },
                    },
                ],
                responses: {
                    "200": { description: "Paginated QR codes" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/qr-codes/{id}/stats": {
            get: {
                tags: ["QR"],
                summary: "QR code stats (scans + signups)",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": { description: "Stats" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/qr-codes/{id}/deactivate": {
            patch: {
                tags: ["QR"],
                summary: "Deactivate QR (404 on scan)",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": { description: "Deactivated" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/admin/qr-codes/{id}/activate": {
            patch: {
                tags: ["QR"],
                summary: "Reactivate QR",
                security: [{ adminSecret: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": { description: "Activated" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/analytics/dashboard": {
            get: {
                tags: ["Analytics"],
                summary: "Admin dashboard stats",
                security: [{ adminSecret: [] }],
                responses: {
                    "200": {
                        description: "Stats",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                totalPlayers: { type: "integer" },
                                                todayMatches: { type: "integer" },
                                                flaggedScores: { type: "integer" },
                                                avgScore: { type: "integer" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/analytics/distribution": {
            get: {
                tags: ["Analytics"],
                summary: "Score bucket distribution",
                security: [{ adminSecret: [] }],
                responses: {
                    "200": { description: "Buckets" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
    },
};
