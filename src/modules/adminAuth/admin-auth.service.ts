import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { supabase } from '../../config/supabase';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { ROLE_PERMISSIONS, type AdminRole } from './admin-auth.schema';

const ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET ?? env.JWT_SECRET;
const ADMIN_JWT_EXPIRES_IN = env.ADMIN_JWT_EXPIRES_IN;

export interface AdminRecord {
  id: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminClaims {
  sub: string;
  email: string;
  role: AdminRole;
  permissions: readonly string[];
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AdminAuthError';
    this.status = status;
  }
}

function getPermissionsForRole(role: AdminRole): readonly string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function signAdminToken(claims: AdminClaims): string {
  return jwt.sign(claims, ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAdminToken(token: string): AdminClaims {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminClaims;
    return decoded;
  } catch {
    throw new AdminAuthError('Invalid or expired admin token', 401);
  }
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AdminAuthError('Invalid email or password', 401);

  const admin = data as AdminRecord;
  if (!admin.is_active) throw new AdminAuthError('Account disabled', 403);

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) throw new AdminAuthError('Invalid email or password', 401);

  await supabase
    .from('admins')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  const permissions = getPermissionsForRole(admin.role);
  const token = signAdminToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    permissions,
  });

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions,
    },
  };
}

export async function getById(id: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, role, is_active, last_login_at, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AdminAuthError('Admin not found', 404);
  return data;
}

export async function bootstrapDefaultAdmin() {
  const email = env.DEFAULT_ADMIN_EMAIL.toLowerCase();
  const password = env.DEFAULT_ADMIN_PASSWORD;

  const { data: existing, error: selErr } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (selErr) {
    logger.error('Admin bootstrap select failed', { err: selErr });
    return;
  }

  if (existing) {
    logger.info('Default admin already exists', { email });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { error: insErr } = await supabase.from('admins').insert({
    email,
    password_hash,
    role: 'admin',
    is_active: true,
  });

  if (insErr) {
    logger.error('Admin bootstrap insert failed', { err: insErr });
    return;
  }
  logger.info('Default admin created', { email });
}

export { ROLE_PERMISSIONS } from './admin-auth.schema';
