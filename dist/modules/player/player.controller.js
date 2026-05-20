"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.getDifficulty = getDifficulty;
exports.getPlaysRemaining = getPlaysRemaining;
const player_service_1 = require("./player.service");
const response_1 = require("../../utils/response");
async function getMe(req, res, next) {
    try {
        if (!req.playerId)
            return (0, response_1.fail)(res, "Unauthorized", 401);
        const player = await (0, player_service_1.getPlayer)(req.playerId);
        (0, response_1.ok)(res, player);
    }
    catch (err) {
        next(err);
    }
}
async function getDifficulty(req, res, next) {
    try {
        if (!req.playerId)
            return (0, response_1.fail)(res, "Unauthorized", 401);
        const level = await (0, player_service_1.getPlayerDifficulty)(req.playerId);
        (0, response_1.ok)(res, { level });
    }
    catch (err) {
        next(err);
    }
}
async function getPlaysRemaining(req, res, next) {
    try {
        if (!req.playerId)
            return (0, response_1.fail)(res, "Unauthorized", 401);
        const remaining = await (0, player_service_1.getDailyPlaysRemaining)(req.playerId);
        (0, response_1.ok)(res, { remaining });
    }
    catch (err) {
        next(err);
    }
}
