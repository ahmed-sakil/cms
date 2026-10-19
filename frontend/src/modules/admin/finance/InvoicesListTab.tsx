import React, { useState } from "react";
import {
  Search,
  Filter,
  CreditCard,
  Receipt,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PaymentMethod, InvoiceStatus } from "../../../types/index.js";
import { formatCurrency } from "../../../lib/formatters.js";
import type { ReceiptData } from "../../../components/PrintableReceiptModal.js";

export interface InvoiceItem {
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

interface InvoicesListTabProps {
  invoices: InvoiceItem[];
  batches: Array<{ id: string; name: string }>;
  loading: boolean;
  onRefresh: () => void;
  onOpenReceipt: (receipt: ReceiptData) => void;
  onCollectFee: (invoiceId: string, payload: any) => Promise<boolean>;
  onGenerateBatchInvoices: (payload: any) => Promise<boolean>;
}

export const InvoicesListTab: React.FC<InvoicesListTabProps> = ({
  invoices,
  batches,
  loading,
  onRefresh,
  onOpenReceipt,
  onCollectFee,
  onGenerateBatchInvoices,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Collect Fee Modal
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<InvoiceItem | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectForm, setCollectForm] = useState({
    amount: 0,
    method: PaymentMethod.CASH,
    transactionId: "",
    accountNumber: "",
    notes: "",
  });

  // Batch Invoice Generation Modal
  const [isBatchInvoiceModalOpen, setIsBatchInvoiceModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchInvoiceForm, setBatchInvoiceForm] = useState({
    batchId: "",
    title: "",
    amount: 6000,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  });

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.student.user.fullName.toLowerCase().includes(query) ||
      inv.student.rollNumber.toLowerCase().includes(query) ||
      inv.title.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCollectModal = (inv: InvoiceItem) => {
    setSelectedInvoiceToPay(inv);
    setCollectForm({
      amount: Number(inv.dueAmount),
      method: PaymentMethod.CASH,
      transactionId: "",
      accountNumber: "",
      notes: "",
    });
    setIsCollectModalOpen(true);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay) return;
    setIsCollecting(true);
    const success = await onCollectFee(selectedInvoiceToPay.id, collectForm);
    setIsCollecting(false);
    if (success) {
      setIsCollectModalOpen(false);
      setSelectedInvoiceToPay(null);
    }
  };

  const handleBatchInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    const success = await onGenerateBatchInvoices(batchInvoiceForm);
    setIsGenerating(false);
    if (success) {
      setIsBatchInvoiceModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter & Action Bar */}
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
          <button
            onClick={onRefresh}
            title="Refresh Invoices"
            className="p-1.5 bg-surface border border-accent text-text-muted hover:text-text-main rounded-sm hover:bg-accent-subtle transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsBatchInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Generate Invoices
          </button>
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
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-green-700">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                      {formatCurrency(inv.dueAmount)}
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
                          onClick={() => handleOpenCollectModal(inv)}
                          className="px-2.5 py-1 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer"
                        >
                          Collect Fee
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onOpenReceipt({
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
                          className="px-2.5 py-1 text-xs font-semibold bg-accent-subtle hover:bg-accent border border-accent rounded-sm text-text-main transition-colors cursor-pointer"
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
                  {formatCurrency(selectedInvoiceToPay.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-red-600 font-bold border-t border-accent pt-1">
                <span>Remaining Due:</span>
                <span className="font-mono">
                  {formatCurrency(selectedInvoiceToPay.dueAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-3.5 text-xs">
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
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCollecting}
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs transition-colors disabled:opacity-60"
                >
                  {isCollecting ? "Recording Payment..." : "Submit Payment & Generate Voucher"}
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
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs transition-colors disabled:opacity-60"
                >
                  {isGenerating ? "Generating..." : "Generate All Invoices"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
