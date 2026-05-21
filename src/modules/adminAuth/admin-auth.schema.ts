import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const updateMeSchema = z.object({
  email: z.email(),
});

export type UpdateMePayload = z.infer<typeof updateMeSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  });

export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;

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
  'admin.rbac.view',
  'admin.rbac.manage',
  'admin.admin.view_list',
  'admin.admin.create',
  'admin.admin.edit',
  'admin.admin.delete',
  'admin.ad.view_list',
  'admin.ad.create',
  'admin.ad.edit',
  'admin.ad.delete',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminRole = string;
