import { Router } from "express";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import {
  createQr,
  listQr,
  deactivateQr,
  activateQr,
  statsQr,
  scanRedirect,
} from "./qr.controller";

export const qrAdminRouter = Router();

qrAdminRouter.use(adminAuthMiddleware);

qrAdminRouter.post("/", createQr);
qrAdminRouter.get("/", listQr);
qrAdminRouter.get("/:id/stats", statsQr);
qrAdminRouter.patch("/:id/deactivate", deactivateQr);
qrAdminRouter.patch("/:id/activate", activateQr);

export const qrPublicRouter = Router();
qrPublicRouter.get("/:ref", scanRedirect);
