import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase';
import { AdminAuthError } from '../adminAuth/admin-auth.service';
import type { CreateRolePayload, UpdateRolePayload, CreateAdminPayload, UpdateAdminPayload } from './rbac.schema';

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminListItem {
  id: string;
  email: string;
  role: string;
  role_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

// ── Roles ───────────────────────────────────────────────────
export async function listRoles(): Promise<RoleRecord[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('is_system_role', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoleRecord[];
}

export async function getRole(id: string): Promise<RoleRecord> {
  const { data, error } = await supabase.from('roles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Role not found', 404);
  return data as RoleRecord;
}

export async function createRole(payload: CreateRolePayload): Promise<RoleRecord> {
  const { data, error } = await supabase
    .from('roles')
    .insert({
      name: payload.name,
      description: payload.description ?? '',
      permissions: payload.permissions,
      is_system_role: false,
    })
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw new AdminAuthError('Role name already exists', 409);
    throw error;
  }
  if (!data) throw new AdminAuthError('Role create failed', 500);
  return data as RoleRecord;
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<RoleRecord> {
  const role = await getRole(id);
  if (role.is_system_role && payload.permissions === undefined && payload.description === undefined) {
    return role;
  }
  if (role.is_system_role && payload.permissions !== undefined) {
    throw new AdminAuthError('System role permissions cannot be modified', 403);
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.description !== undefined) patch.description = payload.description;
  if (payload.permissions !== undefined) patch.permissions = payload.permissions;

  const { data, error } = await supabase.from('roles').update(patch).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Role not found', 404);
  return data as RoleRecord;
}

export async function deleteRole(id: string): Promise<void> {
  const role = await getRole(id);
  if (role.is_system_role) throw new AdminAuthError('System role cannot be deleted', 403);

  const { count, error: countErr } = await supabase
    .from('admins')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', id);
  if (countErr) throw countErr;
  if ((count ?? 0) > 0) throw new AdminAuthError('Role is assigned to admins — reassign first', 409);

  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw error;
}

// ── Admins ──────────────────────────────────────────────────
export async function listAdmins(): Promise<AdminListItem[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, role, role_id, is_active, last_login_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminListItem[];
}

export async function createAdmin(payload: CreateAdminPayload): Promise<AdminListItem> {
  const email = payload.email.toLowerCase();
  const role = await getRole(payload.roleId);

  const { data: existing, error: selErr } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) throw new AdminAuthError('Email already in use', 409);

  const password_hash = await bcrypt.hash(payload.password, 10);
  const { data, error } = await supabase
    .from('admins')
    .insert({
      email,
      password_hash,
      role: role.name,
      role_id: role.id,
      is_active: true,
    })
    .select('id, email, role, role_id, is_active, last_login_at, created_at')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Admin create failed', 500);
  return data as AdminListItem;
}

export async function updateAdmin(
  id: string,
  actingAdminId: string,
  payload: UpdateAdminPayload,
): Promise<AdminListItem> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (payload.email !== undefined) {
    const email = payload.email.toLowerCase();
    const { data: existing, error: selErr } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing && existing.id !== id) throw new AdminAuthError('Email already in use', 409);
    patch.email = email;
  }

  if (payload.roleId !== undefined) {
    const role = await getRole(payload.roleId);
    patch.role_id = role.id;
    patch.role = role.name;
  }

  if (payload.isActive !== undefined) {
    if (id === actingAdminId && payload.isActive === false) {
      throw new AdminAuthError('You cannot deactivate your own account', 400);
    }
    patch.is_active = payload.isActive;
  }

  if (payload.password !== undefined) {
    patch.password_hash = await bcrypt.hash(payload.password, 10);
  }

  const { data, error } = await supabase
    .from('admins')
    .update(patch)
    .eq('id', id)
    .select('id, email, role, role_id, is_active, last_login_at, created_at')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Admin not found', 404);
  return data as AdminListItem;
}

export async function deleteAdmin(id: string, actingAdminId: string): Promise<void> {
  if (id === actingAdminId) throw new AdminAuthError('You cannot delete your own account', 400);
  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) throw error;
}
