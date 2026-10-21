import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { branchContext } from "../../middleware/branchContext.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createStudentSchema,
  updateOrganizationSchema,
  createBranchSchema,
  createTeacherSchema,
  updateTeacherSchema,
  createStaffSchema,
  updateStaffSchema,
} from "../../schemas/index.js";
import { UserRole } from "../../types/index.js";

const router = Router();

// Restrict all admin endpoints strictly to SUPER_ADMIN and BRANCH_ADMIN
router.use(authGuard);
router.use(roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]));
router.use(branchContext);

// Overview
router.get("/metrics", AdminController.getOverview);

// Organization Settings & Payment Channels (Super Admin only for mutation)
router.get("/organization", AdminController.getOrganization);
router.put(
  "/organization",
  roleGuard([UserRole.SUPER_ADMIN]),
  validateRequest(updateOrganizationSchema),
  AdminController.updateOrganization
);

// Branches Management
router.get("/branches", AdminController.listBranches);
router.post(
  "/branches",
  roleGuard([UserRole.SUPER_ADMIN]),
  validateRequest(createBranchSchema),
  AdminController.createBranch
);
router.put("/branches/:id", AdminController.updateBranch);
router.patch(
  "/branches/:id/toggle",
  roleGuard([UserRole.SUPER_ADMIN]),
  AdminController.toggleBranch
);
router.patch(
  "/branches/:id/set-main",
  roleGuard([UserRole.SUPER_ADMIN]),
  AdminController.setMainBranch
);
router.delete(
  "/branches/:id",
  roleGuard([UserRole.SUPER_ADMIN]),
  AdminController.deleteBranch
);

// Teachers & Faculty Management
router.get("/teachers", AdminController.listTeachers);
router.post("/teachers", validateRequest(createTeacherSchema), AdminController.createTeacher);
router.put("/teachers/:id", validateRequest(updateTeacherSchema), AdminController.updateTeacher);

// Staff Management
router.get("/staffs", AdminController.listStaffs);
router.post("/staffs", validateRequest(createStaffSchema), AdminController.createStaff);
router.put("/staffs/:id", validateRequest(updateStaffSchema), AdminController.updateStaff);

// Student Management Endpoints
router.post("/students", validateRequest(createStudentSchema), AdminController.createStudent);
router.get("/students", AdminController.listStudents);
router.get("/students/:id", AdminController.getStudent);

// Testimonials Moderation
router.get("/testimonials", AdminController.listTestimonials);
router.patch("/testimonials/:id/status", AdminController.updateTestimonialStatus);
router.delete("/testimonials/:id", AdminController.deleteTestimonial);

export default router;

