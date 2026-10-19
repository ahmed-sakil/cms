import { Router } from "express";
import { StudentController } from "./student.controller.js";
import { BatchController } from "../batches/batch.controller.js";
import { FinanceController } from "../finance/finance.controller.js";
import { AcademicOpsController } from "../academic-ops/academic-ops.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { changePasswordSchema, updateStudentProfileSchema } from "../../schemas/index.js";
import { requestReferralPayoutSchema } from "../academic-ops/academic-ops.schema.js";
import { UserRole } from "../../types/index.js";

const router = Router();

// Strictly guard student routes for STUDENT role
router.use(authGuard);
router.use(roleGuard([UserRole.STUDENT]));

router.get("/dashboard", StudentController.getDashboard);
router.get("/profile", StudentController.getDashboard);
router.put("/profile", validateRequest(updateStudentProfileSchema), StudentController.updateProfile);
router.put("/change-password", validateRequest(changePasswordSchema), StudentController.changePassword);
router.get("/materials", BatchController.getStudentMaterials);
router.get("/invoices", FinanceController.getStudentInvoices);
router.get("/payments", FinanceController.getStudentPayments);
router.get("/exams", AcademicOpsController.getStudentExams);
router.get("/referrals", AcademicOpsController.getStudentReferralProfile);
router.post(
  "/referrals/payout",
  validateRequest(requestReferralPayoutSchema),
  AcademicOpsController.requestReferralPayout
);

export default router;
