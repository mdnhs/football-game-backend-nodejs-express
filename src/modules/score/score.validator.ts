import type { ShotLog } from "../../types";

const BASE_GOAL_POINTS = 100;
const PERFECT_POINTS = 200;
const MAX_SCORE = 750;

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateShotLog(
  shotLog: ShotLog[],
  totalScore: number,
  goals: number,
  perfectShots: number,
): ValidationResult {
  if (shotLog.length !== 5) {
    return { valid: false, reason: "Shot count mismatch" };
  }

  let recalcScore = 0;
  let recalcGoals = 0;
  let recalcPerfect = 0;

  for (const shot of shotLog) {
    if (shot.result === "goal") {
      recalcGoals++;
      if (shot.timing >= 0.85) {
        recalcPerfect++;
        recalcScore += PERFECT_POINTS;
      } else {
        recalcScore += Math.round(
          BASE_GOAL_POINTS * (0.6 + shot.timing * 0.4),
        );
      }
    }
  }

  if (Math.abs(recalcScore - totalScore) > 5) {
    return {
      valid: false,
      reason: `Score mismatch: got ${totalScore}, expected ~${recalcScore}`,
    };
  }

  if (recalcGoals !== goals) {
    return {
      valid: false,
      reason: `Goals mismatch: got ${goals}, expected ${recalcGoals}`,
    };
  }

  if (recalcPerfect !== perfectShots) {
    return { valid: false, reason: "Perfect shots mismatch" };
  }

  const tooFast = shotLog.some((s) => s.durationMs < 500);
  if (tooFast) {
    return { valid: false, reason: "Shots taken too fast (bot suspected)" };
  }

  const totalMs = shotLog.reduce((sum, s) => sum + s.durationMs, 0);
  if (totalMs < 3000) {
    return { valid: false, reason: "Match completed too quickly" };
  }

  if (totalScore > MAX_SCORE) {
    return { valid: false, reason: "Score exceeds maximum possible" };
  }

  for (const shot of shotLog) {
    if (shot.result === "goal" && shot.timing >= 0.85 && shot.power < 0.3) {
      return {
        valid: false,
        reason: "Perfect shot with impossible low power",
      };
    }
  }

  return { valid: true };
}
