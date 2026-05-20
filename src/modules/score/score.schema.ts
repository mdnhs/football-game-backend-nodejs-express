import { z } from "zod";

const shotLogSchema = z.object({
  shotIndex: z.number().int().min(0).max(4),
  power: z.number().min(0).max(1),
  timing: z.number().min(0).max(1),
  directionX: z.number().min(-1).max(1),
  result: z.enum(["goal", "saved", "miss"]),
  points: z.number().int().min(0).max(200),
  durationMs: z.number().int().min(500).max(30000),
});

export const submitScoreSchema = z.object({
  totalScore: z.number().int().min(0).max(750),
  goals: z.number().int().min(0).max(5),
  perfectShots: z.number().int().min(0).max(5),
  difficulty: z.number().min(0).max(1),
  shotLog: z.array(shotLogSchema).length(5),
  qrRef: z.string().optional(),
});

export type SubmitScoreSchema = z.infer<typeof submitScoreSchema>;
