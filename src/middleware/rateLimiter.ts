import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP attempts. Try again in 10 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const scoreRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
  message: { error: "Please wait before submitting another score." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests." },
  standardHeaders: true,
  legacyHeaders: false,
});
