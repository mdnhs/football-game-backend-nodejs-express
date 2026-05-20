"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhoneHandler = checkPhoneHandler;
exports.verifyOtpHandler = verifyOtpHandler;
exports.completeProfileHandler = completeProfileHandler;
const auth_schema_1 = require("./auth.schema");
const auth_service_1 = require("./auth.service");
const response_1 = require("../../utils/response");
async function checkPhoneHandler(req, res, next) {
    try {
        const input = auth_schema_1.checkPhoneSchema.parse(req.body);
        const result = await (0, auth_service_1.checkPhone)(input);
        (0, response_1.ok)(res, result);
    }
    catch (err) {
        if (err instanceof auth_service_1.BlockedAccountError) {
            (0, response_1.fail)(res, err.message, 403);
            return;
        }
        next(err);
    }
}
async function verifyOtpHandler(req, res, next) {
    try {
        const input = auth_schema_1.verifyOtpSchema.parse(req.body);
        const result = await (0, auth_service_1.verifyOtp)(input);
        (0, response_1.ok)(res, result, 200);
    }
    catch (err) {
        if (err instanceof auth_service_1.BlockedAccountError) {
            (0, response_1.fail)(res, err.message, 403);
            return;
        }
        next(err);
    }
}
async function completeProfileHandler(req, res, next) {
    try {
        if (!req.jwtPayload)
            return (0, response_1.fail)(res, "Unauthorized", 401);
        const input = auth_schema_1.completeProfileSchema.parse(req.body);
        const result = await (0, auth_service_1.completeProfile)(req.jwtPayload, input);
        (0, response_1.ok)(res, result, 201);
    }
    catch (err) {
        if (err instanceof auth_service_1.BlockedAccountError) {
            (0, response_1.fail)(res, err.message, 403);
            return;
        }
        next(err);
    }
}
