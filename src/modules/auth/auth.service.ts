import jwt from "jsonwebtoken";
import { firebaseAdmin } from "../../config/firebase";
import { supabase } from "../../config/supabase";
import { env } from "../../config/env";
import type {
  CheckPhoneInput,
  VerifyOtpInput,
  CompleteProfileInput,
} from "./auth.schema";

export class BlockedAccountError extends Error {
  constructor() {
    super("This account has been blocked.");
    this.name = "BlockedAccountError";
  }
}

export class ProfileAlreadyExistsError extends Error {
  constructor() {
    super("Profile already exists for this account.");
    this.name = "ProfileAlreadyExistsError";
  }
}

export interface FullJwtPayload {
  playerId: string;
  phone: string;
}

export interface PendingJwtPayload {
  firebaseUid: string;
  phone: string;
  pending: true;
  qrRef?: string;
}

export type JwtPayload = FullJwtPayload | PendingJwtPayload;

function signFullToken(payload: FullJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function signPendingToken(payload: PendingJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "30m" as jwt.SignOptions["expiresIn"],
  });
}

export async function checkPhone(input: CheckPhoneInput) {
  const { data, error } = await supabase
    .from("players")
    .select("display_name, is_blocked")
    .eq("phone", input.phone)
    .maybeSingle();

  if (error) throw error;

  if (!data) return { exists: false };
  if (data.is_blocked) throw new BlockedAccountError();

  return { exists: true, displayName: data.display_name };
}

export async function verifyOtp(input: VerifyOtpInput) {
  const decoded = await firebaseAdmin.auth().verifyIdToken(input.idToken);
  const phone = decoded.phone_number;
  const firebaseUid = decoded.uid;

  if (!phone) throw new Error("No phone number in Firebase token");

  const { data: existing, error } = await supabase
    .from("players")
    .select("id, phone, display_name, play_count, is_blocked")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    if (existing.is_blocked) throw new BlockedAccountError();
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

export async function completeProfile(
  payload: JwtPayload,
  input: CompleteProfileInput,
) {
  if ("pending" in payload && payload.pending) {
    const { data, error } = await supabase
      .from("players")
      .insert({
        firebase_uid: payload.firebaseUid,
        phone: payload.phone,
        display_name: input.displayName,
      })
      .select("id, phone, display_name, play_count, is_blocked")
      .single();

    if (error) throw error;
    if (data.is_blocked) throw new BlockedAccountError();

    const token = signFullToken({ playerId: data.id, phone: data.phone });
    return { token, player: data };
  }

  const playerId = (payload as FullJwtPayload).playerId;

  const { data, error } = await supabase
    .from("players")
    .update({
      display_name: input.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .select("id, phone, display_name, play_count, is_blocked")
    .single();

  if (error) throw error;
  if (data.is_blocked) throw new BlockedAccountError();

  const token = signFullToken({ playerId: data.id, phone: data.phone });
  return { token, player: data };
}
