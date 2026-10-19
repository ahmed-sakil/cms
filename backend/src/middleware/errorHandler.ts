import type { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors/appError.js";
import { ResponseUtil } from "../common/utils/apiResponse.js";
import { ENV } from "../config/env.js";

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Handle unexpected internal server errors
  console.error("Unhandled Error:", err);
  const message =
    ENV.NODE_ENV === "production" ? "Internal server error" : err.message || "Internal server error";

  ResponseUtil.error(res, message, 500);
};
