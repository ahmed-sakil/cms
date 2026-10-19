import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  Check,
  Ban,
  Wallet,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  type BranchRecord,
} from "../../types/index.js";
import { FileUpload } from "../../components/common/FileUpload.js";

interface ExpenseItem {
  id: string;
  title: string;
  amount: number | string;
  category: ExpenseCategory;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  paidTo: string;
  receiptUrl?: string | null;
  notes?: string | null;
  status: ExpenseStatus;
  rejectionReason?: string | null;
  createdAt: string;
  branch?: { id: string; name: string; code: string } | null;
  recordedBy?: { id: string; fullName: string; role: string } | null;
  approvedBy?: { id: string; fullName: string; role: string } | null;
}

export const ExpensesManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const userBranchId = currentUser?.branchId || currentUser?.branch?.id || "";

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>(isBranchAdmin ? userBranchId : "ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rejectModalItem, setRejectModalItem] = useState<ExpenseItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewNotesItem, setViewNotesItem] = useState<ExpenseItem | null>(null);

  // Form State
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: ExpenseCategory.OTHER,
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    branchId: isBranchAdmin ? userBranchId : "",
    paidTo: "",
    paymentMethod: PaymentMethod.CASH,
    receiptUrl: "",
    notes: "",
  });

  const getHeaders = () => {
    const token = localStorage.getItem("cms_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchExpensesAndBranches = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const [expRes, brRes] = await Promise.all([
        fetch("/api/v1/finance/expenses", { headers }),
        fetch("/api/v1/admin/branches", { headers }),
      ]);

      const [expJson, brJson] = await Promise.all([expRes.json(), brRes.json()]);

      if (expJson.success && Array.isArray(expJson.data)) {
        setExpenses(expJson.data);
      }
      if (brJson.success && Array.isArray(brJson.data)) {
        setBranches(brJson.data);
      }
    } catch (err) {
      console.warn("Failed to load expenses:", err);
      toast.error("Failed to load expense records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndBranches();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(expenseForm.amount);
    if (!expenseForm.title.trim()) {
      toast.error("Please enter an expense title");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please provide a valid positive expense amount");
      return;
    }
    if (!expenseForm.paidTo.trim()) {
      toast.error("Please specify the payee name");
      return;
    }

    try {
      setActionLoadingId("create");
      const targetBranchId = isBranchAdmin ? userBranchId : expenseForm.branchId;

      const payload = {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: numAmount,
        expenseDate: expenseForm.expenseDate,
        branchId: targetBranchId ? targetBranchId.trim() : null,
        paidTo: expenseForm.paidTo.trim(),
        paymentMethod: expenseForm.paymentMethod,
        receiptUrl: expenseForm.receiptUrl ? expenseForm.receiptUrl.trim() : null,
        notes: expenseForm.notes ? expenseForm.notes.trim() : null,
      };

      const res = await fetch("/api/v1/finance/expenses", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to record expense");
      }

      toast.success(
        isBranchAdmin
          ? "Campus expense logged! Submitted as PENDING for Super Admin confirmation."
          : "Expense recorded and approved successfully!"
      );

      setIsAddModalOpen(false);
      setExpenseForm({
        title: "",
        category: ExpenseCategory.OTHER,
        amount: "",
        expenseDate: new Date().toISOString().split("T")[0],
        branchId: isBranchAdmin ? userBranchId : "",
        paidTo: "",
        paymentMethod: PaymentMethod.CASH,
        receiptUrl: "",
        notes: "",
      });
      fetchExpensesAndBranches();
    } catch (err: any) {
      toast.error(err.message || "Failed to save expense log");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveExpense = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/finance/expenses/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to approve expense");
      }
      toast.success("Expense confirmed and approved!");
      fetchExpensesAndBranches();
    } catch (err: any) {
      toast.error(err.message || "Error approving expense");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    try {
      setActionLoadingId(rejectModalItem.id);
      const res = await fetch(`/api/v1/finance/expenses/${rejectModalItem.id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: rejectionReason.trim() || "Rejected by Super Admin",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to reject expense");
      }
      toast.success("Expense log marked as rejected");
      setRejectModalItem(null);
      setRejectionReason("");
      fetchExpensesAndBranches();
    } catch (err: any) {
      toast.error(err.message || "Error rejecting expense");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered List
  const filteredExpenses = expenses.filter((exp) => {
    if (isBranchAdmin && exp.branch && exp.branch.id !== userBranchId) {
      return false;
    }
    if (branchFilter !== "ALL" && exp.branch?.id !== branchFilter) {
      return false;
    }
    if (statusFilter !== "ALL" && exp.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== "ALL" && exp.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchPayee = exp.paidTo.toLowerCase().includes(q);
      const matchBranch = exp.branch?.name.toLowerCase().includes(q);
      const matchRecorder = exp.recordedBy?.fullName.toLowerCase().includes(q);
      if (!matchTitle && !matchPayee && !matchBranch && !matchRecorder) return false;
    }
    return true;
  });

  // Calculate Metrics
  const relevantExpenses = isBranchAdmin
    ? expenses.filter((e) => !e.branch || e.branch.id === userBranchId)
    : expenses;

  const totalApproved = relevantExpenses
    .filter((e) => e.status === ExpenseStatus.APPROVED)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const pendingList = relevantExpenses.filter((e) => e.status === ExpenseStatus.PENDING);
  const totalPending = pendingList.reduce((sum, e) => sum + Number(e.amount), 0);

  const totalRejected = relevantExpenses
    .filter((e) => e.status === ExpenseStatus.REJECTED)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface border border-theme rounded-sm p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text-main">
                Expenses & Operational Costing
              </h1>
              <p className="text-xs text-text-main/60">
                Track branch operational outflows, facilities, utilities, teacher honorariums, and Super Admin approvals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            {isBranchAdmin ? "Log Campus Expense" : "Record Direct Expense"}
          </button>
        </div>
      </div>

      {/* Scoped Notice Banner for Branch Admin */}
      {isBranchAdmin && (
        <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-sm flex items-start gap-2.5 text-xs text-text-main">
          <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand-primary">Campus Cost Logging Scope: </span>
            You are operating in branch-scoped mode for{" "}
            <strong>{currentUser?.branch?.name || "your assigned campus"}</strong>. Any expenses you log are recorded as{" "}
            <span className="inline-block px-1.5 py-0.2 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold rounded-xs">
              PENDING
            </span>{" "}
            until verified and confirmed by Central Headquarters (Super Admin).
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-semibold">Approved Expenses</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ৳{totalApproved.toLocaleString()}
          </p>
          <p className="text-[10px] text-text-main/50">Reconciled institutional costs</p>
        </div>

        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-semibold">Pending HQ Confirmation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            ৳{totalPending.toLocaleString()}
          </p>
          <p className="text-[10px] text-text-main/50">
            {pendingList.length} logs awaiting Super Admin sign-off
          </p>
        </div>

        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-semibold">Rejected Logs</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            ৳{totalRejected.toLocaleString()}
          </p>
          <p className="text-[10px] text-text-main/50">Disallowed or disputed submissions</p>
        </div>

        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-semibold">Total Logged Entries</span>
            <Wallet className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main font-mono">
            {relevantExpenses.length}
          </p>
          <p className="text-[10px] text-text-main/50">Across operational categories</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-theme rounded-sm p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-main/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, payee, branch, or recorder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-theme rounded-sm text-xs text-text-main placeholder:text-text-main/40 focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-theme rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval (⏳)</option>
            <option value="APPROVED">Approved (✔)</option>
            <option value="REJECTED">Rejected (✖)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-theme rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Categories</option>
            {Object.values(ExpenseCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Campus Filter */}
          {isBranchAdmin ? (
            <span className="px-2.5 py-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-semibold text-xs rounded-sm">
              {currentUser?.branch?.name || "My Branch"}
            </span>
          ) : (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-bg-app border border-theme rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Campuses</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-surface border border-theme rounded-sm shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-text-main/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            Loading campus expense logs...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-text-main/30 mx-auto" />
            <p className="text-sm font-semibold text-text-main">No expense logs found</p>
            <p className="text-xs text-text-main/50">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your filter criteria."
                : "No expenses have been recorded for this campus."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-app border-b border-theme uppercase text-[10px] tracking-wider text-text-main/60 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Expense Title</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Campus</th>
                  <th className="py-2.5 px-4">Payee & Method</th>
                  <th className="py-2.5 px-4">Recorded By</th>
                  <th className="py-2.5 px-4 text-right">Amount (৳)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-bg-app/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-text-main/70 whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-text-main block">{exp.title}</span>
                      {exp.notes && (
                        <span className="text-[10px] text-text-main/50 truncate max-w-xs block">
                          {exp.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-bg-app border border-theme rounded-xs text-text-main uppercase">
                        {exp.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-text-main/80">
                      {exp.branch ? (
                        <span className="font-medium">{exp.branch.name}</span>
                      ) : (
                        <span className="text-text-main/50 italic">Central HQ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-text-main">{exp.paidTo}</div>
                      <div className="text-[10px] text-text-main/50">{exp.paymentMethod}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-text-main font-medium">
                        {exp.recordedBy?.fullName || "Staff"}
                      </div>
                      <div className="text-[10px] text-text-main/50">
                        {exp.recordedBy?.role?.replace("_", " ") || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-main whitespace-nowrap">
                      ৳{Number(exp.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {exp.status === ExpenseStatus.APPROVED && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xs">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {exp.status === ExpenseStatus.PENDING && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xs">
                          <Clock className="w-3 h-3" /> Pending HQ
                        </span>
                      )}
                      {exp.status === ExpenseStatus.REJECTED && (
                        <span
                          title={exp.rejectionReason || "Disapproved"}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 rounded-xs cursor-help"
                        >
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.receiptUrl && (
                          <a
                            href={exp.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded-sm transition-colors"
                            title="View Voucher / Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Super Admin Approval Controls */}
                        {isSuperAdmin && exp.status === ExpenseStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleApproveExpense(exp.id)}
                              disabled={actionLoadingId === exp.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-[11px] font-semibold rounded-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              title="Approve and confirm this branch cost"
                            >
                              {actionLoadingId === exp.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Approve
                            </button>

                            <button
                              onClick={() => {
                                setRejectModalItem(exp);
                                setRejectionReason("");
                              }}
                              disabled={actionLoadingId === exp.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600 text-white text-[11px] font-semibold rounded-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
                              title="Reject this expense log"
                            >
                              <Ban className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}

                        {exp.status === ExpenseStatus.REJECTED && exp.rejectionReason && (
                          <button
                            onClick={() => setViewNotesItem(exp)}
                            className="text-[11px] text-rose-600 underline font-medium hover:text-rose-700"
                          >
                            Reason
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-primary" />
                {isBranchAdmin ? "Log Campus Operational Cost" : "Record Direct Expense"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isBranchAdmin && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-sm text-xs text-amber-800 dark:text-amber-300">
                <strong>HQ Confirmation:</strong> This expense will be submitted to the Central Headquarters ledger in <strong>PENDING</strong> status until reviewed by a Super Administrator.
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October Campus Electricity Bill, Whiteboard Markers"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
                  >
                    {Object.values(ExpenseCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Amount (BDT ৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 4500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Date Incurred *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Campus Scope *</label>
                  {isBranchAdmin ? (
                    <div className="w-full px-3 py-1.5 text-xs bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-semibold rounded-sm">
                      {currentUser?.branch?.name || "My Branch"} (Locked)
                    </div>
                  ) : (
                    <select
                      value={expenseForm.branchId}
                      onChange={(e) => setExpenseForm({ ...expenseForm, branchId: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">Central Organization HQ</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Paid To (Payee) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DESCO, Landlord Mr. Kamal, Paper Craft Ltd"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Payment Method *</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    {Object.values(PaymentMethod).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <FileUpload
                  label="Attach Receipt / Invoice Voucher (Optional)"
                  folder="general"
                  isImage={false}
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={expenseForm.receiptUrl}
                  onChange={(url) => setExpenseForm({ ...expenseForm, receiptUrl: url })}
                  helperText="Uploads voucher proof to storage"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Additional Notes / Memo</label>
                <textarea
                  rows={2}
                  placeholder="Check number, cash memo reference, reason, or budget remarks..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === "create"}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs disabled:opacity-50"
                >
                  {actionLoadingId === "create" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isBranchAdmin ? "Submit Expense Log" : "Confirm & Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-rose-600 flex items-center gap-2">
                <Ban className="w-4 h-4" /> Reject Expense Submission
              </h3>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-main">
              You are about to reject the cost log for{" "}
              <strong>"{rejectModalItem.title}"</strong> (৳{Number(rejectModalItem.amount).toLocaleString()})
              from <strong>{rejectModalItem.branch?.name || "Campus"}</strong>.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Missing official cash voucher; amount does not match approved budget..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectModalItem.id}
                  className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {actionLoadingId === rejectModalItem.id ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Reason/Notes Modal */}
      {viewNotesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-sm w-full p-5 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Rejection Remarks
              </h3>
              <button
                onClick={() => setViewNotesItem(null)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm text-xs text-rose-700 dark:text-rose-300">
              {viewNotesItem.rejectionReason || "No details provided"}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewNotesItem(null)}
                className="px-3 py-1 bg-surface border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
