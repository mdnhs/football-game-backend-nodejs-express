"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitScoreSchema = void 0;
const zod_1 = require("zod");
const shotLogSchema = zod_1.z.object({
    shotIndex: zod_1.z.number().int().min(0).max(4),
    power: zod_1.z.number().min(0).max(1),
    timing: zod_1.z.number().min(0).max(1),
    directionX: zod_1.z.number().min(-1).max(1),
    result: zod_1.z.enum(["goal", "saved", "miss"]),
    points: zod_1.z.number().int().min(0).max(200),
    durationMs: zod_1.z.number().int().min(500).max(30000),
});
exports.submitScoreSchema = zod_1.z.object({
    totalScore: zod_1.z.number().int().min(0).max(750),
    goals: zod_1.z.number().int().min(0).max(5),
    perfectShots: zod_1.z.number().int().min(0).max(5),
    difficulty: zod_1.z.number().min(0).max(1),
    shotLog: zod_1.z.array(shotLogSchema).length(5),
    qrRef: zod_1.z.string().optional(),
});
