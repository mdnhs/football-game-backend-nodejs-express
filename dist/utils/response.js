"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.okPaginated = okPaginated;
exports.fail = fail;
function ok(res, data, status = 200) {
    return res.status(status).json({
        error: false,
        message: "Success",
        data,
        status,
    });
}
function okPaginated(res, data, meta, status = 200) {
    const totalPages = Math.ceil(meta.total / meta.limit) || 1;
    const pagination = {
        totalData: meta.total,
        totalPages,
        currentPage: meta.page,
        limit: meta.limit,
        hasNextPage: meta.page < totalPages,
        hasPrevPage: meta.page > 1,
    };
    return res.status(status).json({
        error: false,
        message: "Success",
        data,
        pagination,
        status,
    });
}
function fail(res, message, status = 400) {
    return res.status(status).json({
        error: true,
        message,
        data: null,
        status,
    });
}
