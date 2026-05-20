"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = adminAuthMiddleware;
const env_1 = require("../config/env");
function adminAuthMiddleware(req, res, next) {
    const secret = req.headers["x-admin-secret"];
    if (secret !== env_1.env.ADMIN_SECRET) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}
