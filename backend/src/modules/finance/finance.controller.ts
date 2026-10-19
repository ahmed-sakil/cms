import type { Request, Response, NextFunction } from "express";
import { FinanceService } from "./finance.service.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

export class FinanceController {
  // 1. Fee Structures
  static async listFeeStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.query;
      const structures = await FinanceService.listFeeStructures(branchId as string | undefined);
      ResponseUtil.success(res, structures, "Fee structures retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async createFeeStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await FinanceService.createFeeStructure(req.body);
      ResponseUtil.success(res, structure, "Fee structure created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteFeeStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FinanceService.deleteFeeStructure(req.params.id);
      ResponseUtil.success(res, null, "Fee structure deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // 2. Discounts & Waivers
  static async listDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId, studentId } = req.query;
      const discounts = await FinanceService.listDiscounts({
        batchId: batchId as string | undefined,
        studentId: studentId as string | undefined,
      });
      ResponseUtil.success(res, discounts, "Discounts and waivers retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discount = await FinanceService.createDiscount(req.body);
      ResponseUtil.success(res, discount, "Discount or waiver created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FinanceService.deleteDiscount(req.params.id);
      ResponseUtil.success(res, null, "Discount deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // 3. Invoices
  static async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, batchId, studentId, status } = req.query;
      const invoices = await FinanceService.listInvoices({
        branchId: branchId as string | undefined,
        batchId: batchId as string | undefined,
        studentId: studentId as string | undefined,
        status: status as string | undefined,
      });
      ResponseUtil.success(res, invoices, "Invoices retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await FinanceService.getInvoice(req.params.id);
      ResponseUtil.success(res, invoice, "Invoice details retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createStudentInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await FinanceService.createStudentInvoice(req.body);
      ResponseUtil.success(res, invoice, "Invoice created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async generateBatchInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FinanceService.generateBatchInvoices(req.body);
      ResponseUtil.success(
        res,
        result,
        `Generated ${result.totalGenerated} invoices for ${result.batchName}`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // 4. Payments & Receipts
  static async collectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const collectedById = req.user?.userId;
      const payment = await FinanceService.collectPayment(req.body, collectedById);
      ResponseUtil.success(res, payment, "Payment recorded and receipt generated successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentByReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await FinanceService.getPaymentByReceipt(req.params.receiptNumber);
      ResponseUtil.success(res, payment, "Receipt verified");
    } catch (error) {
      next(error);
    }
  }

  // 5. Total Costing & Operational Expenses
  static async listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, category, status, startDate, endDate } = req.query;
      const expenses = await FinanceService.listExpenses({
        branchId: branchId as string | undefined,
        category: category as string | undefined,
        status: status as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      ResponseUtil.success(res, expenses, "Expense records retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const expense = await FinanceService.createExpense(req.body, req.user);
      ResponseUtil.success(res, expense, "Operational expense recorded successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateExpenseStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { status, rejectionReason } = req.body;
      const updated = await FinanceService.updateExpenseStatus(
        req.params.id,
        status,
        rejectionReason,
        req.user.userId
      );
      ResponseUtil.success(res, updated, `Expense status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FinanceService.deleteExpense(req.params.id);
      ResponseUtil.success(res, null, "Expense record deleted");
    } catch (error) {
      next(error);
    }
  }

  // 6. Overview & Analytics
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.query;
      const overview = await FinanceService.getOverview(branchId as string | undefined);
      ResponseUtil.success(res, overview, "Financial overview computed");
    } catch (error) {
      next(error);
    }
  }

  // 7. Student Endpoints
  static async getStudentInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const invoices = await FinanceService.getStudentInvoices(req.user.userId);
      ResponseUtil.success(res, invoices, "Student invoices retrieved");
    } catch (error) {
      next(error);
    }
  }

  static async getStudentPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payments = await FinanceService.getStudentPayments(req.user.userId);
      ResponseUtil.success(res, payments, "Student payment history retrieved");
    } catch (error) {
      next(error);
    }
  }
}
