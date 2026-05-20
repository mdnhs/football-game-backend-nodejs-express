"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: true,
            message: "Validation error",
            data: err.flatten().fieldErrors,
            status: 400,
        });
        return;
    }
    logger_1.logger.error(err.message, { stack: err.stack });
    res.status(500).json({
        error: true,
        message: "Internal server error",
        data: null,
        status: 500,
    });
}
