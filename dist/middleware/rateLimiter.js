"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimiter = exports.scoreRateLimiter = exports.otpRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.otpRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: "Too many OTP attempts. Try again in 10 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.scoreRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 30 * 1000,
    max: 1,
    message: { error: "Please wait before submitting another score." },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.generalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "Too many requests." },
    standardHeaders: true,
    legacyHeaders: false,
});
