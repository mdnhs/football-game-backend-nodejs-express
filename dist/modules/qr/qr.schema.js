"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQrSchema = void 0;
const zod_1 = require("zod");
exports.createQrSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).max(80).trim(),
    targetPath: zod_1.z
        .string()
        .max(200)
        .regex(/^\/[A-Za-z0-9/_\-?=&%.]*$/, "Must start with / and be URL-safe")
        .optional(),
    ref: zod_1.z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Za-z0-9_-]+$/)
        .optional(),
});
