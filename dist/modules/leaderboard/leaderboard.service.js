"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyLeaderboard = getDailyLeaderboard;
exports.getCampaignLeaderboard = getCampaignLeaderboard;
exports.getPlayerRank = getPlayerRank;
exports.invalidateLeaderboardCache = invalidateLeaderboardCache;
const supabase_1 = require("../../config/supabase");
const redis_1 = require("../../config/redis");
const CACHE_TTL = 60;
async function getDailyLeaderboard(date, limit = 50) {
    const cacheKey = `leaderboard:daily:${date}:${limit}`;
    const cached = await redis_1.redis.get(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const { data, error } = await supabase_1.supabase
        .from("daily_leaderboard")
        .select("player_id, display_name, best_score, best_goals, matches_played")
        .eq("play_date", date)
        .order("best_score", { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    const result = (data ?? []);
    await redis_1.redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
    return result;
}
async function getCampaignLeaderboard(limit = 100) {
    const cacheKey = `leaderboard:campaign:${limit}`;
    const cached = await redis_1.redis.get(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const { data, error } = await supabase_1.supabase
        .from("campaign_leaderboard")
        .select("player_id, display_name, best_score, best_goals, matches_played")
        .order("best_score", { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    const result = (data ?? []);
    await redis_1.redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
    return result;
}
async function getPlayerRank(playerId, type, date) {
    const board = type === "daily" && date
        ? await getDailyLeaderboard(date, 1000)
        : await getCampaignLeaderboard(1000);
    const idx = board.findIndex((e) => e.player_id === playerId);
    if (idx === -1)
        return { rank: null, score: null };
    return { rank: idx + 1, score: board[idx].best_score };
}
async function invalidateLeaderboardCache() {
    const today = new Date().toISOString().split("T")[0];
    const keys = await redis_1.redis.keys(`leaderboard:daily:${today}:*`);
    const campaignKeys = await redis_1.redis.keys("leaderboard:campaign:*");
    const all = [...keys, ...campaignKeys];
    if (all.length)
        await redis_1.redis.del(...all);
}
