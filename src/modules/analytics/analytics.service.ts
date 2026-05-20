import { supabase } from "../../config/supabase";

export async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];

  const [totalPlayers, todayScores, flaggedScores, avgScore] =
    await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase
        .from("scores")
        .select("id", { count: "exact", head: true })
        .gte("played_at", `${today}T00:00:00`),
      supabase
        .from("scores")
        .select("id", { count: "exact", head: true })
        .eq("is_flagged", true),
      supabase
        .from("scores")
        .select("total_score")
        .eq("is_flagged", false)
        .then(({ data }) => {
          if (!data?.length) return 0;
          return Math.round(
            data.reduce((s, r) => s + (r.total_score ?? 0), 0) / data.length,
          );
        }),
    ]);

  return {
    totalPlayers: totalPlayers.count ?? 0,
    todayMatches: todayScores.count ?? 0,
    flaggedScores: flaggedScores.count ?? 0,
    avgScore,
  };
}

export async function getScoreDistribution() {
  const { data, error } = await supabase
    .from("scores")
    .select("total_score")
    .eq("is_flagged", false);

  if (error) throw error;

  const buckets: Record<string, number> = {
    "0": 0,
    "1-100": 0,
    "101-200": 0,
    "201-300": 0,
    "301-400": 0,
    "401-500": 0,
    "500+": 0,
  };

  for (const row of data ?? []) {
    const s = row.total_score;
    if (s === 0) buckets["0"]++;
    else if (s <= 100) buckets["1-100"]++;
    else if (s <= 200) buckets["101-200"]++;
    else if (s <= 300) buckets["201-300"]++;
    else if (s <= 400) buckets["301-400"]++;
    else if (s <= 500) buckets["401-500"]++;
    else buckets["500+"]++;
  }

  return buckets;
}
