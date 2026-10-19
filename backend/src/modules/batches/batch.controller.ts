import type { Request, Response, NextFunction } from "express";
import { BatchService } from "./batch.service.js";
import { AcademicClassService } from "./academicClass.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError, ForbiddenError } from "../../common/errors/appError.js";
import { prisma } from "../../config/prisma.js";
import type { BatchStatus, ClassCategory } from "@prisma/client";

export class BatchController {
  // ==========================================
  // ACADEMIC CLASSES
  // ==========================================
  static async listClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as ClassCategory | undefined;
      const classes = await AcademicClassService.listClasses(category);
      ResponseUtil.success(res, classes, "Academic classes retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await AcademicClassService.createClass(req.body);
      ResponseUtil.success(res, item, "Academic class created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await AcademicClassService.updateClass(req.params.id, req.body);
      ResponseUtil.success(res, item, "Academic class updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AcademicClassService.deleteClass(req.params.id);
      ResponseUtil.success(res, null, "Academic class removed successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // COURSES (ONLINE / ACADEMIC CURRICULA)
  // ==========================================
  static async listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = (req.query.branchId as string) || req.user?.branchId || undefined;
      const courses = await BatchService.listCourses(branchId);
      ResponseUtil.success(res, courses, "Courses retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const course = await BatchService.createCourse(req.body, req.user.branchId || undefined);
      ResponseUtil.success(res, course, "Course registered successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // OFFLINE BATCHES
  // ==========================================
  static async listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, courseId, academicClassId, status, isPublicOnly } = req.query;
      const effectiveBranchId = (branchId as string) || req.user?.branchId || undefined;

      const batches = await BatchService.listBatches({
        branchId: effectiveBranchId,
        courseId: courseId as string | undefined,
        academicClassId: academicClassId as string | undefined,
        status: status as BatchStatus | undefined,
        isPublicOnly: isPublicOnly === "true",
      });

      ResponseUtil.success(res, batches, "Batches retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await BatchService.getBatch(req.params.id);
      ResponseUtil.success(res, batch, "Batch details retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      if (req.user.role === "BRANCH_ADMIN") {
        if (req.user.branchId && req.body.branchId && req.body.branchId !== req.user.branchId) {
          throw new ForbiddenError("Branch administrators can only create batches for their assigned campus.");
        }
        req.body.branchId = req.user.branchId || req.body.branchId;
      }

      const batch = await BatchService.createBatch(req.body, req.user.branchId || undefined);
      ResponseUtil.success(res, batch, "Batch scheduled successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === "BRANCH_ADMIN") {
        const existing = await prisma.batch.findUnique({
          where: { id: req.params.id },
          select: { branchId: true },
        });
        if (existing && req.user.branchId && existing.branchId !== req.user.branchId) {
          throw new ForbiddenError("Branch administrators cannot modify batches of other campuses.");
        }
        if (req.body.branchId && req.body.branchId !== req.user.branchId) {
          delete req.body.branchId;
        }
      }

      const updated = await BatchService.updateBatch(req.params.id, req.body);
      ResponseUtil.success(res, updated, "Batch details updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === "BRANCH_ADMIN") {
        const existing = await prisma.batch.findUnique({
          where: { id: req.params.id },
          select: { branchId: true },
        });
        if (existing && req.user.branchId && existing.branchId !== req.user.branchId) {
          throw new ForbiddenError("Branch administrators cannot delete batches of other campuses.");
        }
      }

      await BatchService.deleteBatch(req.params.id);
      ResponseUtil.success(res, null, "Batch cancelled successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // STUDENT SELF-ENROLLMENT
  // ==========================================
  static async selfEnrollBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await BatchService.selfEnrollBatch(req.params.id, req.user.userId, req.body);
      ResponseUtil.success(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN APPLICATION VERIFICATION DESK
  // ==========================================
  static async listPendingEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = (req.query.branchId as string) || req.user?.branchId || undefined;
      const items = await BatchService.listPendingEnrollments(branchId);
      ResponseUtil.success(res, items, "Pending enrollment requests retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async verifyEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { action, adminNotes } = req.body;
      const result = await BatchService.verifyEnrollment(
        req.params.id,
        action,
        req.user.userId,
        adminNotes
      );
      ResponseUtil.success(res, result.enrollment, result.message);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // DIRECT ROSTER MANAGEMENT
  // ==========================================
  static async listRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roster = await BatchService.listRoster(req.params.id);
      ResponseUtil.success(res, roster, "Batch student roster retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BatchService.enrollStudent(req.params.id, req.body);
      ResponseUtil.success(res, result, "Student enrolled into batch successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async removeEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await BatchService.removeEnrollment(req.params.id, req.params.studentId);
      ResponseUtil.success(res, null, "Student removed from batch");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // STUDY MATERIALS
  // ==========================================
  static async listStudyMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, courseId, batchId } = req.query;
      const materials = await BatchService.listStudyMaterials({
        branchId: branchId as string | undefined,
        courseId: courseId as string | undefined,
        batchId: batchId as string | undefined,
      });
      ResponseUtil.success(res, materials, "Study materials retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createStudyMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const material = await BatchService.createStudyMaterial(req.user.userId, req.body);
      ResponseUtil.success(res, material, "Study material shared successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudyMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await BatchService.deleteStudyMaterial(req.params.id);
      ResponseUtil.success(res, null, "Study material deleted");
    } catch (error) {
      next(error);
    }
  }

  static async getStudentMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const materials = await BatchService.getStudentMaterials(req.user.userId);
      ResponseUtil.success(res, materials, "Student study materials retrieved");
    } catch (error) {
      next(error);
    }
  }
}
