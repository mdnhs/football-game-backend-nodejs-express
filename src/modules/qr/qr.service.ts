import { randomBytes } from "crypto";
import { supabase } from "../../config/supabase";
import { env } from "../../config/env";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRef(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  }
  return out;
}

export class QrNotFoundError extends Error {
  constructor() {
    super("QR code not found or inactive");
    this.name = "QrNotFoundError";
  }
}

export class QrRefConflictError extends Error {
  constructor() {
    super("QR ref already exists");
    this.name = "QrRefConflictError";
  }
}

export interface CreateQrInput {
  label: string;
  targetPath?: string;
  ref?: string;
}

export function buildQrUrl(ref: string): string {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}/?ref=${encodeURIComponent(ref)}`;
}

export async function createQrCode(input: CreateQrInput) {
  let ref = input.ref?.trim();
  let attempts = 0;

  while (!ref || attempts > 0) {
    if (!ref) ref = generateRef();
    const { data: existing } = await supabase
      .from("qr_codes")
      .select("id")
      .eq("ref", ref)
      .maybeSingle();
    if (!existing) break;
    if (input.ref) throw new QrRefConflictError();
    ref = undefined;
    attempts++;
    if (attempts > 5) throw new Error("Could not generate unique ref");
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .insert({
      ref,
      label: input.label,
      target_path: input.targetPath ?? "/",
    })
    .select("*")
    .single();

  if (error) throw error;

  return { ...data, url: buildQrUrl(data.ref) };
}

export async function listQrCodes(page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("qr_codes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  const rows = (data ?? []).map((r) => ({ ...r, url: buildQrUrl(r.ref) }));
  return { data: rows, total: count ?? 0, page, limit };
}

export async function deactivateQrCode(id: string) {
  const { error } = await supabase
    .from("qr_codes")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function activateQrCode(id: string) {
  const { error } = await supabase
    .from("qr_codes")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getQrStats(id: string) {
  const { data: qr, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;

  const { count: signups } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("qr_ref", qr.ref);

  return {
    ...qr,
    url: buildQrUrl(qr.ref),
    signups: signups ?? 0,
  };
}

export async function recordScan(ref: string) {
  const { data, error } = await supabase
    .from("qr_codes")
    .select("ref, target_path, is_active")
    .eq("ref", ref)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.is_active) throw new QrNotFoundError();

  await supabase.rpc("increment_qr_scan", { p_ref: ref });

  const base = env.FRONTEND_URL.replace(/\/$/, "");
  const path = data.target_path.startsWith("/")
    ? data.target_path
    : `/${data.target_path}`;
  return `${base}${path}?ref=${encodeURIComponent(ref)}`;
}
