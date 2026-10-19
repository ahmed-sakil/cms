import React, { useState } from "react";
import { Search, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/formatters.js";
import type { ReceiptData } from "../../../components/PrintableReceiptModal.js";

export interface PaymentItem {
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

interface PaymentTransactionsTabProps {
  payments: PaymentItem[];
  loading: boolean;
  onOpenReceipt: (receipt: ReceiptData) => void;
}

export const PaymentTransactionsTab: React.FC<PaymentTransactionsTabProps> = ({
  payments,
  loading,
  onOpenReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(query) ||
      p.student.fullName.toLowerCase().includes(query) ||
      p.student.rollNumber.toLowerCase().includes(query) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search receipt #, student name, roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
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
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-text-muted font-mono">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          onOpenReceipt({
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
  );
};
