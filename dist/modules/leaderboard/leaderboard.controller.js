"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaily = getDaily;
exports.getCampaign = getCampaign;
exports.getMyRank = getMyRank;
const leaderboard_service_1 = require("./leaderboard.service");
const response_1 = require("../../utils/response");
function today() {
    return new Date().toISOString().split("T")[0];
}
async function getDaily(req, res, next) {
    try {
        const date = req.query.date || today();
        const limit = Math.min(200, Number(req.query.limit) || 50);
        const data = await (0, leaderboard_service_1.getDailyLeaderboard)(date, limit);
        (0, response_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function getCampaign(req, res, next) {
    try {
        const limit = Math.min(500, Number(req.query.limit) || 100);
        const data = await (0, leaderboard_service_1.getCampaignLeaderboard)(limit);
        (0, response_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function getMyRank(req, res, next) {
    try {
        if (!req.playerId)
            return (0, response_1.fail)(res, "Unauthorized", 401);
        const type = req.query.type || "campaign";
        const date = req.query.date || today();
        const result = await (0, leaderboard_service_1.getPlayerRank)(req.playerId, type, date);
        (0, response_1.ok)(res, result);
    }
    catch (err) {
        next(err);
    }
}
