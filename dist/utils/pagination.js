"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
function parsePagination(req, defaults = {}) {
    const defaultPage = defaults.page ?? 1;
    const defaultLimit = defaults.limit ?? 50;
    const maxLimit = defaults.maxLimit ?? 200;
    const page = Math.max(1, Number(req.query.page) || defaultPage);
    const rawLimit = Number(req.query.limit) || defaultLimit;
    const limit = Math.min(maxLimit, Math.max(1, rawLimit));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { page, limit, from, to };
}
