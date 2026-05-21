import { Request, Response, NextFunction } from 'express';
import { ok, fail } from '../../utils/response';
import { AdminAuthError } from '../adminAuth/admin-auth.service';
import { createAdSchema, updateAdSchema } from './ads.schema';
import * as service from './ads.service';

export async function publicList(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAds({ activeOnly: true });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listAds(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAds();
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function getAd(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getAd(req.params.id);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function createAd(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createAdSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    const data = await service.createAd(parsed.data);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function updateAd(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateAdSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    const data = await service.updateAd(req.params.id, parsed.data);
    return ok(res, data);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}

export async function deleteAd(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteAd(req.params.id);
    return ok(res, { success: true });
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(res, err.message, err.status);
    next(err);
  }
}
