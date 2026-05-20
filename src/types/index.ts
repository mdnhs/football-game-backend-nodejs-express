export interface ShotLog {
  shotIndex: number;
  power: number;
  timing: number;
  directionX: number;
  result: "goal" | "saved" | "miss";
  points: number;
  durationMs: number;
}

export interface SubmitScoreInput {
  totalScore: number;
  goals: number;
  perfectShots: number;
  difficulty: number;
  shotLog: ShotLog[];
  qrRef?: string;
}

export interface Player {
  id: string;
  phone: string;
  display_name: string;
  firebase_uid: string;
  play_count: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  player_id: string;
  total_score: number;
  goals: number;
  perfect_shots: number;
  difficulty: number;
  shot_log: ShotLog[];
  is_flagged: boolean;
  qr_ref: string | null;
  played_at: string;
}
