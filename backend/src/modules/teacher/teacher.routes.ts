import { Router } from "express";
import { TeacherController } from "./teacher.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserRole } from "../../types/index.js";
import {
  teacherRegisterSchema,
  teacherApplicationSchema,
  recordTeacherAttendanceSchema,
  createTeacherExamSchema,
  submitTeacherExamMarksSchema,
  createTeacherMaterialSchema,
  createTeacherNoticeSchema,
  createTeacherTipSchema,
  updateTeacherRoutineSchema,
} from "./teacher.schema.js";

const router = Router();

// ==========================================
// 1. APPLICANT ONBOARDING (Public / Applicant)
// ==========================================
router.post(
  "/register",
  validateRequest(teacherRegisterSchema),
  TeacherController.registerApplicant
);

router.post(
  "/apply",
  authGuard,
  validateRequest(teacherApplicationSchema),
  TeacherController.submitApplication
);

router.get(
  "/application-status",
  authGuard,
  TeacherController.getApplicationStatus
);

// ==========================================
// 2. TEACHER PORTAL PROTECTED ENDPOINTS
// ==========================================
router.use(authGuard);
router.use(roleGuard([UserRole.TEACHER]));

// Dashboard
router.get("/dashboard", TeacherController.getDashboard);

// Batches & Routine
router.get("/batches", TeacherController.getBatches);
router.get("/batches/:id", TeacherController.getBatchDetails);
router.put(
  "/batches/:id/routine",
  validateRequest(updateTeacherRoutineSchema),
  TeacherController.updateBatchRoutine
);

// Attendance
router.get("/batches/:id/attendance", TeacherController.getBatchAttendance);
router.post(
  "/batches/:id/attendance",
  validateRequest(recordTeacherAttendanceSchema),
  TeacherController.recordBatchAttendance
);

// Exams & Marksheets
router.get("/exams", TeacherController.getExams);
router.get("/exams/:id", TeacherController.getExamDetails);
router.post(
  "/exams",
  validateRequest(createTeacherExamSchema),
  TeacherController.createExam
);
router.post(
  "/exams/:id/marks",
  validateRequest(submitTeacherExamMarksSchema),
  TeacherController.submitExamMarks
);
router.patch("/exams/:id/publish", TeacherController.toggleExamPublish);

// Study Materials
router.get("/materials", TeacherController.getMaterials);
router.post(
  "/materials",
  validateRequest(createTeacherMaterialSchema),
  TeacherController.createMaterial
);

// Targeted Notices
router.get("/notices", TeacherController.getNotices);
router.post(
  "/notices",
  validateRequest(createTeacherNoticeSchema),
  TeacherController.createNotice
);
router.delete("/notices/:id", TeacherController.deleteNotice);

// Faculty Tips
router.get("/tips", TeacherController.getTips);
router.post(
  "/tips",
  validateRequest(createTeacherTipSchema),
  TeacherController.createTip
);

// Profile
router.get("/profile", TeacherController.getProfile);
router.put("/profile", TeacherController.updateProfile);

export default router;
