import type { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

export class AdminController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = req.query.branchId as string | undefined;
      const metrics = await AdminService.getOverviewMetrics(branchId || req.user?.branchId);
      ResponseUtil.success(res, metrics, "Admin metrics retrieved");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ORGANIZATION
  // ==========================================
  static async getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.user?.institutionId || "";
      const organization = await AdminService.getOrganizationSettings(institutionId);
      ResponseUtil.success(res, organization, "Organization settings retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.user?.institutionId || "";
      const updated = await AdminService.updateOrganizationSettings(institutionId, req.body);
      ResponseUtil.success(res, updated, "Organization settings and payment channels updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // BRANCHES
  // ==========================================
  static async listBranches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await AdminService.listBranches();
      ResponseUtil.success(res, branches, "Branches retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const branch = await AdminService.createBranch(req.user.institutionId, req.body);
      ResponseUtil.success(res, branch, "Branch created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateBranch(req.params.id, req.body, req.user);
      ResponseUtil.success(res, updated, "Branch updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async setMainBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.setMainBranch(req.params.id);
      ResponseUtil.success(res, updated, "Branch designated as Main Campus (Headquarters)");
    } catch (error) {
      next(error);
    }
  }

  static async toggleBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.toggleBranchStatus(req.params.id);
      ResponseUtil.success(res, updated, `Branch ${updated.isActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.deleteBranch(req.params.id, req.user);
      ResponseUtil.success(res, result, "Branch deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // TEACHERS
  // ==========================================
  static async listTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId =
        req.user?.role === "SUPER_ADMIN"
          ? (req.query.branchId as string) || undefined
          : req.user?.branchId || undefined;
      const teachers = await AdminService.listTeachers(branchId);
      ResponseUtil.success(res, teachers, "Teachers retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const teacher = await AdminService.createTeacher(req.user.institutionId, req.body, req.user);
      ResponseUtil.success(res, teacher, "Faculty admitted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacher = await AdminService.updateTeacher(req.params.id, req.body, req.user);
      ResponseUtil.success(res, teacher, "Faculty profile updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // STAFF
  // ==========================================
  static async listStaffs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId =
        req.user?.role === "SUPER_ADMIN"
          ? (req.query.branchId as string) || undefined
          : req.user?.branchId || undefined;
      const staffs = await AdminService.listStaffs(branchId);
      ResponseUtil.success(res, staffs, "Staff members retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const staff = await AdminService.createStaff(req.user.institutionId, req.body, req.user);
      ResponseUtil.success(res, staff, "Staff member created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await AdminService.updateStaff(req.params.id, req.body, req.user);
      ResponseUtil.success(res, staff, "Staff member updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // STUDENTS
  // ==========================================
  static async createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const student = await AdminService.createStudent(req.body, req.user.institutionId, req.user);
      ResponseUtil.success(res, student, "Student admitted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, search, page, limit } = req.query;
      const isBranchScoped = req.user?.role === "BRANCH_ADMIN";
      const effectiveBranchId = (isBranchScoped
        ? req.user?.branchId
        : (branchId as string)) || undefined;

      const result = await AdminService.listStudents({
        branchId: effectiveBranchId,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      ResponseUtil.success(res, result, "Students retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async getStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await AdminService.getStudentById(req.params.id);
      ResponseUtil.success(res, student, "Student retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateStudent(req.params.id, req.body, req.user);
      ResponseUtil.success(res, updated, "Student updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.deleteStudent(req.params.id, req.user);
      ResponseUtil.success(res, result, "Student account deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // ========================================================
  // TESTIMONIALS MODERATION
  // ========================================================
  static async listTestimonials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isApproved =
        req.query.isApproved === "true"
          ? true
          : req.query.isApproved === "false"
          ? false
          : undefined;
      const list = await AdminService.listTestimonials(isApproved);
      ResponseUtil.success(res, list, "Testimonials retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async updateTestimonialStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isApproved } = req.body;
      const updated = await AdminService.updateTestimonialStatus(req.params.id, Boolean(isApproved));
      ResponseUtil.success(res, updated, `Testimonial ${isApproved ? "approved" : "unapproved"}`);
    } catch (error) {
      next(error);
    }
  }

  static async createTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await AdminService.createTestimonial(req.body);
      ResponseUtil.success(res, created, "Testimonial created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateTestimonial(req.params.id, req.body);
      ResponseUtil.success(res, updated, "Testimonial updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteTestimonial(req.params.id);
      ResponseUtil.success(res, null, "Testimonial deleted");
    } catch (error) {
      next(error);
    }
  }

  // ========================================================
  // STUDENT ACHIEVEMENTS (HALL OF FAME)
  // ========================================================
  static async listAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const isFeatured =
        req.query.isFeatured === "true"
          ? true
          : req.query.isFeatured === "false"
          ? false
          : undefined;
      const list = await AdminService.listAchievements(search, isFeatured);
      ResponseUtil.success(res, list, "Student achievements retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await AdminService.createAchievement(req.body);
      ResponseUtil.success(res, created, "Student achievement created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateAchievement(req.params.id, req.body);
      ResponseUtil.success(res, updated, "Student achievement updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async toggleAchievementFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isFeatured } = req.body;
      const updated = await AdminService.toggleAchievementFeatured(req.params.id, Boolean(isFeatured));
      ResponseUtil.success(res, updated, `Achievement featured status updated`);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteAchievement(req.params.id);
      ResponseUtil.success(res, null, "Student achievement deleted");
    } catch (error) {
      next(error);
    }
  }

  // ========================================================
  // FACULTY TIPS & ACADEMIC GUIDES
  // ========================================================
  static async listFacultyTips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const isPublished =
        req.query.isPublished === "true"
          ? true
          : req.query.isPublished === "false"
          ? false
          : undefined;
      const list = await AdminService.listFacultyTips(search, category, isPublished);
      ResponseUtil.success(res, list, "Faculty tips retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createFacultyTip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await AdminService.createFacultyTip(req.body);
      ResponseUtil.success(res, created, "Faculty tip created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateFacultyTip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateFacultyTip(req.params.id, req.body);
      ResponseUtil.success(res, updated, "Faculty tip updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async toggleFacultyTipPublished(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isPublished } = req.body;
      const updated = await AdminService.toggleFacultyTipPublished(req.params.id, Boolean(isPublished));
      ResponseUtil.success(res, updated, "Faculty tip publication status updated");
    } catch (error) {
      next(error);
    }
  }

  static async deleteFacultyTip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteFacultyTip(req.params.id);
      ResponseUtil.success(res, null, "Faculty tip deleted");
    } catch (error) {
      next(error);
    }
  }
}

