import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, type AdminClaims } from '../modules/adminAuth/admin-auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminClaims;
  }
}

export function adminJwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: true, message: 'Missing admin token', data: null, status: 401 });
    return;
  }
  const token = header.slice(7).trim();
  try {
    const claims = verifyAdminToken(token);
    req.admin = claims;
    next();
  } catch {
    res.status(401).json({ error: true, message: 'Invalid or expired admin token', data: null, status: 401 });
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const perms = req.admin?.permissions ?? [];
    const granted = perms.includes(permission);
    if (!granted) {
      res.status(403).json({ error: true, message: 'Permission denied', data: null, status: 403 });
      return;
    }
    next();
  };
}

// Back-compat alias — drop after all routes migrate
export const adminAuthMiddleware = adminJwtAuth;
