"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const score_controller_1 = require("./score.controller");
exports.scoreRouter = (0, express_1.Router)();
exports.scoreRouter.post("/", auth_1.authMiddleware, auth_1.requireFullAccount, rateLimiter_1.scoreRateLimiter, score_controller_1.submit);
