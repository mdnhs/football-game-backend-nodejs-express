import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const ADMIN_PERMISSIONS = [
  'admin.dashboard.view',
  'admin.player.view_list',
  'admin.player.edit',
  'admin.player.disable',
  'admin.score.view_list',
  'admin.score.flag',
  'admin.winner.view_list',
  'admin.winner.declare',
  'admin.qr.view_list',
  'admin.qr.create',
  'admin.settings.view',
  'admin.settings.edit',
] as const;

export const ROLE_PERMISSIONS = {
  admin: ADMIN_PERMISSIONS,
} as const;

export type AdminRole = keyof typeof ROLE_PERMISSIONS;
