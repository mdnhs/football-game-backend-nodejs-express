import { z } from 'zod';
import { ADMIN_PERMISSIONS } from '../adminAuth/admin-auth.schema';

const permissionEnum = z.enum(ADMIN_PERMISSIONS as readonly [string, ...string[]]);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, digits, and underscores'),
  description: z.string().max(255).optional().default(''),
  permissions: z.array(permissionEnum).default([]),
});

export const updateRoleSchema = z.object({
  description: z.string().max(255).optional(),
  permissions: z.array(permissionEnum).optional(),
});

export const createAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  roleId: z.uuid(),
});

export const updateAdminSchema = z
  .object({
    email: z.email().optional(),
    roleId: z.uuid().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export type CreateRolePayload = z.infer<typeof createRoleSchema>;
export type UpdateRolePayload = z.infer<typeof updateRoleSchema>;
export type CreateAdminPayload = z.infer<typeof createAdminSchema>;
export type UpdateAdminPayload = z.infer<typeof updateAdminSchema>;
