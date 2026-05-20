import { supabase } from "../../config/supabase";
import { env } from "../../config/env";
import { invalidateLeaderboardCache } from "../leaderboard/leaderboard.service";
import { validateShotLog } from "./score.validator";
import type { SubmitScoreInput } from "../../types";

export class DailyLimitError extends Error {
  constructor(limit: number) {
    super(`Daily play limit of ${limit} reached`);
    this.name = "DailyLimitError";
  }
}

export async function submitScore(
  playerId: string,
  input: SubmitScoreInput,
): Promise<{ scoreId: string; flagged: boolean; reason?: string }> {
  const validation = validateShotLog(
    input.shotLog,
    input.totalScore,
    input.goals,
    input.perfectShots,
  );

  const isFlagged = !validation.valid;

  const today = new Date().toISOString().split("T")[0];

  const { data: dailyPlay } = await supabase
    .from("daily_plays")
    .select("play_count")
    .eq("player_id", playerId)
    .eq("play_date", today)
    .maybeSingle();

  const currentCount = dailyPlay?.play_count ?? 0;

  const { data: settings } = await supabase
    .from("campaign_settings")
    .select("daily_play_limit")
    .eq("is_active", true)
    .maybeSingle();

  const limit = settings?.daily_play_limit ?? env.DAILY_PLAY_LIMIT;

  if (currentCount >= limit) {
    throw new DailyLimitError(limit);
  }

  const { data: score, error: scoreError } = await supabase
    .from("scores")
    .insert({
      player_id: playerId,
      total_score: isFlagged ? 0 : input.totalScore,
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

  await supabase.rpc("increment_play_count", { p_player_id: playerId });

  await supabase
    .from("daily_plays")
    .upsert(
      { player_id: playerId, play_date: today, play_count: currentCount + 1 },
      { onConflict: "player_id,play_date" },
    );

  if (!isFlagged) {
    await invalidateLeaderboardCache();
  }

  return {
    scoreId: score.id,
    flagged: isFlagged,
    ...(isFlagged && validation.reason ? { reason: validation.reason } : {}),
  };
}
