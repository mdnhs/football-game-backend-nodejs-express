"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeProfileSchema = exports.verifyOtpSchema = exports.checkPhoneSchema = void 0;
const zod_1 = require("zod");
exports.checkPhoneSchema = zod_1.z.object({
    phone: zod_1.z
        .string()
        .min(8)
        .max(20)
        .regex(/^\+?[0-9]+$/, "Phone must be digits (optional leading +)"),
});
exports.verifyOtpSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10),
    qrRef: zod_1.z.string().optional(),
});
exports.completeProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2).max(30).trim(),
});
