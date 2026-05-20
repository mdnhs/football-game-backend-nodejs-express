import { Request, Response, NextFunction } from "express";
import { createQrSchema } from "./qr.schema";
import {
  createQrCode,
  listQrCodes,
  deactivateQrCode,
  activateQrCode,
  getQrStats,
  recordScan,
  QrNotFoundError,
  QrRefConflictError,
} from "./qr.service";
import { parsePagination } from "../../utils/pagination";
import { ok, fail } from "../../utils/response";

export async function createQr(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = createQrSchema.parse(req.body);
    const qr = await createQrCode(input);
    ok(res, qr, 201);
  } catch (err) {
    if (err instanceof QrRefConflictError) {
      fail(res, err.message, 409);
      return;
    }
    next(err);
  }
}

export async function listQr(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = parsePagination(req);
    const result = await listQrCodes(page, limit);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deactivateQr(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await deactivateQrCode(String(req.params.id));
    ok(res, { active: false });
  } catch (err) {
    next(err);
  }
}

export async function activateQr(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await activateQrCode(String(req.params.id));
    ok(res, { active: true });
  } catch (err) {
    next(err);
  }
}

export async function statsQr(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await getQrStats(String(req.params.id));
    ok(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function scanRedirect(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const ref = String(req.params.ref);
    const target = await recordScan(ref);
    res.redirect(302, target);
  } catch (err) {
    if (err instanceof QrNotFoundError) {
      res.status(404).send("QR code not found or inactive");
      return;
    }
    next(err);
  }
}
