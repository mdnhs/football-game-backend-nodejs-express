"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileAlreadyExistsError = exports.BlockedAccountError = void 0;
exports.checkPhone = checkPhone;
exports.verifyOtp = verifyOtp;
exports.completeProfile = completeProfile;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_1 = require("../../config/firebase");
const supabase_1 = require("../../config/supabase");
const env_1 = require("../../config/env");
class BlockedAccountError extends Error {
    constructor() {
        super("This account has been blocked.");
        this.name = "BlockedAccountError";
    }
}
exports.BlockedAccountError = BlockedAccountError;
class ProfileAlreadyExistsError extends Error {
    constructor() {
        super("Profile already exists for this account.");
        this.name = "ProfileAlreadyExistsError";
    }
}
exports.ProfileAlreadyExistsError = ProfileAlreadyExistsError;
function signFullToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
}
function signPendingToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: "30m",
    });
}
async function checkPhone(input) {
    const { data, error } = await supabase_1.supabase
        .from("players")
        .select("display_name, is_blocked")
        .eq("phone", input.phone)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return { exists: false };
    if (data.is_blocked)
        throw new BlockedAccountError();
    return { exists: true, displayName: data.display_name };
}
async function verifyOtp(input) {
    const decoded = await firebase_1.firebaseAdmin.auth().verifyIdToken(input.idToken);
    const phone = decoded.phone_number;
    const firebaseUid = decoded.uid;
    if (!phone)
        throw new Error("No phone number in Firebase token");
    const { data: existing, error } = await supabase_1.supabase
        .from("players")
        .select("id, phone, display_name, play_count, is_blocked")
        .eq("firebase_uid", firebaseUid)
        .maybeSingle();
    if (error)
        throw error;
    if (existing) {
        if (existing.is_blocked)
            throw new BlockedAccountError();
        const token = signFullToken({ playerId: existing.id, phone: existing.phone });
        return { token, isNew: false, player: existing };
    }
    const token = signPendingToken({
        firebaseUid,
        phone,
        pending: true,
        ...(input.qrRef ? { qrRef: input.qrRef } : {}),
    });
    return { token, isNew: true, player: null };
}
async function completeProfile(payload, input) {
    if ("pending" in payload && payload.pending) {
        const { data, error } = await supabase_1.supabase
            .from("players")
            .insert({
            firebase_uid: payload.firebaseUid,
            phone: payload.phone,
            display_name: input.displayName,
        })
            .select("id, phone, display_name, play_count, is_blocked")
            .single();
        if (error)
            throw error;
        if (data.is_blocked)
            throw new BlockedAccountError();
        const token = signFullToken({ playerId: data.id, phone: data.phone });
        return { token, player: data };
    }
    const playerId = payload.playerId;
    const { data, error } = await supabase_1.supabase
        .from("players")
        .update({
        display_name: input.displayName,
        updated_at: new Date().toISOString(),
    })
        .eq("id", playerId)
        .select("id, phone, display_name, play_count, is_blocked")
        .single();
    if (error)
        throw error;
    if (data.is_blocked)
        throw new BlockedAccountError();
    const token = signFullToken({ playerId: data.id, phone: data.phone });
    return { token, player: data };
}
