-- ============================================================
-- Football Game — Supabase schema
-- Run in Supabase SQL Editor top-to-bottom.
-- ============================================================

-- ── Players ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  firebase_uid  TEXT UNIQUE NOT NULL,
  play_count    INTEGER NOT NULL DEFAULT 0,
  is_blocked    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_phone        ON players(phone);
CREATE INDEX IF NOT EXISTS idx_players_firebase_uid ON players(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_players_is_blocked   ON players(is_blocked);

-- ── Scores ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  total_score   INTEGER NOT NULL DEFAULT 0,
  goals         INTEGER NOT NULL DEFAULT 0,
  perfect_shots INTEGER NOT NULL DEFAULT 0,
  difficulty    NUMERIC(4,3) NOT NULL DEFAULT 0,
  shot_log      JSONB NOT NULL,
  is_flagged    BOOLEAN NOT NULL DEFAULT false,
  qr_ref        TEXT,
  played_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_goals         CHECK (goals BETWEEN 0 AND 5),
  CONSTRAINT valid_perfect_shots CHECK (perfect_shots BETWEEN 0 AND 5),
  CONSTRAINT valid_total_score   CHECK (total_score BETWEEN 0 AND 750)
);

CREATE INDEX IF NOT EXISTS idx_scores_player_id  ON scores(player_id);
CREATE INDEX IF NOT EXISTS idx_scores_played_at  ON scores(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_total      ON scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_is_flagged ON scores(is_flagged);

-- ── Daily plays ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_plays (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  play_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  play_count INTEGER NOT NULL DEFAULT 1,

  UNIQUE(player_id, play_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plays_player_date ON daily_plays(player_id, play_date);

-- ── Campaign settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_settings (
  id                 SERIAL PRIMARY KEY,
  campaign_start     TIMESTAMPTZ NOT NULL,
  campaign_end       TIMESTAMPTZ NOT NULL,
  daily_play_limit   INTEGER NOT NULL DEFAULT 3,
  difficulty_base    NUMERIC(4,3) NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO campaign_settings (campaign_start, campaign_end)
SELECT now(), now() + interval '30 days'
WHERE NOT EXISTS (SELECT 1 FROM campaign_settings);

-- ── QR codes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref         TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  target_path TEXT NOT NULL DEFAULT '/',
  scan_count  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_ref       ON qr_codes(ref);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_active ON qr_codes(is_active);

CREATE OR REPLACE FUNCTION increment_qr_scan(p_ref TEXT)
RETURNS void AS $$
  UPDATE qr_codes
  SET scan_count = scan_count + 1,
      updated_at = now()
  WHERE ref = p_ref AND is_active = true;
$$ LANGUAGE sql;

-- ── Leaderboard views ──────────────────────────────────────
CREATE OR REPLACE VIEW daily_leaderboard AS
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

CREATE OR REPLACE VIEW campaign_leaderboard AS
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

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plays ENABLE ROW LEVEL SECURITY;
-- Service role key bypasses RLS. No client-side Supabase access.

-- ── RPC: increment_play_count ──────────────────────────────
CREATE OR REPLACE FUNCTION increment_play_count(p_player_id UUID)
RETURNS void AS $$
  UPDATE players
  SET play_count = play_count + 1,
      updated_at = now()
  WHERE id = p_player_id;
$$ LANGUAGE sql;
