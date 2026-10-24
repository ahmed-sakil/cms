import type { Request, Response, NextFunction } from "express";
import { TeacherService } from "./teacher.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

export class TeacherController {
  // Public Applicant Entry
  static async registerApplicant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TeacherService.registerApplicant(req.body);
      ResponseUtil.success(res, data, "Teacher applicant registered successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const application = await TeacherService.submitApplication(req.user.userId, req.body);
      ResponseUtil.success(res, application, "Application submitted for review", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const status = await TeacherService.getApplicationStatus(req.user.userId);
      ResponseUtil.success(res, status, "Application status retrieved");
    } catch (error) {
      next(error);
    }
  }

  // Teacher Protected Endpoints
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const dashboard = await TeacherService.getDashboard(req.user.userId);
      ResponseUtil.success(res, dashboard, "Teacher dashboard data retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async getBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const batches = await TeacherService.getAssignedBatches(req.user.userId);
      ResponseUtil.success(res, batches, "Assigned batches retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async getBatchDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const batch = await TeacherService.getBatchDetails(req.user.userId, req.params.id);
      ResponseUtil.success(res, batch, "Batch details retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async updateBatchRoutine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await TeacherService.updateBatchRoutine(req.user.userId, req.params.id, req.body);
      ResponseUtil.success(res, updated, "Batch routine and curriculum updated");
    } catch (error) {
      next(error);
    }
  }

  static async getBatchAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const attendance = await TeacherService.getBatchAttendance(req.user.userId, req.params.id, date);
      ResponseUtil.success(res, attendance, "Batch attendance sheet retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async recordBatchAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await TeacherService.recordBatchAttendance(req.user.userId, req.params.id, req.body);
      ResponseUtil.success(res, result, "Batch attendance recorded successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const exams = await TeacherService.getTeacherExams(req.user.userId);
      ResponseUtil.success(res, exams, "Faculty exams retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async getExamDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const exam = await TeacherService.getExamDetails(req.user.userId, req.params.id);
      ResponseUtil.success(res, exam, "Exam details retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const exam = await TeacherService.createExam(req.user.userId, req.body);
      ResponseUtil.success(res, exam, "Exam created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async submitExamMarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await TeacherService.submitExamMarks(req.user.userId, req.params.id, req.body);
      ResponseUtil.success(res, result, "Marks submitted and evaluated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async toggleExamPublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { isPublished } = req.body;
      const updated = await TeacherService.toggleExamPublish(req.user.userId, req.params.id, !!isPublished);
      ResponseUtil.success(res, updated, `Exam result ${isPublished ? "published" : "unpublished"}`);
    } catch (error) {
      next(error);
    }
  }

  static async getMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const materials = await TeacherService.getTeacherMaterials(req.user.userId);
      ResponseUtil.success(res, materials, "Study materials retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const material = await TeacherService.createTeacherMaterial(req.user.userId, req.body);
      ResponseUtil.success(res, material, "Study material published successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const notices = await TeacherService.getTeacherNotices(req.user.userId);
      ResponseUtil.success(res, notices, "Teacher notices retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const notice = await TeacherService.createTeacherNotice(req.user.userId, req.body);
      ResponseUtil.success(res, notice, "Course notice published successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await TeacherService.deleteTeacherNotice(req.user.userId, req.params.id);
      ResponseUtil.success(res, null, "Notice deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getTips(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tips = await TeacherService.getTeacherTips();
      ResponseUtil.success(res, tips, "Faculty tips retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createTip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const tip = await TeacherService.createTeacherTip(req.user.userId, req.body);
      ResponseUtil.success(res, tip, "Faculty article submitted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const teacher = await TeacherService.getTeacherProfile(req.user.userId);
      ResponseUtil.success(res, teacher, "Faculty profile retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await TeacherService.updateProfile(req.user.userId, req.body);
      ResponseUtil.success(res, updated, "Faculty profile updated");
    } catch (error) {
      next(error);
    }
  }
}
