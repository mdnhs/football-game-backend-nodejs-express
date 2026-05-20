"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateShotLog = validateShotLog;
const MAX_SCORE = 750;
function validateShotLog(shotLog, totalScore, goals, perfectShots) {
    if (shotLog.length !== 5) {
        return { valid: false, reason: "Shot count mismatch" };
    }
    let summedPoints = 0;
    let recalcGoals = 0;
    let recalcPerfect = 0;
    for (const shot of shotLog) {
        // Points must be zero for non-goals
        if (shot.result !== "goal" && shot.points > 0) {
            return {
                valid: false,
                reason: `Non-goal shot has points: ${shot.points}`,
            };
        }
        // Goals must have positive points
        if (shot.result === "goal" && shot.points <= 0) {
            return { valid: false, reason: "Goal shot has zero points" };
        }
        // Per-shot ceiling
        if (shot.points > 200) {
            return { valid: false, reason: "Shot exceeds 200 points" };
        }
        summedPoints += shot.points;
        if (shot.result === "goal") {
            recalcGoals++;
            if (shot.timing >= 0.85)
                recalcPerfect++;
        }
    }
    // Total score must match sum of shot points (±5 for rounding)
    if (Math.abs(summedPoints - totalScore) > 5) {
        return {
            valid: false,
            reason: `Score mismatch: got ${totalScore}, sum was ${summedPoints}`,
        };
    }
    if (recalcGoals !== goals) {
        return {
            valid: false,
            reason: `Goals mismatch: got ${goals}, log shows ${recalcGoals}`,
        };
    }
    if (recalcPerfect !== perfectShots) {
        return {
            valid: false,
            reason: `Perfect shots mismatch: got ${perfectShots}, log shows ${recalcPerfect}`,
        };
    }
    // Humanly impossible speed: each shot took at least 500ms
    if (shotLog.some((s) => s.durationMs < 500)) {
        return { valid: false, reason: "Shots taken too fast (bot suspected)" };
    }
    // Total match duration sanity
    const totalMs = shotLog.reduce((sum, s) => sum + s.durationMs, 0);
    if (totalMs < 3000) {
        return { valid: false, reason: "Match completed too quickly" };
    }
    // Score ceiling
    if (totalScore > MAX_SCORE) {
        return { valid: false, reason: "Score exceeds maximum possible" };
    }
    // Perfect shot physics check: perfect timing requires real power
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
