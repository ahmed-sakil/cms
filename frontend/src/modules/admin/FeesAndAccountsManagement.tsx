import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Receipt,
  Tag,
  Layers,
  Building2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { formatCurrency } from "../../lib/formatters.js";
import { PrintableReceiptModal, ReceiptData } from "../../components/PrintableReceiptModal.js";
import { InvoicesListTab, InvoiceItem } from "./finance/InvoicesListTab.js";
import { PaymentTransactionsTab, PaymentItem } from "./finance/PaymentTransactionsTab.js";
import { FeeStructuresTab, FeeStructureItem } from "./finance/FeeStructuresTab.js";
import { FeeDiscountsTab, DiscountItem } from "./finance/FeeDiscountsTab.js";
import type { BranchRecord } from "../../types/index.js";

export const FeesAndAccountsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "structures" | "discounts">("invoices");
  const [loading, setLoading] = useState(true);

  // Overview metrics
  const [overview, setOverview] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalExpenses: 0,
    netOperatingBalance: 0,
  });

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";
  const userBranchId = currentUser?.branchId || currentUser?.branch?.id || "";

  const [selectedBranch, setSelectedBranch] = useState(isBranchAdmin ? userBranchId : "ALL");

  // Domain state
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [structures, setStructures] = useState<FeeStructureItem[]>([]);
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);

  // Print Receipt Modal
  const [printableReceipt, setPrintableReceipt] = useState<ReceiptData | null>(null);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const branchParam = !isBranchAdmin && selectedBranch !== "ALL" ? `?branchId=${selectedBranch}` : "";

      const [resOverview, resInvoices, resPayments, resStructures, resDiscounts, resBatches, resBranches] =
        await Promise.all([
          apiClient.get<any>(`/finance/overview${branchParam}`),
          apiClient.get<InvoiceItem[]>(`/finance/invoices${branchParam}`),
          apiClient.get<PaymentItem[]>(`/finance/payments${branchParam}`),
          apiClient.get<FeeStructureItem[]>(`/finance/fee-structures${branchParam}`),
          apiClient.get<DiscountItem[]>(`/finance/discounts${branchParam}`),
          apiClient.get<any[]>("/academics/batches"),
          apiClient.get<BranchRecord[]>("/admin/branches"),
        ]);

      if (resOverview.success && resOverview.data) setOverview(resOverview.data);
      if (resInvoices.success && Array.isArray(resInvoices.data)) setInvoices(resInvoices.data);
      if (resPayments.success && Array.isArray(resPayments.data)) setPayments(resPayments.data);
      if (resStructures.success && Array.isArray(resStructures.data)) setStructures(resStructures.data);
      if (resDiscounts.success && Array.isArray(resDiscounts.data)) setDiscounts(resDiscounts.data);
      if (resBatches.success && Array.isArray(resBatches.data)) setBatches(resBatches.data);
      if (resBranches.success && Array.isArray(resBranches.data)) setBranches(resBranches.data);
    } catch {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [selectedBranch]);

  const handleCollectFee = async (invoiceId: string, form: any): Promise<boolean> => {
    try {
      const res = await apiClient.post<any>(`/finance/invoices/${invoiceId}/collect`, form);
      if (res.success) {
        toast.success("Payment recorded successfully");
        if (res.data?.receipt) {
          setPrintableReceipt(res.data.receipt);
        }
        fetchFinanceData();
        return true;
      }
      toast.error(res.message || "Failed to record payment");
      return false;
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
      return false;
    }
  };

  const handleGenerateBatchInvoices = async (form: any): Promise<boolean> => {
    try {
      const res = await apiClient.post<any>("/finance/invoices/generate-batch", form);
      if (res.success) {
        toast.success(`Generated ${res.data?.count || ""} batch invoices successfully`);
        fetchFinanceData();
        return true;
      }
      toast.error(res.message || "Failed to generate batch invoices");
      return false;
    } catch (err: any) {
      toast.error(err.message || "Failed to generate batch invoices");
      return false;
    }
  };

  const handleAddStructure = async (form: any): Promise<boolean> => {
    try {
      const res = await apiClient.post<any>("/finance/fee-structures", {
        ...form,
        branchId: isBranchAdmin ? userBranchId : undefined,
      });
      if (res.success) {
        toast.success("Fee structure saved");
        fetchFinanceData();
        return true;
      }
      toast.error(res.message || "Failed to save fee structure");
      return false;
    } catch (err: any) {
      toast.error(err.message || "Failed to save fee structure");
      return false;
    }
  };

  const handleAddDiscount = async (form: any): Promise<boolean> => {
    try {
      const res = await apiClient.post<any>("/finance/discounts", {
        ...form,
        branchId: isBranchAdmin ? userBranchId : undefined,
      });
      if (res.success) {
        toast.success("Fee waiver rule created");
        fetchFinanceData();
        return true;
      }
      toast.error(res.message || "Failed to create fee waiver rule");
      return false;
    } catch (err: any) {
      toast.error(err.message || "Failed to create fee waiver rule");
      return false;
    }
  };

  const tabs = [
    { key: "invoices", label: "Student Invoices & Dues", icon: Receipt },
    { key: "payments", label: "Payment Transactions", icon: CreditCard },
    { key: "structures", label: "Fee Structures", icon: Layers },
    { key: "discounts", label: "Waivers & Discounts", icon: Tag },
  ];

  return (
    <div className="space-y-6">
      {/* Printable Receipt Modal */}
      {printableReceipt && (
        <PrintableReceiptModal
          isOpen={!!printableReceipt}
          onClose={() => setPrintableReceipt(null)}
          receipt={printableReceipt}
        />
      )}

      {/* Top Banner & Campus Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-primary" /> Accounts & Student Fees
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cross-branch tuition billing, automated waiver application, and real-time cash flow oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isBranchAdmin && (
            <div className="flex items-center gap-1.5 bg-surface border border-accent rounded-sm px-2.5 py-1 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-xs text-text-main font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Campuses (Consolidated)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchFinanceData}
            title="Refresh Financial Records"
            className="p-1.5 bg-surface border border-accent text-text-muted hover:text-text-main rounded-sm hover:bg-accent-subtle transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold">Total Invoiced</span>
            <Receipt className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-xl font-black text-text-main font-mono">
            {formatCurrency(overview.totalBilled)}
          </p>
          <p className="text-[10px] text-text-muted">Gross billed to students</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-status-success">Fees Collected</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <p className="text-xl font-black text-status-success font-mono">
            {formatCurrency(overview.totalCollected)}
          </p>
          <p className="text-[10px] text-status-success/80 font-medium">Realized revenue</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-status-warning">Outstanding Dues</span>
            <AlertCircle className="w-4 h-4 text-status-warning" />
          </div>
          <p className="text-xl font-black text-status-warning font-mono">
            {formatCurrency(overview.totalOutstanding)}
          </p>
          <p className="text-[10px] text-status-warning/80 font-medium">Pending student receivables</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-status-danger">Total Operational Cost</span>
            <TrendingDown className="w-4 h-4 text-status-danger" />
          </div>
          <p className="text-xl font-black text-status-danger font-mono">
            {formatCurrency(overview.totalExpenses)}
          </p>
          <p className="text-[10px] text-status-danger/80 font-medium">Rent, salaries & utilities</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-text-main">Net Balance</span>
            <DollarSign className="w-4 h-4 text-brand-primary" />
          </div>
          <p
            className={`text-xl font-black font-mono ${
              overview.netOperatingBalance >= 0 ? "text-status-success" : "text-status-danger"
            }`}
          >
            {formatCurrency(overview.netOperatingBalance)}
          </p>
          <p className="text-[10px] text-text-muted">Operating cash surplus</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-accent text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? "border-brand-primary text-brand-primary font-bold bg-accent-subtle/50"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Modular Tab Content */}
      {activeTab === "invoices" && (
        <InvoicesListTab
          invoices={invoices}
          batches={batches}
          loading={loading}
          onRefresh={fetchFinanceData}
          onOpenReceipt={(rcpt) => setPrintableReceipt(rcpt)}
          onCollectFee={handleCollectFee}
          onGenerateBatchInvoices={handleGenerateBatchInvoices}
        />
      )}

      {activeTab === "payments" && (
        <PaymentTransactionsTab
          payments={payments}
          loading={loading}
          onOpenReceipt={(rcpt) => setPrintableReceipt(rcpt)}
        />
      )}

      {activeTab === "structures" && (
        <FeeStructuresTab
          structures={structures}
          loading={loading}
          onAddStructure={handleAddStructure}
        />
      )}

      {activeTab === "discounts" && (
        <FeeDiscountsTab
          discounts={discounts}
          batches={batches}
          loading={loading}
          onAddDiscount={handleAddDiscount}
        />
      )}
    </div>
  );
};
