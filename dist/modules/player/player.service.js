"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayer = getPlayer;
exports.getPlayerDifficulty = getPlayerDifficulty;
exports.getDailyPlaysRemaining = getDailyPlaysRemaining;
const supabase_1 = require("../../config/supabase");
const env_1 = require("../../config/env");
async function getPlayer(playerId) {
    const { data, error } = await supabase_1.supabase
        .from("players")
        .select("id, display_name, phone, play_count, created_at")
        .eq("id", playerId)
        .single();
    if (error)
        throw error;
    return data;
}
async function getPlayerDifficulty(playerId) {
    const { data, error } = await supabase_1.supabase
        .from("players")
        .select("play_count")
        .eq("id", playerId)
        .single();
    if (error)
        throw error;
    const level = Math.min(data.play_count * 0.08, 1.0);
    return level;
}
async function getDailyPlaysRemaining(playerId) {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase_1.supabase
        .from("daily_plays")
        .select("play_count")
        .eq("player_id", playerId)
        .eq("play_date", today)
        .maybeSingle();
    if (error)
        throw error;
    const { data: settings } = await supabase_1.supabase
        .from("campaign_settings")
        .select("daily_play_limit")
        .eq("is_active", true)
        .maybeSingle();
    const limit = settings?.daily_play_limit ?? env_1.env.DAILY_PLAY_LIMIT;
    const used = data?.play_count ?? 0;
    return Math.max(0, limit - used);
}
