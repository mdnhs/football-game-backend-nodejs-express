import { z } from "zod";

export const verifyOtpSchema = z.object({
  idToken: z.string().min(10),
  displayName: z.string().min(2).max(30).trim(),
  qrRef: z.string().optional(),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
