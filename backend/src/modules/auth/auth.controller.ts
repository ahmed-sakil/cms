import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      ResponseUtil.success(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  static async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.registerStudent(req.body);
      ResponseUtil.success(res, result, "Registration successful! Welcome to the portal.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const user = await AuthService.getProfile(req.user.userId);
      ResponseUtil.success(res, user, "Profile retrieved");
    } catch (error) {
      next(error);
    }
  }
}
