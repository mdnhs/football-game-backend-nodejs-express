import { z } from "zod";

export const createQrSchema = z.object({
  label: z.string().min(1).max(80).trim(),
  targetPath: z
    .string()
    .max(200)
    .regex(/^\/[A-Za-z0-9/_\-?=&%.]*$/, "Must start with / and be URL-safe")
    .optional(),
  ref: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/)
    .optional(),
});

export type CreateQrSchema = z.infer<typeof createQrSchema>;
