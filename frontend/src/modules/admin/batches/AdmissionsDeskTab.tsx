import React, { useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import type { PendingEnrollmentRecord } from "../../../types/index.js";
import { formatCurrency, formatDateTime } from "../../../lib/formatters.js";

interface AdmissionsDeskTabProps {
  pendingEnrollments: PendingEnrollmentRecord[];
  loading: boolean;
  onVerifyEnrollment: (
    enrollmentId: string,
    action: "APPROVE" | "REJECT_REFUND",
    adminNotes: string
  ) => Promise<boolean>;
}

export const AdmissionsDeskTab: React.FC<AdmissionsDeskTabProps> = ({
  pendingEnrollments,
  loading,
  onVerifyEnrollment,
}) => {
  const [verifyModalItem, setVerifyModalItem] = useState<{
    item: PendingEnrollmentRecord;
    action: "APPROVE" | "REJECT_REFUND";
  } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOpenVerifyModal = (
    item: PendingEnrollmentRecord,
    action: "APPROVE" | "REJECT_REFUND"
  ) => {
    setVerifyModalItem({ item, action });
    setVerifyNotes(
      action === "APPROVE"
        ? "Payment verified. Physical seat officially locked."
        : "Admission canceled. Fee marked for student refund."
    );
  };

  const handleConfirmVerification = async () => {
    if (!verifyModalItem) return;
    setIsVerifying(true);
    const success = await onVerifyEnrollment(
      verifyModalItem.item.id,
      verifyModalItem.action,
      verifyNotes.trim()
    );
    setIsVerifying(false);
    if (success) {
      setVerifyModalItem(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-surface border border-accent rounded-sm overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Applicant Student</th>
                <th className="py-3 px-4">Offline Batch & Campus</th>
                <th className="py-3 px-4">Batch Seat Status</th>
                <th className="py-3 px-4">Payment Details</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-text-muted">
                    Loading pending admission applications...
                  </td>
                </tr>
              ) : pendingEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-text-muted space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                    <p>No pending admission applications. All student submissions are verified!</p>
                  </td>
                </tr>
              ) : (
                pendingEnrollments.map((app) => (
                  <tr key={app.id} className="hover:bg-accent-subtle/40 transition-colors">
                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-main">{app.studentName}</div>
                      <div className="font-mono text-[11px] text-brand-primary font-semibold">
                        Roll: {app.rollNumber}
                      </div>
                      <div className="text-[11px] text-text-muted">{app.studentPhone}</div>
                    </td>

                    {/* Batch */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-main">
                        {app.batchTitle || app.batchName}
                      </div>
                      <div className="text-[11px] text-brand-primary font-semibold">
                        {app.academicClass}
                      </div>
                      <div className="text-[11px] text-text-muted">{app.branchName}</div>
                    </td>

                    {/* Seat Occupancy */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-xs text-text-main">
                        {app.confirmedSeats} / {app.seatLimit} Confirmed
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          app.isSeatAvailable ? "text-emerald-600" : "text-rose-600 font-extrabold"
                        }`}
                      >
                        {app.isSeatAvailable
                          ? `${app.seatsAvailable} Seats Available`
                          : "HOUSEFULL (No Seats)"}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-3 px-4 space-y-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-primary text-white rounded-xs uppercase">
                        {app.paymentMethod}
                      </span>
                      <div className="font-mono font-bold text-text-main text-[11px]">
                        TrxID: {app.transactionId || "N/A"}
                      </div>
                      {app.senderPhone && (
                        <div className="font-mono text-[10px] text-text-muted">
                          Sender: {app.senderPhone}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-bold text-sm text-text-main">
                      {formatCurrency(app.paidAmount)}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-text-muted text-[11px]">
                      {formatDateTime(app.appliedAt)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal(app, "APPROVE")}
                        disabled={!app.isSeatAvailable}
                        className={`px-3 py-1.5 text-xs font-bold rounded-sm shadow-xs inline-flex items-center gap-1 cursor-pointer ${
                          app.isSeatAvailable
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-accent text-text-muted cursor-not-allowed"
                        }`}
                        title={
                          app.isSeatAvailable
                            ? "Verify and Lock Seat"
                            : "Cannot approve: Batch is Housefull"
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Lock
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal(app, "REJECT_REFUND")}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white rounded-sm inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject & Refund
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify Admission Modal */}
      {verifyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-accent pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                {verifyModalItem.action === "APPROVE" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                {verifyModalItem.action === "APPROVE"
                  ? "Confirm Admission & Lock Seat"
                  : "Cancel & Refund Application"}
              </h3>
              <button
                onClick={() => setVerifyModalItem(null)}
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-bg-app p-3 border border-accent rounded-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Student:</span>
                  <span className="font-bold text-text-main">
                    {verifyModalItem.item.studentName} ({verifyModalItem.item.rollNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Batch:</span>
                  <span className="font-semibold text-text-main">
                    {verifyModalItem.item.batchTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Method & TrxID:</span>
                  <span className="font-mono font-bold text-brand-primary">
                    {verifyModalItem.item.paymentMethod} • {verifyModalItem.item.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Amount:</span>
                  <span className="font-bold text-text-main">
                    {formatCurrency(verifyModalItem.item.paidAmount)}
                  </span>
                </div>
              </div>

              {verifyModalItem.action === "APPROVE" ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-emerald-900 dark:text-emerald-200 space-y-1">
                  <strong>Verification Consequence:</strong>
                  <p>
                    Approving locks 1 physical seat permanently in {verifyModalItem.item.batchTitle}.
                    A Student Invoice and official Payment Receipt will be recorded automatically.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-900 dark:text-rose-200 space-y-1">
                  <strong>Rejection / Refund Consequence:</strong>
                  <p>
                    This application will be marked as canceled and recorded for fee return.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-text-main">Admin Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Additional verification details or refund reason..."
                  className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setVerifyModalItem(null)}
                  className="px-3 py-1.5 border border-accent rounded-sm hover:bg-bg-app text-text-muted hover:text-text-main transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  disabled={isVerifying}
                  className={`px-4 py-1.5 text-white font-bold rounded-sm shadow-xs transition-colors cursor-pointer ${
                    verifyModalItem.action === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isVerifying
                    ? "Processing..."
                    : verifyModalItem.action === "APPROVE"
                    ? "Approve & Lock Seat"
                    : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
