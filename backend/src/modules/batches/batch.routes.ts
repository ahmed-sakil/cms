import { Router } from "express";
import { BatchController } from "./batch.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { branchContext } from "../../middleware/branchContext.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createAcademicClassSchema,
  createCourseSchema,
  createBatchSchema,
  updateBatchSchema,
  enrollStudentSchema,
  selfEnrollBatchSchema,
  verifyEnrollmentSchema,
  createStudyMaterialSchema,
} from "./batch.schema.js";
import { recordAttendanceSchema } from "../academic-ops/academic-ops.schema.js";
import { AcademicOpsController } from "../academic-ops/academic-ops.controller.js";
import { UserRole } from "../../types/index.js";

const router = Router();

// Protect all academic routes with auth and branchContext
router.use(authGuard);
router.use(branchContext);

// ==========================================
// ACADEMIC CLASSES
// ==========================================
router.get("/classes", BatchController.listClasses);
router.post(
  "/classes",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(createAcademicClassSchema),
  BatchController.createClass
);
router.put(
  "/classes/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  BatchController.updateClass
);
router.delete(
  "/classes/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  BatchController.deleteClass
);

// ==========================================
// COURSES
// ==========================================
router.get("/courses", BatchController.listCourses);
router.post(
  "/courses",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(createCourseSchema),
  BatchController.createCourse
);

// ==========================================
// BATCHES
// ==========================================
router.get("/batches", BatchController.listBatches);
router.get("/batches/:id", BatchController.getBatch);
router.post(
  "/batches",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(createBatchSchema),
  BatchController.createBatch
);
router.put(
  "/batches/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(updateBatchSchema),
  BatchController.updateBatch
);
router.delete(
  "/batches/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  BatchController.deleteBatch
);

// ==========================================
// STUDENT SELF-ENROLLMENT
// ==========================================
router.post(
  "/batches/:id/self-enroll",
  validateRequest(selfEnrollBatchSchema),
  BatchController.selfEnrollBatch
);
router.post(
  "/batches/:id/apply",
  validateRequest(selfEnrollBatchSchema),
  BatchController.selfEnrollBatch
);

// ==========================================
// ADMIN ADMISSION VERIFICATION DESK
// ==========================================
router.get(
  "/enrollments/pending",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  BatchController.listPendingEnrollments
);
router.post(
  "/enrollments/:id/verify",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(verifyEnrollmentSchema),
  BatchController.verifyEnrollment
);

// ==========================================
// DIRECT ROSTER ENROLLMENT (ADMIN)
// ==========================================
router.get("/batches/:id/roster", BatchController.listRoster);
router.post(
  "/batches/:id/enroll",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(enrollStudentSchema),
  BatchController.enrollStudent
);
router.delete(
  "/batches/:id/enroll/:studentId",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  BatchController.removeEnrollment
);

// ==========================================
// BATCH ATTENDANCE (INTEGRATED)
// ==========================================
router.get(
  "/batches/:id/attendance",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER, UserRole.STAFF]),
  AcademicOpsController.getBatchAttendance
);
router.post(
  "/batches/:id/attendance",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER, UserRole.STAFF]),
  validateRequest(recordAttendanceSchema),
  AcademicOpsController.recordAttendance
);

// ==========================================
// STUDY MATERIALS
// ==========================================
router.get("/materials", BatchController.listStudyMaterials);
router.post(
  "/materials",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER]),
  validateRequest(createStudyMaterialSchema),
  BatchController.createStudyMaterial
);
router.delete(
  "/materials/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER]),
  BatchController.deleteStudyMaterial
);

export default router;
