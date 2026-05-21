import { Router } from "express";
import { adminJwtAuth, requirePermission } from "../../middleware/adminAuth";
import {
  createQr,
  listQr,
  deactivateQr,
  activateQr,
  statsQr,
  scanRedirect,
} from "./qr.controller";

export const qrAdminRouter = Router();

qrAdminRouter.use(adminJwtAuth);

qrAdminRouter.post("/", requirePermission("admin.qr.create"), createQr);
qrAdminRouter.get("/", requirePermission("admin.qr.view_list"), listQr);
qrAdminRouter.get("/:id/stats", requirePermission("admin.qr.view_list"), statsQr);
qrAdminRouter.patch("/:id/deactivate", requirePermission("admin.qr.create"), deactivateQr);
qrAdminRouter.patch("/:id/activate", requirePermission("admin.qr.create"), activateQr);

export const qrPublicRouter = Router();
qrPublicRouter.get("/:ref", scanRedirect);
