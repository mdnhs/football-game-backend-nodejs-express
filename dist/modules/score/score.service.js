"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyLimitError = void 0;
exports.submitScore = submitScore;
const supabase_1 = require("../../config/supabase");
const env_1 = require("../../config/env");
const leaderboard_service_1 = require("../leaderboard/leaderboard.service");
const score_validator_1 = require("./score.validator");
class DailyLimitError extends Error {
    constructor(limit) {
        super(`Daily play limit of ${limit} reached`);
        this.name = "DailyLimitError";
    }
}
exports.DailyLimitError = DailyLimitError;
async function submitScore(playerId, input) {
    const validation = (0, score_validator_1.validateShotLog)(input.shotLog, input.totalScore, input.goals, input.perfectShots);
    const isFlagged = !validation.valid;
    const today = new Date().toISOString().split("T")[0];
    const { data: dailyPlay } = await supabase_1.supabase
        .from("daily_plays")
        .select("play_count")
        .eq("player_id", playerId)
        .eq("play_date", today)
        .maybeSingle();
    const currentCount = dailyPlay?.play_count ?? 0;
    const { data: settings } = await supabase_1.supabase
        .from("campaign_settings")
        .select("daily_play_limit")
        .eq("is_active", true)
        .maybeSingle();
    const limit = settings?.daily_play_limit ?? env_1.env.DAILY_PLAY_LIMIT;
    if (currentCount >= limit) {
        throw new DailyLimitError(limit);
    }
    const { data: score, error: scoreError } = await supabase_1.supabase
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
    if (scoreError)
        throw scoreError;
    await supabase_1.supabase.rpc("increment_play_count", { p_player_id: playerId });
    await supabase_1.supabase
        .from("daily_plays")
        .upsert({ player_id: playerId, play_date: today, play_count: currentCount + 1 }, { onConflict: "player_id,play_date" });
    if (!isFlagged) {
        await (0, leaderboard_service_1.invalidateLeaderboardCache)();
    }
    return {
        scoreId: score.id,
        flagged: isFlagged,
        ...(isFlagged && validation.reason ? { reason: validation.reason } : {}),
    };
}
