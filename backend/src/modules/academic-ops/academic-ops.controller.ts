import type { Request, Response, NextFunction } from "express";
import { AcademicOpsService } from "./academic-ops.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

export class AcademicOpsController {
  // 1. Notices
  static async listNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, batchId, isPublic } = req.query;
      const notices = await AcademicOpsService.listNotices({
        branchId: branchId as string | undefined,
        batchId: batchId as string | undefined,
        isPublic: isPublic !== undefined ? isPublic === "true" : undefined,
      });
      ResponseUtil.success(res, notices, "Notices retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getPublicNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const notices = await AcademicOpsService.getPublicNotices(limit);
      ResponseUtil.success(res, notices, "Public notices retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notice = await AcademicOpsService.createNotice(req.body, req.user);
      ResponseUtil.success(res, notice, "Notice published successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notice = await AcademicOpsService.updateNotice(req.params.id, req.body);
      ResponseUtil.success(res, notice, "Notice updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await AcademicOpsService.deleteNotice(req.params.id, req.user);
      ResponseUtil.success(res, null, "Notice deleted successfully");
    } catch (error) {
      next(error);
    }
  }


  static async togglePinNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notice = await AcademicOpsService.togglePin(req.params.id);
      ResponseUtil.success(res, notice, "Notice pin status updated");
    } catch (error) {
      next(error);
    }
  }

  // 2. Exams
  static async listExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId, branchId } = req.query;
      const exams = await AcademicOpsService.listExams({
        batchId: batchId as string | undefined,
        branchId: branchId as string | undefined,
      });
      ResponseUtil.success(res, exams, "Exams retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await AcademicOpsService.getExam(req.params.id);
      ResponseUtil.success(res, exam, "Exam details retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await AcademicOpsService.createExam(req.body);
      ResponseUtil.success(res, exam, "Exam scheduled successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await AcademicOpsService.updateExam(req.params.id, req.body);
      ResponseUtil.success(res, exam, "Exam updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AcademicOpsService.deleteExam(req.params.id);
      ResponseUtil.success(res, null, "Exam cancelled and deleted");
    } catch (error) {
      next(error);
    }
  }

  static async submitExamMarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await AcademicOpsService.submitExamMarks(req.params.id, req.body);
      ResponseUtil.success(
        res,
        results,
        `Marks calculated and ${results.length} student ranks assigned`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // 3. Student Exam & Referral Self-Service
  static async getStudentExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const results = await AcademicOpsService.getStudentExamHistory(req.user.userId);
      ResponseUtil.success(res, results, "Student exam history retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async getStudentReferralProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const profile = await AcademicOpsService.getStudentReferralProfile(req.user.userId);
      ResponseUtil.success(res, profile, "Referral profile retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async requestReferralPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payout = await AcademicOpsService.requestReferralPayout(req.user.userId, req.body);
      ResponseUtil.success(res, payout, "Payout request submitted for approval", 201);
    } catch (error) {
      next(error);
    }
  }

  // 4. Admin Referral Management
  static async listReferralPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const payouts = await AcademicOpsService.listReferralPayouts(status as string | undefined);
      ResponseUtil.success(res, payouts, "Referral payout requests retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async settleReferralPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const processedById = req.user?.userId;
      const payout = await AcademicOpsService.settleReferralPayout(
        req.params.id,
        req.body,
        processedById
      );
      ResponseUtil.success(res, payout, "Referral payout settled successfully");
    } catch (error) {
      next(error);
    }
  }
}
