import type { Request, Response, NextFunction } from "express";
import { StudentService } from "./student.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

export class StudentController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const data = await StudentService.getStudentDashboard(req.user.userId);
      ResponseUtil.success(res, data, "Student dashboard retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const { currentPassword, newPassword } = req.body;
      const result = await StudentService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );
      ResponseUtil.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const result = await StudentService.updateProfile(req.user.userId, req.body);
      ResponseUtil.success(res, result, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
