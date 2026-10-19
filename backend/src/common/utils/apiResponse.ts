import type { Response } from "express";
import type { ApiResponse } from "../../types/index.js";

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors: Record<string, string[]> | string | null = null
  ): Response {
    const payload: ApiResponse = {
      success: false,
      message,
      errors,
    };
    return res.status(statusCode).json(payload);
  }
}
