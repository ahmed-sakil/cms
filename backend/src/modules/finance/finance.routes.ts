import { Router } from "express";
import { FinanceController } from "./finance.controller.js";
import { authGuard } from "../../middleware/authGuard.js";
import { branchContext } from "../../middleware/branchContext.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createFeeStructureSchema,
  createFeeDiscountSchema,
  createStudentInvoiceSchema,
  generateBatchInvoicesSchema,
  collectPaymentSchema,
  createExpenseSchema,
  updateExpenseStatusSchema,
} from "./finance.schema.js";
import { UserRole } from "../../types/index.js";

const router = Router();

// Protect all finance routes with authGuard and branchContext
router.use(authGuard);
router.use(branchContext);

// 1. Financial Overview / Dashboard Analytics
router.get(
  "/overview",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  FinanceController.getOverview
);

// 2. Fee Structures
router.get("/structures", FinanceController.listFeeStructures);
router.get("/fee-structures", FinanceController.listFeeStructures);
router.post(
  "/structures",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(createFeeStructureSchema),
  FinanceController.createFeeStructure
);
router.post(
  "/fee-structures",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(createFeeStructureSchema),
  FinanceController.createFeeStructure
);
router.delete(
  "/structures/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  FinanceController.deleteFeeStructure
);
router.delete(
  "/fee-structures/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  FinanceController.deleteFeeStructure
);

// 3. Discounts & Waivers
router.get("/discounts", FinanceController.listDiscounts);
router.post(
  "/discounts",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(createFeeDiscountSchema),
  FinanceController.createDiscount
);
router.delete(
  "/discounts/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  FinanceController.deleteDiscount
);

// 4. Invoices
router.get(
  "/invoices",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  FinanceController.listInvoices
);
router.get("/invoices/:id", FinanceController.getInvoice);
router.post(
  "/invoices",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(createStudentInvoiceSchema),
  FinanceController.createStudentInvoice
);
router.post(
  "/invoices/batch-generate",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(generateBatchInvoicesSchema),
  FinanceController.generateBatchInvoices
);
router.post(
  "/invoices/generate-batch",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  validateRequest(generateBatchInvoicesSchema),
  FinanceController.generateBatchInvoices
);
router.post(
  "/invoices/:id/collect",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  FinanceController.collectPayment
);

// 5. Payment Collection & Receipts
router.get(
  "/payments",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  FinanceController.listPayments
);
router.post(
  "/payments",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(collectPaymentSchema),
  FinanceController.collectPayment
);
router.get("/receipts/:receiptNumber", FinanceController.getPaymentByReceipt);

// 6. Total Costing & Operational Expenses
router.get(
  "/expenses",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  FinanceController.listExpenses
);
router.post(
  "/expenses",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]),
  validateRequest(createExpenseSchema),
  FinanceController.createExpense
);
router.patch(
  "/expenses/:id/status",
  roleGuard([UserRole.SUPER_ADMIN]),
  validateRequest(updateExpenseStatusSchema),
  FinanceController.updateExpenseStatus
);
router.delete(
  "/expenses/:id",
  roleGuard([UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN]),
  FinanceController.deleteExpense
);

export default router;
