import { env } from "../config/env";

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Football Game API",
    version: "1.0.0",
    description:
      "Backend API for the football penalty-shootout campaign game. " +
      "All versioned endpoints live under `/api/v1`. Unversioned routes (`/health`, `/qr/{ref}`) are infrastructure. " +
      "Auth flow: Firebase Phone OTP on client → exchange Firebase ID token for app JWT at `/api/v1/auth/verify-otp`.",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Local dev (root)",
    },
  ],
  tags: [
    { name: "Auth" },
    { name: "AdminAuth" },
    { name: "Player" },
    { name: "Score" },
    { name: "Leaderboard" },
    { name: "Admin" },
    { name: "RBAC" },
    { name: "Ads" },
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
      adminBearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Admin JWT issued by POST /api/v1/admin/auth/login",
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
            description:
              "Full frontend URL with ?ref=... (what to encode in the QR image)",
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
      AdminLoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
      AdminSession: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string", description: "Role name (e.g. super_admin, admin, moderator, viewer)" },
          roleId: { type: "string", format: "uuid" },
          permissions: { type: "array", items: { type: "string" } },
        },
      },
      UpdateMeBody: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ChangePasswordBody: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", minLength: 1 },
          newPassword: { type: "string", minLength: 8 },
        },
      },

      // ── RBAC ─────────────────────────────────────────────
      Role: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "moderator" },
          description: { type: "string", nullable: true },
          permissions: { type: "array", items: { type: "string" } },
          is_system_role: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CreateRoleBody: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            pattern: "^[a-z0-9_]+$",
            description: "Lowercase letters, digits, underscores",
          },
          description: { type: "string", maxLength: 255 },
          permissions: { type: "array", items: { type: "string" } },
        },
      },
      UpdateRoleBody: {
        type: "object",
        properties: {
          description: { type: "string", maxLength: 255 },
          permissions: { type: "array", items: { type: "string" } },
        },
      },
      AdminUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string" },
          role_id: { type: "string", format: "uuid" },
          is_active: { type: "boolean" },
          last_login_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      CreateAdminBody: {
        type: "object",
        required: ["email", "password", "roleId"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          roleId: { type: "string", format: "uuid" },
        },
      },
      UpdateAdminBody: {
        type: "object",
        description: "Partial update. At least one field required.",
        properties: {
          email: { type: "string", format: "email" },
          roleId: { type: "string", format: "uuid" },
          isActive: { type: "boolean" },
          password: { type: "string", minLength: 8 },
        },
      },

      // ── Ads ──────────────────────────────────────────────
      AdSlide: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", format: "uri" },
          caption: { type: "string", maxLength: 200 },
          clickUrl: { type: "string", format: "uri" },
        },
      },
      Ad: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          kind: { type: "string", enum: ["single", "carousel"] },
          media_type: { type: "string", enum: ["image", "video"], nullable: true },
          media_url: { type: "string", format: "uri", nullable: true },
          click_url: { type: "string", format: "uri", nullable: true },
          caption: { type: "string", nullable: true },
          slides: { type: "array", items: { $ref: "#/components/schemas/AdSlide" } },
          is_active: { type: "boolean" },
          display_order: { type: "integer", minimum: 0 },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CreateSingleAdBody: {
        type: "object",
        required: ["kind", "title", "mediaType", "mediaUrl"],
        properties: {
          kind: { type: "string", enum: ["single"] },
          title: { type: "string", minLength: 1, maxLength: 120 },
          mediaType: { type: "string", enum: ["image", "video"] },
          mediaUrl: { type: "string", format: "uri" },
          caption: { type: "string", maxLength: 200 },
          clickUrl: { type: "string", format: "uri" },
          isActive: { type: "boolean", default: true },
          displayOrder: { type: "integer", minimum: 0, default: 0 },
        },
      },
      CreateCarouselAdBody: {
        type: "object",
        required: ["kind", "title", "slides"],
        properties: {
          kind: { type: "string", enum: ["carousel"] },
          title: { type: "string", minLength: 1, maxLength: 120 },
          slides: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: { $ref: "#/components/schemas/AdSlide" },
          },
          caption: { type: "string", maxLength: 200 },
          clickUrl: { type: "string", format: "uri" },
          isActive: { type: "boolean", default: true },
          displayOrder: { type: "integer", minimum: 0, default: 0 },
        },
      },
      CreateAdBody: {
        oneOf: [
          { $ref: "#/components/schemas/CreateSingleAdBody" },
          { $ref: "#/components/schemas/CreateCarouselAdBody" },
        ],
        discriminator: {
          propertyName: "kind",
          mapping: {
            single: "#/components/schemas/CreateSingleAdBody",
            carousel: "#/components/schemas/CreateCarouselAdBody",
          },
        },
      },
      UpdateAdBody: {
        type: "object",
        description: "Partial update. kind cannot change.",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 120 },
          caption: { type: "string", maxLength: 200 },
          clickUrl: { type: "string", format: "uri" },
          mediaType: { type: "string", enum: ["image", "video"], description: "single ads only" },
          mediaUrl: { type: "string", format: "uri", description: "single ads only" },
          slides: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: { $ref: "#/components/schemas/AdSlide" },
            description: "carousel ads only",
          },
          isActive: { type: "boolean" },
          displayOrder: { type: "integer", minimum: 0 },
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
        description: "Missing permission or blocked account",
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

    "/api/v1/admin/auth/login": {
      post: {
        tags: ["AdminAuth"],
        summary: "Admin login (email + password)",
        description:
          "Issues an admin JWT (12h TTL by default). Returns admin id, email, role and permission list. Use the token as `Authorization: Bearer <token>` against all `/api/v1/admin/*` endpoints.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminLoginBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Token + admin session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string" },
                        admin: { $ref: "#/components/schemas/AdminSession" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { description: "Invalid email or password" },
          "403": { description: "Account disabled" },
        },
      },
    },
    "/api/v1/admin/auth/me": {
      get: {
        tags: ["AdminAuth"],
        summary: "Current admin session",
        security: [{ adminBearerAuth: [] }],
        responses: {
          "200": {
            description: "Admin profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminSession" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["AdminAuth"],
        summary: "Update own email (forces re-login)",
        security: [{ adminBearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMeBody" },
            },
          },
        },
        responses: {
          "200": { description: "Updated profile" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/api/v1/admin/auth/change-password": {
      post: {
        tags: ["AdminAuth"],
        summary: "Change own password (forces re-login)",
        security: [{ adminBearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordBody" },
            },
          },
        },
        responses: {
          "200": { description: "Password changed" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { description: "Current password incorrect or unauthorized" },
        },
      },
    },

    // ── RBAC ────────────────────────────────────────────────
    "/api/v1/admin/rbac/permissions": {
      get: {
        tags: ["RBAC"],
        summary: "List all available permission strings",
        security: [{ adminBearerAuth: [] }],
        responses: {
          "200": {
            description: "Permission catalog",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "string" } },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/v1/admin/rbac/roles": {
      get: {
        tags: ["RBAC"],
        summary: "List roles",
        security: [{ adminBearerAuth: [] }],
        responses: {
          "200": {
            description: "Roles",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Role" } },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["RBAC"],
        summary: "Create role",
        security: [{ adminBearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRoleBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created role",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Role" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": { description: "Role name already exists" },
        },
      },
    },
    "/api/v1/admin/rbac/roles/{id}": {
      patch: {
        tags: ["RBAC"],
        summary: "Update role (system roles cannot edit permissions)",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRoleBody" },
            },
          },
        },
        responses: {
          "200": { description: "Updated role" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { description: "Forbidden or system role permissions locked" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["RBAC"],
        summary: "Delete role (must have no assigned admins; system roles protected)",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "403": { description: "System role cannot be deleted" },
          "409": { description: "Role assigned to admins" },
        },
      },
    },
    "/api/v1/admin/rbac/admins": {
      get: {
        tags: ["RBAC"],
        summary: "List admin users",
        security: [{ adminBearerAuth: [] }],
        responses: {
          "200": {
            description: "Admins",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["RBAC"],
        summary: "Create admin user",
        security: [{ adminBearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAdminBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created admin",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AdminUser" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/api/v1/admin/rbac/admins/{id}": {
      patch: {
        tags: ["RBAC"],
        summary: "Update admin (email, role, active flag, password). Cannot self-deactivate.",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateAdminBody" },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "400": { description: "Validation or self-deactivation blocked" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": { description: "Email already in use" },
        },
      },
      delete: {
        tags: ["RBAC"],
        summary: "Delete admin. Cannot delete self.",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "400": { description: "Cannot delete self" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ── Ads ─────────────────────────────────────────────────
    "/api/v1/ads": {
      get: {
        tags: ["Ads"],
        summary: "Public list of active ads (no auth)",
        responses: {
          "200": {
            description: "Active ads ordered by display_order asc",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Ad" } },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/ads": {
      get: {
        tags: ["Ads"],
        summary: "Admin list (all ads incl. inactive)",
        security: [{ adminBearerAuth: [] }],
        responses: {
          "200": {
            description: "Ads",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Ad" } },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Ads"],
        summary: "Create ad (single or carousel)",
        security: [{ adminBearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAdBody" },
              examples: {
                single: {
                  summary: "Single image ad",
                  value: {
                    kind: "single",
                    title: "Promo banner",
                    mediaType: "image",
                    mediaUrl: "https://cdn.example/banner.jpg",
                    clickUrl: "https://shop.example",
                    caption: "Limited time offer",
                    isActive: true,
                    displayOrder: 0,
                  },
                },
                carousel: {
                  summary: "Image carousel",
                  value: {
                    kind: "carousel",
                    title: "Holiday set",
                    slides: [
                      { url: "https://cdn.example/1.jpg", caption: "Day 1" },
                      { url: "https://cdn.example/2.jpg", clickUrl: "https://buy.example" },
                    ],
                    displayOrder: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Created ad",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Ad" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/v1/admin/ads/{id}": {
      get: {
        tags: ["Ads"],
        summary: "Get one ad",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Ad",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Ad" } },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Ads"],
        summary: "Update ad (kind-locked)",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateAdBody" },
            },
          },
        },
        responses: {
          "200": { description: "Updated ad" },
          "400": { description: "Validation or kind/field mismatch" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Ads"],
        summary: "Delete ad",
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/v1/auth/check-phone": {
      post: {
        tags: ["Auth"],
        summary: "Check if a phone is registered (UX hint)",
        description:
          "Step 3 (after phone input). Tells frontend whether to show a login or sign-up label after OTP.",
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
        description:
          "Step 4. If `isNew=true`, the returned token is a **pending** token (30m TTL) — frontend must call `/api/v1/auth/complete-profile` next. If `isNew=false`, the token is a full JWT.",
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
        description:
          "Step 5. Accepts the pending token from `/verify-otp` (or a full JWT to rename). Returns a fresh full JWT + player.",
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        description:
          "Embed this URL in the printed QR image. Increments scan_count, then redirects to FRONTEND_URL + target_path + ?ref=<ref>.",
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
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
        security: [{ adminBearerAuth: [] }],
        responses: {
          "200": { description: "Buckets" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
};
