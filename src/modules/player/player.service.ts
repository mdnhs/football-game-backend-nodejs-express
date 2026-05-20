import { supabase } from "../../config/supabase";
import { env } from "../../config/env";

export async function getPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("id, display_name, phone, play_count, created_at")
    .eq("id", playerId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerDifficulty(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from("players")
    .select("play_count")
    .eq("id", playerId)
    .single();

  if (error) throw error;

  const level = Math.min(data.play_count * 0.08, 1.0);
  return level;
}

export async function getDailyPlaysRemaining(
  playerId: string,
): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_plays")
    .select("play_count")
    .eq("player_id", playerId)
    .eq("play_date", today)
    .maybeSingle();

  if (error) throw error;

  const { data: settings } = await supabase
    .from("campaign_settings")
    .select("daily_play_limit")
    .eq("is_active", true)
    .maybeSingle();

  const limit = settings?.daily_play_limit ?? env.DAILY_PLAY_LIMIT;
  const used = data?.play_count ?? 0;
  return Math.max(0, limit - used);
}
