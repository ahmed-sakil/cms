import type { Request, Response, NextFunction } from "express";
import { PublicService } from "./public.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";

export class PublicController {
  static async getLandingData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PublicService.getLandingData();
      ResponseUtil.success(res, data, "Landing page data fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  static async submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PublicService.submitInquiry(req.body);
      ResponseUtil.success(res, result, "Your inquiry has been submitted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getExamResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchId = req.query.batchId as string | undefined;
      const results = await PublicService.getPublicExamResults(batchId);
      ResponseUtil.success(res, results, "Public exam results retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PublicService.submitReview(req.body);
      ResponseUtil.success(res, result, "Thank you for your feedback!", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getBranches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await PublicService.getBranches();
      ResponseUtil.success(res, branches, "Active branches retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async listTips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const tips = await PublicService.listFacultyTips(category, search);
      ResponseUtil.success(res, tips, "Faculty tips retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getTipById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tip = await PublicService.getFacultyTipById(req.params.id);
      if (!tip) {
        ResponseUtil.error(res, "Faculty tip not found", 404);
        return;
      }
      ResponseUtil.success(res, tip, "Faculty tip retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async listTestimonials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const rating = req.query.rating ? Number(req.query.rating) : undefined;
      const data = await PublicService.listPublicTestimonials(role, rating);
      ResponseUtil.success(res, data, "Testimonials retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getTeachers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PublicService.listTeachers();
      ResponseUtil.success(res, data, "Public teachers retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getFacultyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PublicService.getFacultyPublicProfile(req.params.id);
      if (!data) {
        ResponseUtil.error(res, "Faculty member not found", 404);
        return;
      }
      ResponseUtil.success(res, data, "Faculty profile retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

