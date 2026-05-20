"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPlayers = listPlayers;
exports.blockPlayer = blockPlayer;
exports.unblockPlayer = unblockPlayer;
exports.flagScore = flagScore;
exports.getDailyWinners = getDailyWinners;
exports.exportWinnersCSV = exportWinnersCSV;
exports.updateCampaignSettings = updateCampaignSettings;
exports.getFlaggedScores = getFlaggedScores;
const supabase_1 = require("../../config/supabase");
const leaderboard_service_1 = require("../leaderboard/leaderboard.service");
async function listPlayers(page = 1, limit = 50) {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase_1.supabase
        .from("players")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, from + limit - 1);
    if (error)
        throw error;
    return { data, total: count ?? 0, page, limit };
}
async function blockPlayer(playerId) {
    const { error } = await supabase_1.supabase
        .from("players")
        .update({ is_blocked: true, updated_at: new Date().toISOString() })
        .eq("id", playerId);
    if (error)
        throw error;
    await (0, leaderboard_service_1.invalidateLeaderboardCache)();
}
async function unblockPlayer(playerId) {
    const { error } = await supabase_1.supabase
        .from("players")
        .update({ is_blocked: false, updated_at: new Date().toISOString() })
        .eq("id", playerId);
    if (error)
        throw error;
    await (0, leaderboard_service_1.invalidateLeaderboardCache)();
}
async function flagScore(scoreId) {
    const { error } = await supabase_1.supabase
        .from("scores")
        .update({ is_flagged: true, total_score: 0 })
        .eq("id", scoreId);
    if (error)
        throw error;
    await (0, leaderboard_service_1.invalidateLeaderboardCache)();
}
async function getDailyWinners(date) {
    const { data, error } = await supabase_1.supabase
        .from("daily_leaderboard")
        .select("player_id, display_name, phone, best_score, best_goals")
        .eq("play_date", date)
        .order("best_score", { ascending: false })
        .limit(10);
    if (error)
        throw error;
    return data ?? [];
}
async function exportWinnersCSV(date) {
    const winners = await getDailyWinners(date);
    const header = "Rank,Name,Phone,Score,Goals\n";
    const rows = winners
        .map((w, i) => `${i + 1},${w.display_name},${w.phone},${w.best_score},${w.best_goals}`)
        .join("\n");
    return header + rows;
}
async function updateCampaignSettings(settings) {
    const patch = {
        updated_at: new Date().toISOString(),
    };
    if (settings.campaignStart)
        patch.campaign_start = settings.campaignStart;
    if (settings.campaignEnd)
        patch.campaign_end = settings.campaignEnd;
    if (settings.dailyPlayLimit !== undefined)
        patch.daily_play_limit = settings.dailyPlayLimit;
    if (settings.difficultyBase !== undefined)
        patch.difficulty_base = settings.difficultyBase;
    const { error } = await supabase_1.supabase
        .from("campaign_settings")
        .update(patch)
        .eq("is_active", true);
    if (error)
        throw error;
}
async function getFlaggedScores(page = 1, limit = 50) {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase_1.supabase
        .from("scores")
        .select(`
      id,
      total_score,
      goals,
      is_flagged,
      played_at,
      shot_log,
      players (display_name, phone)
    `, { count: "exact" })
        .eq("is_flagged", true)
        .order("played_at", { ascending: false })
        .range(from, from + limit - 1);
    if (error)
        throw error;
    return { data: data ?? [], total: count ?? 0, page, limit };
}
