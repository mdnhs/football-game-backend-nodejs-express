import { supabase } from "../../config/supabase";
import { redis } from "../../config/redis";

const CACHE_TTL = 60;

export interface LeaderboardEntry {
  player_id: string;
  display_name: string;
  best_score: number;
  best_goals: number;
  matches_played: number;
}

export async function getDailyLeaderboard(
  date: string,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const cacheKey = `leaderboard:daily:${date}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { data, error } = await supabase
    .from("daily_leaderboard")
    .select("player_id, display_name, best_score, best_goals, matches_played")
    .eq("play_date", date)
    .order("best_score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const result = (data ?? []) as LeaderboardEntry[];
  await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  return result;
}

export async function getCampaignLeaderboard(
  limit = 100,
): Promise<LeaderboardEntry[]> {
  const cacheKey = `leaderboard:campaign:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { data, error } = await supabase
    .from("campaign_leaderboard")
    .select("player_id, display_name, best_score, best_goals, matches_played")
    .order("best_score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const result = (data ?? []) as LeaderboardEntry[];
  await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  return result;
}

export async function getPlayerRank(
  playerId: string,
  type: "daily" | "campaign",
  date?: string,
): Promise<{ rank: number | null; score: number | null }> {
  const board =
    type === "daily" && date
      ? await getDailyLeaderboard(date, 1000)
      : await getCampaignLeaderboard(1000);

  const idx = board.findIndex((e) => e.player_id === playerId);
  if (idx === -1) return { rank: null, score: null };

  return { rank: idx + 1, score: board[idx].best_score };
}

export async function invalidateLeaderboardCache() {
  const today = new Date().toISOString().split("T")[0];
  const keys = await redis.keys(`leaderboard:daily:${today}:*`);
  const campaignKeys = await redis.keys("leaderboard:campaign:*");
  const all = [...keys, ...campaignKeys];
  if (all.length) await redis.del(...all);
}
