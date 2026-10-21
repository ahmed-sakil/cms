import { Router } from "express";
import { AcademicOpsController } from "./academic-ops.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { branchContext } from "../../middleware/branchContext.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createNoticeSchema,
  updateNoticeSchema,
  createExamSchema,
  updateExamSchema,
  submitExamMarksSchema,
  settleReferralPayoutSchema,
  recordAttendanceSchema,
} from "./academic-ops.schema.js";
import { UserRole } from "../../types/index.js";

const router = Router();

// Protect all academic ops routes with authGuard and branchContext
router.use(authGuard);
router.use(branchContext);

// ==========================================
// NOTICES
// ==========================================
// Authenticated notice list (includes private batch notices)
router.get("/notices", AcademicOpsController.listNotices);
router.post(
  "/notices",
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
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(settleReferralPayoutSchema),
  AcademicOpsController.settleReferralPayout
);

// ==========================================
// ATTENDANCE MANAGEMENT
// ==========================================
router.post(
  "/batches/:id/attendance",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER, UserRole.STAFF]),
  validateRequest(recordAttendanceSchema),
  AcademicOpsController.recordAttendance
);
router.get(
  "/batches/:id/attendance",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER, UserRole.STAFF]),
  AcademicOpsController.getBatchAttendance
);
router.get(
  "/student/attendance",
  roleGuard([UserRole.STUDENT]),
  AcademicOpsController.getStudentAttendance
);

export default router;
