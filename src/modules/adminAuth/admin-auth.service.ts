import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { supabase } from '../../config/supabase';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET ?? env.JWT_SECRET;
const ADMIN_JWT_EXPIRES_IN = env.ADMIN_JWT_EXPIRES_IN;

export interface AdminRecord {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  role_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminClaims {
  sub: string;
  email: string;
  role: string;
  roleId: string;
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

async function loadRoleById(roleId: string): Promise<{ id: string; name: string; permissions: string[] }> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, permissions')
    .eq('id', roleId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Role not found', 500);
  return data as { id: string; name: string; permissions: string[] };
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

  const role = await loadRoleById(admin.role_id);

  const token = signAdminToken({
    sub: admin.id,
    email: admin.email,
    role: role.name,
    roleId: role.id,
    permissions: role.permissions,
  });

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: role.name,
      roleId: role.id,
      permissions: role.permissions,
    },
  };
}

export async function getById(id: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, role, role_id, is_active, last_login_at, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AdminAuthError('Admin not found', 404);

  const admin = data as Omit<AdminRecord, 'password_hash' | 'updated_at'>;
  const role = await loadRoleById(admin.role_id);

  return {
    id: admin.id,
    email: admin.email,
    role: role.name,
    role_id: role.id,
    permissions: role.permissions,
    is_active: admin.is_active,
    last_login_at: admin.last_login_at,
    created_at: admin.created_at,
  };
}

export async function updateEmail(id: string, email: string) {
  const normalized = email.toLowerCase();

  const { data: existing, error: selErr } = await supabase
    .from('admins')
    .select('id')
    .eq('email', normalized)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing && existing.id !== id) throw new AdminAuthError('Email already in use', 409);

  const { data, error } = await supabase
    .from('admins')
    .update({ email: normalized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, email, role, role_id, is_active, last_login_at, created_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AdminAuthError('Admin not found', 404);
  return data;
}

export async function changePassword(id: string, currentPassword: string, newPassword: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, password_hash')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AdminAuthError('Admin not found', 404);

  const match = await bcrypt.compare(currentPassword, data.password_hash);
  if (!match) throw new AdminAuthError('Current password is incorrect', 401);

  const password_hash = await bcrypt.hash(newPassword, 10);
  const { error: updErr } = await supabase
    .from('admins')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updErr) throw updErr;
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

  const { data: role, error: roleErr } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'super_admin')
    .maybeSingle();

  if (roleErr || !role) {
    logger.error('Bootstrap: super_admin role missing — run RBAC migration', { err: roleErr });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { error: insErr } = await supabase.from('admins').insert({
    email,
    password_hash,
    role: 'super_admin',
    role_id: role.id,
    is_active: true,
  });

  if (insErr) {
    logger.error('Admin bootstrap insert failed', { err: insErr });
    return;
  }
  logger.info('Default admin created as super_admin', { email });
}
