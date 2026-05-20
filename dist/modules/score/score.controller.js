"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submit = submit;
const score_schema_1 = require("./score.schema");
const score_service_1 = require("./score.service");
const response_1 = require("../../utils/response");
async function submit(req, res, next) {
    try {
        if (!req.playerId)
            return (0, response_1.fail)(res, "Unauthorized", 401);
        const input = score_schema_1.submitScoreSchema.parse(req.body);
        const result = await (0, score_service_1.submitScore)(req.playerId, input);
        (0, response_1.ok)(res, result, 201);
    }
    catch (err) {
        if (err instanceof score_service_1.DailyLimitError) {
            (0, response_1.fail)(res, err.message, 400);
            return;
        }
        next(err);
    }
}
