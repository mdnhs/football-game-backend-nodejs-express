"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = void 0;
exports.adminJwtAuth = adminJwtAuth;
exports.requirePermission = requirePermission;
const admin_auth_service_1 = require("../modules/adminAuth/admin-auth.service");
function adminJwtAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: true, message: 'Missing admin token', data: null, status: 401 });
        return;
    }
    const token = header.slice(7).trim();
    try {
        const claims = (0, admin_auth_service_1.verifyAdminToken)(token);
        req.admin = claims;
        next();
    }
    catch {
        res.status(401).json({ error: true, message: 'Invalid or expired admin token', data: null, status: 401 });
    }
}
function requirePermission(permission) {
    return (req, res, next) => {
        const perms = req.admin?.permissions ?? [];
        const granted = perms.includes(permission);
        if (!granted) {
            res.status(403).json({ error: true, message: 'Permission denied', data: null, status: 403 });
            return;
        }
        next();
    };
}
// Back-compat alias — drop after all routes migrate
exports.adminAuthMiddleware = adminJwtAuth;
