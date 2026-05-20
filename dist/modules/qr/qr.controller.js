"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQr = createQr;
exports.listQr = listQr;
exports.deactivateQr = deactivateQr;
exports.activateQr = activateQr;
exports.statsQr = statsQr;
exports.scanRedirect = scanRedirect;
const qr_schema_1 = require("./qr.schema");
const qr_service_1 = require("./qr.service");
const pagination_1 = require("../../utils/pagination");
const response_1 = require("../../utils/response");
async function createQr(req, res, next) {
    try {
        const input = qr_schema_1.createQrSchema.parse(req.body);
        const qr = await (0, qr_service_1.createQrCode)(input);
        (0, response_1.ok)(res, qr, 201);
    }
    catch (err) {
        if (err instanceof qr_service_1.QrRefConflictError) {
            (0, response_1.fail)(res, err.message, 409);
            return;
        }
        next(err);
    }
}
async function listQr(req, res, next) {
    try {
        const { page, limit } = (0, pagination_1.parsePagination)(req);
        const result = await (0, qr_service_1.listQrCodes)(page, limit);
        (0, response_1.okPaginated)(res, result.data, { total: result.total, page, limit });
    }
    catch (err) {
        next(err);
    }
}
async function deactivateQr(req, res, next) {
    try {
        await (0, qr_service_1.deactivateQrCode)(String(req.params.id));
        (0, response_1.ok)(res, { active: false });
    }
    catch (err) {
        next(err);
    }
}
async function activateQr(req, res, next) {
    try {
        await (0, qr_service_1.activateQrCode)(String(req.params.id));
        (0, response_1.ok)(res, { active: true });
    }
    catch (err) {
        next(err);
    }
}
async function statsQr(req, res, next) {
    try {
        const stats = await (0, qr_service_1.getQrStats)(String(req.params.id));
        (0, response_1.ok)(res, stats);
    }
    catch (err) {
        next(err);
    }
}
async function scanRedirect(req, res, next) {
    try {
        const ref = String(req.params.ref);
        const target = await (0, qr_service_1.recordScan)(ref);
        res.redirect(302, target);
    }
    catch (err) {
        if (err instanceof qr_service_1.QrNotFoundError) {
            res.status(404).send("QR code not found or inactive");
            return;
        }
        next(err);
    }
}
