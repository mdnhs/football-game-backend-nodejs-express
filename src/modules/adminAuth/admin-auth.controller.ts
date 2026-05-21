import { Request, Response, NextFunction } from 'express';
import { ok, fail } from '../../utils/response';
import { loginSchema, updateMeSchema, changePasswordSchema } from './admin-auth.schema';
import * as service from './admin-auth.service';

function getAdminId(req: Request): string | undefined {
  const admin = (req as Request & { admin?: { sub?: string; id?: string } }).admin;
  return admin?.sub ?? admin?.id;
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    }
    const { email, password } = parsed.data;
    const result = await service.login(email, password);
    return ok(res, result);
  } catch (err) {
    if (err instanceof service.AdminAuthError) {
      return fail(res, err.message, err.status);
    }
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = getAdminId(req);
    if (!adminId) return fail(res, 'Unauthorized', 401);
    const data = await service.getById(adminId);
    return ok(res, data);
  } catch (err) {
    if (err instanceof service.AdminAuthError) {
      return fail(res, err.message, err.status);
    }
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = getAdminId(req);
    if (!adminId) return fail(res, 'Unauthorized', 401);
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    }
    const data = await service.updateEmail(adminId, parsed.data.email);
    return ok(res, data);
  } catch (err) {
    if (err instanceof service.AdminAuthError) {
      return fail(res, err.message, err.status);
    }
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = getAdminId(req);
    if (!adminId) return fail(res, 'Unauthorized', 401);
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    }
    await service.changePassword(adminId, parsed.data.currentPassword, parsed.data.newPassword);
    return ok(res, { success: true });
  } catch (err) {
    if (err instanceof service.AdminAuthError) {
      return fail(res, err.message, err.status);
    }
    next(err);
  }
}
