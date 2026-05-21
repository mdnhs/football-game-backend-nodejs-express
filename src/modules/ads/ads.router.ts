import { Router } from 'express';
import { adminJwtAuth, requirePermission } from '../../middleware/adminAuth';
import * as controller from './ads.controller';

// Admin-only CRUD
export const adsAdminRouter: Router = Router();
adsAdminRouter.use(adminJwtAuth);

adsAdminRouter.get('/', requirePermission('admin.ad.view_list'), controller.listAds);
adsAdminRouter.get('/:id', requirePermission('admin.ad.view_list'), controller.getAd);
adsAdminRouter.post('/', requirePermission('admin.ad.create'), controller.createAd);
adsAdminRouter.patch('/:id', requirePermission('admin.ad.edit'), controller.updateAd);
adsAdminRouter.delete('/:id', requirePermission('admin.ad.delete'), controller.deleteAd);

// Public — returns active ads only
export const adsPublicRouter: Router = Router();
adsPublicRouter.get('/', controller.publicList);
