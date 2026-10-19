import React, { useRef } from "react";
import {
  Printer,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  invoiceNumber?: string | null;
  paidAt: string;
  amount: number;
  method: string;
  transactionId?: string | null;
  accountNumber?: string | null;
  notes?: string | null;
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
    discountReason?: string | null;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    batchName?: string | null;
    branchName?: string | null;
  } | null;
  collectedBy?: string | null;
}

interface PrintableReceiptModalProps {
  receipt: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
  institutionName?: string;
  institutionTagline?: string;
  institutionPhone?: string;
  institutionAddress?: string;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  institutionName = "",
  institutionTagline = "",
  institutionPhone = "",
  institutionAddress = "",
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success("Printing payment receipt voucher");
  };

  const isFullyPaid =
    !receipt.invoice || Number(receipt.invoice.dueAmount) <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-area, #printable-receipt-area * {
            visibility: visible;
          }
          #printable-receipt-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-surface border border-accent rounded-sm max-w-2xl w-full space-y-4 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
        {/* Modal Top Bar */}
        <div className="flex justify-between items-center border-b border-accent pb-3 no-print">
          <div>
            <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-primary" /> Official Payment Receipt Voucher
            </h2>
            <p className="text-xs text-text-muted">
              Receipt No: <span className="font-mono font-bold text-text-main">{receipt.receiptNumber}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-accent rounded-sm hover:bg-accent-subtle text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area Voucher */}
        <div
          id="printable-receipt-area"
          ref={receiptRef}
          className="bg-white text-black p-6 border-2 border-black rounded-xs space-y-5 shadow-xs text-xs font-sans"
        >
          {/* Receipt Letterhead */}
          <div className="border-b-2 border-black pb-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-black text-white font-bold flex items-center justify-center rounded-xs text-[10px]">
                CMS
              </div>
              <h1 className="text-lg font-black tracking-tight uppercase">{institutionName}</h1>
            </div>
            <p className="text-[11px] text-gray-700 italic">{institutionTagline}</p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600 pt-0.5">
              {receipt.invoice?.branchName && (
                <>
                  <span>{receipt.invoice.branchName}</span>
                  <span>•</span>
                </>
              )}
              <span>{institutionAddress}</span>
              <span>•</span>
              <span>Phone: {institutionPhone}</span>
            </div>
          </div>

          {/* Receipt Meta Row */}
          <div className="flex justify-between items-start bg-gray-50 border border-black p-3 rounded-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Voucher Details</span>
              <p className="font-mono font-black text-sm text-black">
                {receipt.receiptNumber}
              </p>
              {receipt.invoiceNumber && (
                <p className="text-[11px] text-gray-700">
                  Ref Invoice: <span className="font-mono font-bold">{receipt.invoiceNumber}</span>
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Payment Date</span>
              <p className="font-semibold text-black">
                {new Date(receipt.paidAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <span className="inline-block px-2 py-0.5 border border-black font-mono font-bold text-[10px] bg-white uppercase">
                Method: {receipt.method}
              </span>
            </div>
          </div>

          {/* Student Particulars */}
          <div className="border border-black p-3 space-y-2 rounded-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block border-b border-gray-300 pb-1">
              Student Information
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <div>
                <span className="text-gray-500 text-[11px]">Student Name: </span>
                <span className="font-bold text-black">{receipt.student.fullName}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Roll Number: </span>
                <span className="font-mono font-bold text-black">{receipt.student.rollNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Enrolled Batch: </span>
                <span className="font-semibold text-black">
                  {receipt.invoice?.batchName || "Standard Academic Batch"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Student Contact: </span>
                <span className="text-black font-mono">{receipt.student.phone || "N/A"}</span>
              </div>
              {receipt.student.guardianName && (
                <div>
                  <span className="text-gray-500 text-[11px]">Guardian: </span>
                  <span className="text-black">{receipt.student.guardianName}</span>
                </div>
              )}
              {receipt.student.guardianPhone && (
                <div>
                  <span className="text-gray-500 text-[11px]">Guardian Phone: </span>
                  <span className="text-black font-mono">{receipt.student.guardianPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-black rounded-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2 px-3">SL</th>
                  <th className="py-2 px-3">Fee Description / Purpose</th>
                  <th className="py-2 px-3 text-right">Gross Amount</th>
                  <th className="py-2 px-3 text-right">Waiver / Discount</th>
                  <th className="py-2 px-3 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                <tr>
                  <td className="py-2.5 px-3 font-mono">01</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-black">
                      {receipt.invoice?.title || "Academic Tuition & Mentorship Fee"}
                    </p>
                    {receipt.invoice?.discountReason && (
                      <p className="text-[10px] text-gray-600 italic">
                        {receipt.invoice.discountReason}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ৳{Number(receipt.invoice?.subtotal || receipt.amount).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                    -৳{Number(receipt.invoice?.discountAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    ৳{Number(receipt.invoice?.totalAmount || receipt.amount).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Summary & Stamp Row */}
          <div className="flex justify-between items-end pt-2">
            {/* Status Stamp & Transaction Info */}
            <div className="space-y-2">
              <div
                className={`inline-block px-4 py-1.5 border-2 rounded-xs font-black text-xs uppercase tracking-widest ${
                  isFullyPaid
                    ? "border-green-700 text-green-800 bg-green-50"
                    : "border-orange-600 text-orange-700 bg-orange-50"
                }`}
              >
                {isFullyPaid ? "★ PAID IN FULL ★" : "★ PARTIALLY PAID ★"}
              </div>

              {receipt.transactionId && (
                <div className="text-[11px] text-gray-700 font-mono space-y-0.5">
                  <p>Trx ID: <span className="font-bold">{receipt.transactionId}</span></p>
                  {receipt.accountNumber && <p>Sender: {receipt.accountNumber}</p>}
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="w-56 border border-black p-2.5 space-y-1.5 text-xs bg-gray-50 rounded-xs">
              <div className="flex justify-between font-semibold">
                <span>Amount Paid Today:</span>
                <span className="font-mono font-bold text-sm">৳{Number(receipt.amount).toLocaleString()}</span>
              </div>
              {receipt.invoice && (
                <>
                  <div className="flex justify-between text-gray-600 text-[11px] pt-1 border-t border-gray-300">
                    <span>Total Paid to Date:</span>
                    <span className="font-mono">৳{Number(receipt.invoice.paidAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black border-t border-black pt-1">
                    <span>Remaining Balance:</span>
                    <span className="font-mono text-red-700">
                      ৳{Number(receipt.invoice.dueAmount).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 flex justify-between items-end text-center text-xs">
            <div className="w-44 border-t border-black pt-1">
              <p className="font-semibold text-black">Student / Depositor</p>
              <p className="text-[10px] text-gray-500">Signature</p>
            </div>

            <div className="w-48 border-t border-black pt-1">
              <p className="font-bold text-black">{receipt.collectedBy || "Accounts Officer"}</p>
              <p className="text-[10px] text-gray-500">Authorized Signature & Seal</p>
            </div>
          </div>

          {/* Footer Notice */}
          <p className="text-[9px] text-gray-500 text-center border-t border-gray-200 pt-2 italic">
            This is an official system-generated payment receipt from {institutionName}. Please preserve this receipt for your records.
          </p>
        </div>
      </div>
    </div>
  );
};
