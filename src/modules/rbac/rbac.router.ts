import { Router } from 'express';
import { adminJwtAuth, requirePermission } from '../../middleware/adminAuth';
import * as controller from './rbac.controller';

export const rbacRouter: Router = Router();

rbacRouter.use(adminJwtAuth);

// Permission catalog (anyone with rbac.view)
rbacRouter.get('/permissions', requirePermission('admin.rbac.view'), controller.listPermissions);

// Roles
rbacRouter.get('/roles', requirePermission('admin.rbac.view'), controller.listRoles);
rbacRouter.post('/roles', requirePermission('admin.rbac.manage'), controller.createRole);
rbacRouter.patch('/roles/:id', requirePermission('admin.rbac.manage'), controller.updateRole);
rbacRouter.delete('/roles/:id', requirePermission('admin.rbac.manage'), controller.deleteRole);

// Admins
rbacRouter.get('/admins', requirePermission('admin.admin.view_list'), controller.listAdmins);
rbacRouter.post('/admins', requirePermission('admin.admin.create'), controller.createAdmin);
rbacRouter.patch('/admins/:id', requirePermission('admin.admin.edit'), controller.updateAdmin);
rbacRouter.delete('/admins/:id', requirePermission('admin.admin.delete'), controller.deleteAdmin);
