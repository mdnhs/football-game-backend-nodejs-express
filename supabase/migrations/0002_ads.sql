-- ============================================================
-- Ads feature: ads table + ad permissions on existing roles
-- Idempotent — safe to re-run.
-- ============================================================

-- ── ads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  kind          TEXT NOT NULL,
  media_type    TEXT,
  media_url     TEXT,
  click_url     TEXT,
  caption       TEXT,
  slides        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_ad_kind        CHECK (kind IN ('single', 'carousel')),
  CONSTRAINT valid_ad_media_type  CHECK (media_type IS NULL OR media_type IN ('image', 'video')),
  CONSTRAINT single_has_media     CHECK (
    kind <> 'single' OR (media_url IS NOT NULL AND media_type IS NOT NULL)
  ),
  CONSTRAINT carousel_has_slides  CHECK (
    kind <> 'carousel' OR jsonb_array_length(slides) >= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_ads_is_active     ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_display_order ON ads(display_order);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- ── Grant ad perms to existing roles ───────────────────────
UPDATE roles
SET permissions = permissions || ARRAY[
      'admin.ad.view_list',
      'admin.ad.create',
      'admin.ad.edit',
      'admin.ad.delete'
    ],
    updated_at = now()
WHERE name = 'super_admin'
  AND NOT (permissions @> ARRAY['admin.ad.view_list']);

UPDATE roles
SET permissions = permissions || ARRAY[
      'admin.ad.view_list',
      'admin.ad.create',
      'admin.ad.edit',
      'admin.ad.delete'
    ],
    updated_at = now()
WHERE name = 'admin'
  AND NOT (permissions @> ARRAY['admin.ad.view_list']);

UPDATE roles
SET permissions = permissions || ARRAY['admin.ad.view_list'],
    updated_at = now()
WHERE name = 'viewer'
  AND NOT (permissions @> ARRAY['admin.ad.view_list']);
