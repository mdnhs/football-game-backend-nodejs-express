import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  from: number;
  to: number;
}

export function parsePagination(
  req: Request,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): PaginationParams {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 50;
  const maxLimit = defaults.maxLimit ?? 200;

  const page = Math.max(1, Number(req.query.page) || defaultPage);
  const rawLimit = Number(req.query.limit) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, rawLimit));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}
