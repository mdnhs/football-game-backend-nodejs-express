import { Request, Response, NextFunction } from 'express';
import { ok, fail } from '../../utils/response';
import { ADMIN_PERMISSIONS } from '../adminAuth/admin-auth.schema';
import { AdminAuthError } from '../adminAuth/admin-auth.service';
import {
  createRoleSchema,
  updateRoleSchema,
  createAdminSchema,
  updateAdminSchema,
} from './rbac.schema';
import * as service from './rbac.service';

function getActingAdminId(req: Request): string | undefined {
  const admin = (req as Request & { admin?: { sub?: string; id?: string } }).admin;
  return admin?.sub ?? admin?.id;
}

// ── Permission catalog ──────────────────────────────────────
export async function listPermissions(_req: Request, res: Response) {
  return ok(res, ADMIN_PERMISSIONS);
}

// ── Roles ───────────────────────────────────────────────────
export async function listRoles(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listRoles();
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    const data = await service.createRole(parsed.data);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    const data = await service.updateRole(req.params.id, parsed.data);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteRole(req.params.id);
    return ok(res, { success: true });
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

// ── Admins ──────────────────────────────────────────────────
export async function listAdmins(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAdmins();
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function createAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    const data = await service.createAdmin(parsed.data);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function updateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const actingId = getActingAdminId(req);
    if (!actingId) return fail(res, 'Unauthorized', 401);
    const parsed = updateAdminSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    const data = await service.updateAdmin(req.params.id, actingId, parsed.data);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function deleteAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const actingId = getActingAdminId(req);
    if (!actingId) return fail(res, 'Unauthorized', 401);
    await service.deleteAdmin(req.params.id, actingId);
    return ok(res, { success: true });
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}
