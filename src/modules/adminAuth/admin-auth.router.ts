import { Router } from 'express';
import { adminJwtAuth } from '../../middleware/adminAuth';
import * as controller from './admin-auth.controller';

export const adminAuthRouter: Router = Router();

adminAuthRouter.post('/login', controller.login);
adminAuthRouter.get('/me', adminJwtAuth, controller.me);
