import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: true,
      message: "Validation error",
      data: err.flatten().fieldErrors,
      status: 400,
    });
    return;
  }

  logger.error(err.message, { stack: err.stack });

  res.status(500).json({
    error: true,
    message: "Internal server error",
    data: null,
    status: 500,
  });
}
