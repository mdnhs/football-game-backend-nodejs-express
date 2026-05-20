import { Request, Response, NextFunction } from 'express';
import { ok, fail } from '../../utils/response';
import { loginSchema } from './admin-auth.schema';
import * as service from './admin-auth.service';

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
    const adminId = (req as Request & { admin?: { id: string } }).admin?.id;
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
