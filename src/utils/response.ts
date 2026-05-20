import { Response } from "express";
import type { PaginationType } from "../types";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    error: false,
    message: "Success",
    data,
    status,
  });
}

export function okPaginated<T>(
  res: Response,
  data: T[],
  meta: { total: number; page: number; limit: number },
  status = 200,
) {
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;
  const pagination: PaginationType = {
    totalData: meta.total,
    totalPages,
    currentPage: meta.page,
    limit: meta.limit,
    hasNextPage: meta.page < totalPages,
    hasPrevPage: meta.page > 1,
  };
  return res.status(status).json({
    error: false,
    message: "Success",
    data,
    pagination,
    status,
  });
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({
    error: true,
    message,
    data: null,
    status,
  });
}
