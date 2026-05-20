import { z } from "zod";

export const checkPhoneSchema = z.object({
  phone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]+$/, "Phone must be digits (optional leading +)"),
});

export const verifyOtpSchema = z.object({
  idToken: z.string().min(10),
  qrRef: z.string().optional(),
});

export const completeProfileSchema = z.object({
  displayName: z.string().min(2).max(30).trim(),
});

export type CheckPhoneInput = z.infer<typeof checkPhoneSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
