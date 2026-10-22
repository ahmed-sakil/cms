import { Router } from "express";
import { PublicController } from "./public.controller.js";
import { AcademicOpsController } from "../academic-ops/academic-ops.controller.js";
import { BatchController } from "../batches/batch.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { admissionInquirySchema } from "../../schemas/index.js";

const router = Router();

router.get("/landing", PublicController.getLandingData);
router.get("/branches", PublicController.getBranches);
router.get("/notices", AcademicOpsController.getPublicNotices);
router.post("/inquiries", validateRequest(admissionInquirySchema), PublicController.submitInquiry);

// Public Batch Discovery & Curriculum Exploration
router.get("/classes", BatchController.listClasses);
router.get("/batches", BatchController.listBatches);
router.get("/batches/:id", BatchController.getBatch);

// Public Exam Standings & Reviews
router.get("/exam-results", PublicController.getExamResults);
router.post("/reviews", PublicController.submitReview);
router.get("/testimonials", PublicController.listTestimonials);

// Public Faculty Tips & Guides
router.get("/tips", PublicController.listTips);
router.get("/tips/:id", PublicController.getTipById);

export default router;
