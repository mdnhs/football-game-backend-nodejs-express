-- ============================================================
-- RBAC migration: roles table, admin role FK, default seeds
-- Idempotent — safe to re-run.
-- ============================================================

-- ── roles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT UNIQUE NOT NULL,
  description     TEXT,
  permissions     TEXT[] NOT NULL DEFAULT '{}',
  is_system_role  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ── admins: link to roles, drop old enum constraint ────────
ALTER TABLE admins DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);

-- ── Seed default roles ─────────────────────────────────────
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
  (
    'super_admin',
    'Full access including RBAC management',
    ARRAY[
      'admin.dashboard.view',
      'admin.player.view_list','admin.player.edit','admin.player.disable',
      'admin.score.view_list','admin.score.flag',
      'admin.winner.view_list','admin.winner.declare',
      'admin.qr.view_list','admin.qr.create',
      'admin.settings.view','admin.settings.edit',
      'admin.rbac.view','admin.rbac.manage',
      'admin.admin.view_list','admin.admin.create','admin.admin.edit','admin.admin.delete'
    ],
    true
  ),
  (
    'admin',
    'Standard operations admin',
    ARRAY[
      'admin.dashboard.view',
      'admin.player.view_list','admin.player.edit','admin.player.disable',
      'admin.score.view_list','admin.score.flag',
      'admin.winner.view_list','admin.winner.declare',
      'admin.qr.view_list','admin.qr.create',
      'admin.settings.view','admin.settings.edit'
    ],
    true
  ),
  (
    'moderator',
    'Player + score moderation only',
    ARRAY[
      'admin.dashboard.view',
      'admin.player.view_list','admin.player.disable',
      'admin.score.view_list','admin.score.flag'
    ],
    true
  ),
  (
    'viewer',
    'Read-only dashboard access',
    ARRAY[
      'admin.dashboard.view',
      'admin.player.view_list',
      'admin.score.view_list',
      'admin.winner.view_list',
      'admin.qr.view_list',
      'admin.settings.view'
    ],
    true
  )
ON CONFLICT (name) DO UPDATE
  SET permissions = EXCLUDED.permissions,
      description = EXCLUDED.description,
      is_system_role = EXCLUDED.is_system_role,
      updated_at = now();

-- ── Backfill role_id on existing admins ────────────────────
UPDATE admins a
SET role_id = r.id
FROM roles r
WHERE a.role_id IS NULL
  AND r.name = COALESCE(NULLIF(a.role, ''), 'admin');

-- Default any remaining nulls to 'admin'
UPDATE admins a
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE a.role_id IS NULL;

ALTER TABLE admins ALTER COLUMN role_id SET NOT NULL;

-- Keep the legacy `role` text column for back-compat reads but stop validating it.
-- (Drop once all callers migrate.)
