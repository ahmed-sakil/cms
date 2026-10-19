import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  Smartphone,
} from "lucide-react";
import { PrintableReceiptModal, ReceiptData } from "../../components/PrintableReceiptModal.js";
import { formatCurrency, formatDate } from "../../lib/formatters.js";

interface StudentInvoice {
  id: string;
  invoiceNumber: string;
  title: string;
  subtotal: number;
  discountAmount: number;
  discountReason?: string | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  dueDate: string;
  batch?: { name: string } | null;
}

interface StudentPayment {
  id: string;
  receiptNumber: string;
  amount: number;
  method: string;
  transactionId?: string | null;
  accountNumber?: string | null;
  paidAt: string;
  invoice?: {
    title: string;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    batch?: { name: string } | null;
  } | null;
}

export const StudentFeesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active printable receipt
  const [printableReceipt, setPrintableReceipt] = useState<ReceiptData | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("cms_token");
        const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        const [invRes, payRes] = await Promise.all([
          fetch("/api/v1/student/invoices", { headers }),
          fetch("/api/v1/student/payments", { headers }),
        ]);

        const [invJson, payJson] = await Promise.all([invRes.json(), payRes.json()]);

        if (invJson.success && Array.isArray(invJson.data)) {
          setInvoices(invJson.data);
        } else {
          setInvoices([]);
        }

        if (payJson.success && Array.isArray(payJson.data)) {
          setPayments(payJson.data);
        } else {
          setPayments([]);
        }
      } catch {
        setInvoices([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeData();
  }, []);

  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount), 0);
  const totalDue = invoices.reduce((acc, inv) => acc + Number(inv.dueAmount), 0);

  return (
    <div className="space-y-6">
      {/* Welcome & Financial Status Banner */}
      <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" /> Student Financial Accounts
          </span>
          <h1 className="text-xl font-bold text-text-main mt-0.5">Fee Invoices & Receipts</h1>
          <p className="text-xs text-text-muted mt-1">
            Review monthly tuition invoices, download official payment receipts, and view payment channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalDue > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded-sm font-semibold text-xs border border-red-300">
              <AlertCircle className="w-3.5 h-3.5" /> Due Balance: ৳{totalDue.toLocaleString()}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 rounded-sm font-semibold text-xs border border-green-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Dues Cleared
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Total Billed Fees</span>
            <Receipt className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{formatCurrency(totalInvoiced)}</p>
          <p className="text-[11px] text-text-muted">Assigned batch fees</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium text-green-700">Total Paid</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-700">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-green-600 font-medium">Verified payments to date</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium text-red-600">Current Due Balance</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-600">{formatCurrency(totalDue)}</p>
          <p className="text-[11px] text-red-600 font-medium">Please clear by due date</p>
        </div>
      </div>

      {/* Official Payment Channels Guide */}
      <div className="bg-surface border border-accent rounded-sm p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 border-b border-accent pb-2">
          <Smartphone className="w-4 h-4 text-brand-primary" />
          <h3 className="font-bold text-xs text-text-main uppercase tracking-wider">
            Official Payment Channels & Instructions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1">
            <span className="font-bold text-pink-600 block">bKash (Merchant / Personal)</span>
            <p className="font-mono font-bold text-text-main">01700-112233</p>
            <p className="text-[11px] text-text-muted">
              Use "Make Payment" or "Send Money" with your Student Roll in Reference.
            </p>
          </div>

          <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1">
            <span className="font-bold text-orange-600 block">Nagad (Personal Number)</span>
            <p className="font-mono font-bold text-text-main">01800-445566</p>
            <p className="text-[11px] text-text-muted">
              Send Money and save the TrxID for accounts confirmation.
            </p>
          </div>

          <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1">
            <span className="font-bold text-blue-600 block">Campus Accounts Reception</span>
            <p className="font-semibold text-text-main">Dhanmondi, Uttara & Mirpur</p>
            <p className="text-[11px] text-text-muted">
              Cash deposit accepted 9:00 AM – 7:00 PM (Everyday).
            </p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
          <Receipt className="w-4 h-4 text-brand-primary" /> Fee Invoices & Monthly Dues
        </h2>

        <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Fee Description</th>
                  <th className="py-2.5 px-4 text-right">Net Payable</th>
                  <th className="py-2.5 px-4 text-right">Paid Amount</th>
                  <th className="py-2.5 px-4 text-right">Due Balance</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                      Loading fee records...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                      No invoices currently issued.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-accent-subtle/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-text-main">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-main">{inv.title}</p>
                        {inv.discountReason && (
                          <p className="text-[11px] text-green-600 font-medium">
                            {inv.discountReason}
                          </p>
                        )}
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
                      <td className="py-3 px-4 text-text-muted font-mono">
                        {formatDate(inv.dueDate)}
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment History & Receipts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-primary" /> Verified Payment Receipts
        </h2>

        <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Receipt #</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Trx ID / Ref</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                  <th className="py-2.5 px-4">Payment Date</th>
                  <th className="py-2.5 px-4 text-right">Official Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-text-muted">
                      No payments on record yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-accent-subtle/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-text-main">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[10px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-text-muted">
                        {p.transactionId || "Reception Deposit"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-green-700">
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
                              student: {
                                fullName: currentUser.fullName || "Student",
                                rollNumber: "ROLL-2026-0042",
                                phone: "+880 1711-223344",
                                guardianName: "Md. Rafiqul Islam",
                                guardianPhone: "+880 1819-998877",
                              },
                              invoice: p.invoice
                                ? {
                                    title: p.invoice.title,
                                    subtotal: p.invoice.subtotal,
                                    discountAmount: p.invoice.discountAmount,
                                    totalAmount: p.invoice.totalAmount,
                                    paidAmount: p.invoice.paidAmount,
                                    dueAmount: p.invoice.dueAmount,
                                    batchName: p.invoice.batch?.name,
                                  }
                                : null,
                              collectedBy: "Accounts Department",
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-accent-subtle hover:bg-brand-primary hover:text-white border border-accent rounded-sm transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Receipt
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
