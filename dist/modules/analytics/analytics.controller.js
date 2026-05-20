"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.getDistribution = getDistribution;
const analytics_service_1 = require("./analytics.service");
const response_1 = require("../../utils/response");
async function getDashboard(_req, res, next) {
    try {
        const stats = await (0, analytics_service_1.getDashboardStats)();
        (0, response_1.ok)(res, stats);
    }
    catch (err) {
        next(err);
    }
}
async function getDistribution(_req, res, next) {
    try {
        const buckets = await (0, analytics_service_1.getScoreDistribution)();
        (0, response_1.ok)(res, buckets);
    }
    catch (err) {
        next(err);
    }
}
