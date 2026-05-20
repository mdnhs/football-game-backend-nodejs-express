"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPlayers = listPlayers;
exports.blockPlayer = blockPlayer;
exports.unblockPlayer = unblockPlayer;
exports.flagScore = flagScore;
exports.getDailyWinners = getDailyWinners;
exports.exportWinners = exportWinners;
exports.updateSettings = updateSettings;
exports.getFlaggedScores = getFlaggedScores;
const zod_1 = require("zod");
const admin_service_1 = require("./admin.service");
const pagination_1 = require("../../utils/pagination");
const response_1 = require("../../utils/response");
const settingsSchema = zod_1.z.object({
    campaignStart: zod_1.z.string().optional(),
    campaignEnd: zod_1.z.string().optional(),
    dailyPlayLimit: zod_1.z.number().int().min(1).max(100).optional(),
    difficultyBase: zod_1.z.number().min(0).max(1).optional(),
});
async function listPlayers(req, res, next) {
    try {
        const { page, limit } = (0, pagination_1.parsePagination)(req);
        const result = await (0, admin_service_1.listPlayers)(page, limit);
        (0, response_1.okPaginated)(res, result.data ?? [], { total: result.total, page, limit });
    }
    catch (err) {
        next(err);
    }
}
async function blockPlayer(req, res, next) {
    try {
        await (0, admin_service_1.blockPlayer)(String(req.params.id));
        (0, response_1.ok)(res, { blocked: true });
    }
    catch (err) {
        next(err);
    }
}
async function unblockPlayer(req, res, next) {
    try {
        await (0, admin_service_1.unblockPlayer)(String(req.params.id));
        (0, response_1.ok)(res, { blocked: false });
    }
    catch (err) {
        next(err);
    }
}
async function flagScore(req, res, next) {
    try {
        await (0, admin_service_1.flagScore)(String(req.params.id));
        (0, response_1.ok)(res, { flagged: true });
    }
    catch (err) {
        next(err);
    }
}
async function getDailyWinners(req, res, next) {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const data = await (0, admin_service_1.getDailyWinners)(date);
        (0, response_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function exportWinners(req, res, next) {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const csv = await (0, admin_service_1.exportWinnersCSV)(date);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="winners-${date}.csv"`);
        res.send(csv);
    }
    catch (err) {
        next(err);
    }
}
async function updateSettings(req, res, next) {
    try {
        const input = settingsSchema.parse(req.body);
        await (0, admin_service_1.updateCampaignSettings)(input);
        (0, response_1.ok)(res, { updated: true });
    }
    catch (err) {
        next(err);
    }
}
async function getFlaggedScores(req, res, next) {
    try {
        const { page, limit } = (0, pagination_1.parsePagination)(req);
        const result = await (0, admin_service_1.getFlaggedScores)(page, limit);
        (0, response_1.okPaginated)(res, result.data, { total: result.total, page, limit });
    }
    catch (err) {
        next(err);
    }
}
