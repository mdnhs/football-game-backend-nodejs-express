import jwt from "jsonwebtoken";
import { firebaseAdmin } from "../../config/firebase";
import { supabase } from "../../config/supabase";
import { env } from "../../config/env";
import type { VerifyOtpInput } from "./auth.schema";

export class BlockedAccountError extends Error {
  constructor() {
    super("This account has been blocked.");
    this.name = "BlockedAccountError";
  }
}

export async function verifyFirebaseToken(input: VerifyOtpInput) {
  const decoded = await firebaseAdmin.auth().verifyIdToken(input.idToken);
  const phone = decoded.phone_number;
  const firebaseUid = decoded.uid;

  if (!phone) throw new Error("No phone number in Firebase token");

  const { data: player, error } = await supabase
    .from("players")
    .upsert(
      {
        firebase_uid: firebaseUid,
        phone,
        display_name: input.displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "firebase_uid", ignoreDuplicates: false },
    )
    .select("id, phone, display_name, play_count, is_blocked")
    .single();

  if (error) throw error;
  if (player.is_blocked) throw new BlockedAccountError();

  const token = jwt.sign(
    { playerId: player.id, phone: player.phone },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  return { token, player };
}
