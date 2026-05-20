"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireFullAccount = requireFullAccount;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function isPending(p) {
    return p.pending === true;
}
function decodeToken(req, res) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return null;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(header.slice(7), env_1.env.JWT_SECRET);
        return payload;
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
        return null;
    }
}
function authMiddleware(req, res, next) {
    const payload = decodeToken(req, res);
    if (!payload)
        return;
    req.jwtPayload = payload;
    if (isPending(payload)) {
        req.firebaseUid = payload.firebaseUid;
        req.phone = payload.phone;
        req.pending = true;
        req.qrRef = payload.qrRef;
    }
    else {
        req.playerId = payload.playerId;
        req.phone = payload.phone;
        req.pending = false;
    }
    next();
}
function requireFullAccount(req, res, next) {
    if (req.pending || !req.playerId) {
        res
            .status(403)
            .json({ error: "Profile incomplete. Call /api/auth/complete-profile." });
        return;
    }
    next();
}
