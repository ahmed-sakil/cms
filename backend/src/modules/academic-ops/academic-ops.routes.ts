import { Router } from "express";
import { AcademicOpsController } from "./academic-ops.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createNoticeSchema,
  updateNoticeSchema,
  createExamSchema,
  updateExamSchema,
  submitExamMarksSchema,
  settleReferralPayoutSchema,
} from "./academic-ops.schema.js";
import { UserRole } from "../../types/index.js";

const router = Router();

// ==========================================
// NOTICES
// ==========================================
// Authenticated notice list (includes private batch notices)
router.get("/notices", authGuard, AcademicOpsController.listNotices);
router.post(
  "/notices",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(createNoticeSchema),
  AcademicOpsController.createNotice
);
router.put(
  "/notices/:id",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(updateNoticeSchema),
  AcademicOpsController.updateNotice
);
router.delete(
  "/notices/:id",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  AcademicOpsController.deleteNotice
);
router.patch(
  "/notices/:id/pin",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  AcademicOpsController.togglePinNotice
);

// ==========================================
// EXAMS & RESULTS
// ==========================================
router.get("/exams", authGuard, AcademicOpsController.listExams);
router.get("/exams/:id", authGuard, AcademicOpsController.getExam);
router.post(
  "/exams",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER]),
  validateRequest(createExamSchema),
  AcademicOpsController.createExam
);
router.put(
  "/exams/:id",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER]),
  validateRequest(updateExamSchema),
  AcademicOpsController.updateExam
);
router.delete(
  "/exams/:id",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  AcademicOpsController.deleteExam
);
router.post(
  "/exams/:id/marks",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER]),
  validateRequest(submitExamMarksSchema),
  AcademicOpsController.submitExamMarks
);

// ==========================================
// ADMIN REFERRALS MANAGEMENT
// ==========================================
router.get(
  "/referrals/payouts",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  AcademicOpsController.listReferralPayouts
);
router.patch(
  "/referrals/payouts/:id",
  authGuard,
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(settleReferralPayoutSchema),
  AcademicOpsController.settleReferralPayout
);

export default router;
