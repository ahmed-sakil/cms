import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Printer,
  Tag,
  Receipt,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod, InvoiceStatus, DiscountType } from "../../types/index.js";
import { PrintableReceiptModal, ReceiptData } from "../../components/PrintableReceiptModal.js";
import { formatCurrency } from "../../lib/formatters.js";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  title: string;
  subtotal: number;
  discountAmount: number;
  discountReason?: string | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  student: {
    id: string;
    rollNumber: string;
    guardianName?: string | null;
    guardianPhone?: string | null;
    user: { fullName: string; email: string; phone?: string | null };
  };
  batch?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
}

interface PaymentItem {
  id: string;
  receiptNumber: string;
  amount: number;
  method: string;
  transactionId?: string | null;
  accountNumber?: string | null;
  paidAt: string;
  student: {
    fullName: string;
    rollNumber: string;
    phone?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  };
  invoice?: {
    title: string;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    batchName?: string | null;
    branchName?: string | null;
  } | null;
}

interface FeeStructureItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  branch?: { name: string } | null;
  course?: { name: string } | null;
  batch?: { name: string } | null;
}

interface DiscountItem {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  batch?: { name: string } | null;
  student?: { rollNumber: string; user: { fullName: string } } | null;
}

export const FeesAndAccountsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "invoices" | "payments" | "structures" | "discounts"
  >("invoices");

  const [loading, setLoading] = useState(true);

  // Overview metrics
  const [overview, setOverview] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalExpenses: 0,
    netOperatingBalance: 0,
  });

  // Data lists
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [structures, setStructures] = useState<FeeStructureItem[]>([]);
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<InvoiceItem | null>(null);

  const [isBatchInvoiceModalOpen, setIsBatchInvoiceModalOpen] = useState(false);
  const [isAddStructureModalOpen, setIsAddStructureModalOpen] = useState(false);
  const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);

  // Active Receipt for Printing
  const [printableReceipt, setPrintableReceipt] = useState<ReceiptData | null>(null);

  // Form states
  const [collectForm, setCollectForm] = useState({
    amount: 0,
    method: PaymentMethod.CASH,
    transactionId: "",
    accountNumber: "",
    notes: "",
  });

  const [batchInvoiceForm, setBatchInvoiceForm] = useState({
    batchId: "",
    title: "",
    amount: 3000,
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0],
    notes: "",
  });

  const [structureForm, setStructureForm] = useState({
    name: "",
    amount: 0,
    frequency: "MONTHLY",
    branchId: "",
    batchId: "",
  });

  const [discountForm, setDiscountForm] = useState({
    name: "",
    type: DiscountType.PERCENTAGE,
    value: 10,
    batchId: "",
    reason: "",
  });

  // Fetch all core financial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("cms_token");
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [ovRes, invRes, strRes, discRes, batchRes] = await Promise.all([
        fetch("/api/v1/finance/overview", { headers }),
        fetch("/api/v1/finance/invoices", { headers }),
        fetch("/api/v1/finance/structures", { headers }),
        fetch("/api/v1/finance/discounts", { headers }),
        fetch("/api/v1/academics/batches", { headers }),
      ]);

      const [ovJson, invJson, strJson, discJson, batchJson] = await Promise.all([
        ovRes.json(),
        invRes.json(),
        strRes.json(),
        discRes.json(),
        batchRes.json(),
      ]);

      if (ovJson.success && ovJson.data) {
        setOverview(ovJson.data);
        if (Array.isArray(ovJson.data.recentPayments)) {
          // Format recent payments
          const formatted = ovJson.data.recentPayments.map((p: any) => ({
            id: p.id,
            receiptNumber: p.receiptNumber,
            amount: Number(p.amount),
            method: p.method,
            transactionId: p.transactionId,
            paidAt: p.paidAt,
            student: {
              fullName: p.student?.user?.fullName || "Student",
              rollNumber: p.student?.rollNumber || "N/A",
            },
          }));
          setPayments(formatted);
        }
      }

      if (invJson.success && Array.isArray(invJson.data)) setInvoices(invJson.data);
      if (strJson.success && Array.isArray(strJson.data)) setStructures(strJson.data);
      if (discJson.success && Array.isArray(discJson.data)) setDiscounts(discJson.data);
      if (batchJson.success && Array.isArray(batchJson.data)) setBatches(batchJson.data);
    } catch {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Submit Payment Collection
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay) return;
    if (collectForm.amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    try {
      const token = localStorage.getItem("cms_token");
      const payload = {
        invoiceId: selectedInvoiceToPay.id,
        studentId: selectedInvoiceToPay.student.id,
        amount: collectForm.amount,
        method: collectForm.method,
        transactionId: collectForm.transactionId || undefined,
        accountNumber: collectForm.accountNumber || undefined,
        notes: collectForm.notes || undefined,
      };

      const res = await fetch("/api/v1/finance/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to record payment");
      }

      toast.success("Payment recorded and receipt generated!");
      setIsCollectModalOpen(false);

      // Instantly open printable receipt
      setPrintableReceipt({
        id: json.data.id,
        receiptNumber: json.data.receiptNumber,
        invoiceNumber: selectedInvoiceToPay.invoiceNumber,
        paidAt: json.data.paidAt,
        amount: json.data.amount,
        method: json.data.method,
        transactionId: json.data.transactionId,
        accountNumber: json.data.accountNumber,
        notes: json.data.notes,
        student: {
          fullName: selectedInvoiceToPay.student.user.fullName,
          rollNumber: selectedInvoiceToPay.student.rollNumber,
          phone: selectedInvoiceToPay.student.user.phone,
          guardianName: selectedInvoiceToPay.student.guardianName,
          guardianPhone: selectedInvoiceToPay.student.guardianPhone,
        },
        invoice: {
          title: selectedInvoiceToPay.title,
          subtotal: selectedInvoiceToPay.subtotal,
          discountAmount: selectedInvoiceToPay.discountAmount,
          discountReason: selectedInvoiceToPay.discountReason,
          totalAmount: selectedInvoiceToPay.totalAmount,
          paidAmount: Number(selectedInvoiceToPay.paidAmount) + collectForm.amount,
          dueAmount: Math.max(0, Number(selectedInvoiceToPay.dueAmount) - collectForm.amount),
          batchName: selectedInvoiceToPay.batch?.name,
          branchName: selectedInvoiceToPay.branch?.name,
        },
        collectedBy: json.data.collectedBy?.fullName || "Accounts Officer",
      });

      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error processing payment");
    }
  };

  // 2. Submit Batch Invoice Generation
  const handleBatchInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInvoiceForm.batchId) {
      toast.error("Please select a batch");
      return;
    }
    if (!batchInvoiceForm.title.trim()) {
      toast.error("Invoice title is required");
      return;
    }

    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/finance/invoices/batch-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(batchInvoiceForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to generate batch invoices");
      }

      toast.success(json.message || "Batch invoices generated successfully!");
      setIsBatchInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error generating invoices");
    }
  };


  // 4. Submit Fee Structure
  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.name.trim()) {
      toast.error("Fee name is required");
      return;
    }
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/finance/structures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(structureForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success("Fee structure configured");
      setIsAddStructureModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 5. Submit Discount
  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.name.trim()) {
      toast.error("Discount name is required");
      return;
    }
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/finance/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(discountForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success("Discount / Waiver configured");
      setIsAddDiscountModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-primary" /> Fees, Invoices & Costing Accounts
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Collect student fees, manage batch invoicing & waivers, and track operational branch expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBatchInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Generate Batch Invoices
          </button>
          <Link
            to="/admin/expenses"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-subtle hover:bg-accent border border-accent text-text-main text-xs font-semibold rounded-sm transition-colors shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-brand-primary" /> Campus Expenses &rarr;
          </Link>
        </div>
      </div>

      {/* Financial Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold">Total Invoiced</span>
            <Receipt className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-xl font-black text-text-main">
            {formatCurrency(overview.totalBilled)}
          </p>
          <p className="text-[10px] text-text-muted">Gross billed to students</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-green-700">Fees Collected</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl font-black text-green-700">
            {formatCurrency(overview.totalCollected)}
          </p>
          <p className="text-[10px] text-green-600 font-medium">Realized revenue</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-orange-600">Outstanding Dues</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xl font-black text-orange-600">
            {formatCurrency(overview.totalOutstanding)}
          </p>
          <p className="text-[10px] text-orange-600 font-medium">Pending student receivables</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-red-600">Total Operational Cost</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-black text-red-600">
            {formatCurrency(overview.totalExpenses)}
          </p>
          <p className="text-[10px] text-red-600 font-medium">Rent, salaries & utilities</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11px] font-semibold text-text-main">Net Balance</span>
            <DollarSign className="w-4 h-4 text-brand-primary" />
          </div>
          <p
            className={`text-xl font-black ${
              overview.netOperatingBalance >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {formatCurrency(overview.netOperatingBalance)}
          </p>
          <p className="text-[10px] text-text-muted">Operating cash surplus</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-accent flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { key: "invoices", label: `Invoices & Dues (${invoices.length})`, icon: Receipt },
          { key: "payments", label: `Payment Receipts (${payments.length})`, icon: CheckCircle2 },
          { key: "structures", label: `Fee Rates (${structures.length})`, icon: Layers },
          { key: "discounts", label: `Waivers & Discounts (${discounts.length})`, icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors ${
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

      {/* Tab 1: Invoices & Dues */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-surface border border-accent rounded-sm p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice number, student name, roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-brand-primary" /> Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
              >
                <option value="ALL">All Invoices</option>
                <option value="UNPAID">Unpaid Only</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Fee Head / Batch</th>
                    <th className="py-2.5 px-4 text-right">Net Payable</th>
                    <th className="py-2.5 px-4 text-right">Paid</th>
                    <th className="py-2.5 px-4 text-right">Due Balance</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-text-muted">
                        Loading financial invoices...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-text-muted">
                        No invoices found. Generate invoices for a batch to start billing.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-accent-subtle/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-text-main">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-text-main">{inv.student.user.fullName}</p>
                          <p className="font-mono text-[11px] text-text-muted">
                            Roll: {inv.student.rollNumber}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-text-main">{inv.title}</p>
                          <p className="text-[11px] text-text-muted">
                            {inv.batch?.name || "General Batch"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-text-main">
                          ৳{Number(inv.totalAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-green-700">
                          ৳{Number(inv.paidAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                          ৳{Number(inv.dueAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                              inv.status === "PAID"
                                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                                : inv.status === "PARTIALLY_PAID"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {Number(inv.dueAmount) > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedInvoiceToPay(inv);
                                setCollectForm({
                                  amount: Number(inv.dueAmount),
                                  method: PaymentMethod.CASH,
                                  transactionId: "",
                                  accountNumber: "",
                                  notes: "",
                                });
                                setIsCollectModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover rounded-sm shadow-xs transition-colors"
                            >
                              Collect Fee
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setPrintableReceipt({
                                  id: inv.id,
                                  receiptNumber: `RCPT-${inv.invoiceNumber.replace("INV-", "")}`,
                                  invoiceNumber: inv.invoiceNumber,
                                  paidAt: new Date().toISOString(),
                                  amount: inv.paidAmount,
                                  method: "SETTLED",
                                  student: {
                                    fullName: inv.student.user.fullName,
                                    rollNumber: inv.student.rollNumber,
                                    phone: inv.student.user.phone,
                                    guardianName: inv.student.guardianName,
                                    guardianPhone: inv.student.guardianPhone,
                                  },
                                  invoice: {
                                    title: inv.title,
                                    subtotal: inv.subtotal,
                                    discountAmount: inv.discountAmount,
                                    discountReason: inv.discountReason,
                                    totalAmount: inv.totalAmount,
                                    paidAmount: inv.paidAmount,
                                    dueAmount: inv.dueAmount,
                                    batchName: inv.batch?.name,
                                    branchName: inv.branch?.name,
                                  },
                                  collectedBy: "Accounts Department",
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-accent-subtle hover:bg-accent border border-accent rounded-sm text-text-main transition-colors"
                            >
                              Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payments & Receipts */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Student Name & Roll</th>
                    <th className="py-2.5 px-4">Channel / Method</th>
                    <th className="py-2.5 px-4">Trx ID / Sender</th>
                    <th className="py-2.5 px-4 text-right">Amount Paid</th>
                    <th className="py-2.5 px-4">Date Collected</th>
                    <th className="py-2.5 px-4 text-right">Print Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-accent-subtle/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-text-main">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-text-main">{p.student.fullName}</p>
                          <p className="font-mono text-[11px] text-text-muted">
                            Roll: {p.student.rollNumber}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[10px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-text-muted">
                          {p.transactionId || "In-person Cash"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-green-700">
                          ৳{Number(p.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-text-muted font-mono">
                          {new Date(p.paidAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setPrintableReceipt({
                                id: p.id,
                                receiptNumber: p.receiptNumber,
                                paidAt: p.paidAt,
                                amount: p.amount,
                                method: p.method,
                                transactionId: p.transactionId,
                                student: p.student,
                                invoice: p.invoice,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-accent-subtle hover:bg-brand-primary hover:text-white border border-accent rounded-sm transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Voucher
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Tab 4: Fee Structures & Rates */}
      {activeTab === "structures" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-text-muted">
              Standard fee rates for courses, batches, and admission terms.
            </p>
            <button
              onClick={() => setIsAddStructureModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Fee Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {structures.map((s) => (
              <div
                key={s.id}
                className="bg-surface border border-accent rounded-sm p-4 space-y-2 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-text-main">{s.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-accent-subtle text-text-muted rounded-xs uppercase">
                    {s.frequency}
                  </span>
                </div>
                <p className="text-2xl font-black text-brand-primary">
                  ৳{Number(s.amount).toLocaleString()}
                </p>
                <p className="text-xs text-text-muted">
                  {s.batch?.name || s.course?.name || "Universal Standard Fee"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Waivers & Discounts */}
      {activeTab === "discounts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-text-muted">
              Merit scholarships, early-bird incentives, and special quota fee waivers.
            </p>
            <button
              onClick={() => setIsAddDiscountModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Waiver Rule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {discounts.map((d) => (
              <div
                key={d.id}
                className="bg-surface border border-accent rounded-sm p-4 space-y-2 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-text-main">{d.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 rounded-xs">
                    {d.type === DiscountType.PERCENTAGE ? `${d.value}% OFF` : `৳${d.value} FLAT`}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Applicable for: {d.batch?.name || "All Batches"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {isCollectModalOpen && selectedInvoiceToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-primary" /> Collect Fee Payment
                </h3>
                <p className="text-xs text-text-muted">
                  Invoice Ref: <span className="font-mono font-bold">{selectedInvoiceToPay.invoiceNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Student:</span>
                <span className="font-bold text-text-main">
                  {selectedInvoiceToPay.student.user.fullName} ({selectedInvoiceToPay.student.rollNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total Payable:</span>
                <span className="font-mono font-bold">
                  ৳{Number(selectedInvoiceToPay.totalAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-600 font-bold border-t border-accent pt-1">
                <span>Remaining Due:</span>
                <span className="font-mono">
                  ৳{Number(selectedInvoiceToPay.dueAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-text-main mb-1">
                  Payment Amount to Collect (৳) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Number(selectedInvoiceToPay.dueAmount)}
                  value={collectForm.amount}
                  onChange={(e) =>
                    setCollectForm({ ...collectForm, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-mono text-base font-bold focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-main mb-1">Payment Channel *</label>
                <select
                  value={collectForm.method}
                  onChange={(e) =>
                    setCollectForm({ ...collectForm, method: e.target.value as PaymentMethod })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-semibold"
                >
                  <option value={PaymentMethod.CASH}>In-Person Cash</option>
                  <option value={PaymentMethod.BKASH}>bKash (Personal / Merchant)</option>
                  <option value={PaymentMethod.NAGAD}>Nagad (Personal / Merchant)</option>
                  <option value={PaymentMethod.ROCKET}>Rocket</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Wire / Direct Deposit</option>
                </select>
              </div>

              {collectForm.method !== PaymentMethod.CASH && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-text-main mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9JH4K2LMNO"
                      value={collectForm.transactionId}
                      onChange={(e) =>
                        setCollectForm({ ...collectForm, transactionId: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-text-main mb-1">
                      Sender Phone / Acc No
                    </label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={collectForm.accountNumber}
                      onChange={(e) =>
                        setCollectForm({ ...collectForm, accountNumber: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-accent flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs"
                >
                  Submit Payment & Generate Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Batch Invoices Modal */}
      {isBatchInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-primary" /> Generate Batch Invoices
                </h3>
                <p className="text-xs text-text-muted">
                  Bills all enrolled students in the batch with automated discount application.
                </p>
              </div>
              <button
                onClick={() => setIsBatchInvoiceModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchInvoiceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-text-main mb-1">Select Batch *</label>
                <select
                  required
                  value={batchInvoiceForm.batchId}
                  onChange={(e) =>
                    setBatchInvoiceForm({ ...batchInvoiceForm, batchId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-medium focus:outline-none focus:border-brand-primary"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-main mb-1">Invoice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. November 2026 Tuition Fee"
                  value={batchInvoiceForm.title}
                  onChange={(e) =>
                    setBatchInvoiceForm({ ...batchInvoiceForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-main mb-1">
                    Standard Rate (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={batchInvoiceForm.amount}
                    onChange={(e) =>
                      setBatchInvoiceForm({ ...batchInvoiceForm, amount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-main mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={batchInvoiceForm.dueDate}
                    onChange={(e) =>
                      setBatchInvoiceForm({ ...batchInvoiceForm, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-accent flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchInvoiceModalOpen(false)}
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs"
                >
                  Generate All Invoices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Add Structure Modal */}
      {isAddStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-text-main">Add Fee Structure</h3>
            <form onSubmit={handleStructureSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Fee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Admission & Kit Fee"
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={structureForm.amount}
                  onChange={(e) =>
                    setStructureForm({ ...structureForm, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm font-mono font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setIsAddStructureModalOpen(false)}
                  className="px-3 py-1.5 border border-accent rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-brand-primary text-white rounded-sm font-semibold"
                >
                  Save Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Discount Modal */}
      {isAddDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-text-main">Add Discount / Waiver</h3>
            <form onSubmit={handleDiscountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Discount Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Merit Scholarship 25%"
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        type: e.target.value as DiscountType,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm"
                  >
                    <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                    <option value={DiscountType.FLAT_AMOUNT}>Flat Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountForm.value}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, value: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setIsAddDiscountModalOpen(false)}
                  className="px-3 py-1.5 border border-accent rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-brand-primary text-white rounded-sm font-semibold"
                >
                  Save Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printableReceipt && (
        <PrintableReceiptModal
          isOpen={!!printableReceipt}
          onClose={() => setPrintableReceipt(null)}
          receipt={printableReceipt}
        />
      )}
    </div>
  );
};
