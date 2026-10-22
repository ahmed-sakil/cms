import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { branchContext } from "../../middleware/branchContext.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createStudentSchema,
  adminUpdateStudentSchema,
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
router.put(
  "/students/:id",
  validateRequest(adminUpdateStudentSchema),
  AdminController.updateStudent
);
router.delete("/students/:id", AdminController.deleteStudent);

// Testimonials Moderation
router.get("/testimonials", AdminController.listTestimonials);
router.post("/testimonials", AdminController.createTestimonial);
router.put("/testimonials/:id", AdminController.updateTestimonial);
router.patch("/testimonials/:id/status", AdminController.updateTestimonialStatus);
router.delete("/testimonials/:id", AdminController.deleteTestimonial);

// Student Achievements (Hall of Fame)
router.get("/achievements", AdminController.listAchievements);
router.post("/achievements", AdminController.createAchievement);
router.put("/achievements/:id", AdminController.updateAchievement);
router.patch("/achievements/:id/featured", AdminController.toggleAchievementFeatured);
router.delete("/achievements/:id", AdminController.deleteAchievement);

// Faculty Tips & Academic Guides
router.get("/faculty-tips", AdminController.listFacultyTips);
router.post("/faculty-tips", AdminController.createFacultyTip);
router.put("/faculty-tips/:id", AdminController.updateFacultyTip);
router.patch("/faculty-tips/:id/publish", AdminController.toggleFacultyTipPublished);
router.delete("/faculty-tips/:id", AdminController.deleteFacultyTip);

export default router;

