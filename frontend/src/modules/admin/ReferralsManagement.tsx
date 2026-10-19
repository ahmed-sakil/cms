import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  Smartphone,
  Edit2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod } from "../../types/index.js";

interface PayoutRequestItem {
  id: string;
  amount: number;
  method: PaymentMethod;
  accountNumber?: string | null;
  transactionId?: string | null;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
  student: {
    rollNumber: string;
    user: { fullName: string; email: string; phone?: string | null };
  };
}

export const ReferralsManagement: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Settle Modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequestItem | null>(null);
  const [settleForm, setSettleForm] = useState({
    status: "PAID" as "APPROVED" | "PAID" | "REJECTED",
    transactionId: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/ops/referrals/payouts", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPayouts(json.data);
      }
    } catch {
      toast.error("Failed to load referral payout requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("cms_token");
      const res = await fetch(`/api/v1/ops/referrals/payouts/${selectedPayout.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settleForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(`Payout ${settleForm.status.toLowerCase()} successfully!`);
      setSelectedPayout(null);
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to settle payout");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayouts = payouts.filter(
    (p) => statusFilter === "ALL" || p.status === statusFilter
  );

  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalPending = payouts
    .filter((p) => p.status === "PENDING" || p.status === "APPROVED")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" /> Student Referral Program & Payouts
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Track student peer invites, reward bonuses (৳500 per admission), and process manual mobile payouts.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold">Total Payout Requests</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{payouts.length}</p>
          <p className="text-[10px] text-text-muted">Submitted withdrawal vouchers</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-green-700">Total Bonuses Paid</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-700">৳{totalPaid.toLocaleString()}</p>
          <p className="text-[10px] text-green-600 font-medium">Disbursed via bKash/Nagad/Cash</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-orange-600">Pending Approvals</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-orange-600">৳{totalPending.toLocaleString()}</p>
          <p className="text-[10px] text-orange-600 font-medium">Awaiting manual processing</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-brand-primary">Bonus Rule</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-brand-primary">৳500 / Ref</p>
          <p className="text-[10px] text-text-muted">Awarded on student batch enrollment</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-accent rounded-sm p-3 flex justify-between items-center shadow-xs text-xs">
        <span className="text-text-muted font-medium">Filter by payout status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
        >
          <option value="ALL">All Requests</option>
          <option value="PENDING">Pending Only</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid / Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Student Name & Roll</th>
                <th className="py-2.5 px-4">Channel & Account</th>
                <th className="py-2.5 px-4 text-right">Requested Amount</th>
                <th className="py-2.5 px-4">TrxID / Receipt</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                    Loading payout requests...
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                    No referral payout requests matching filter.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-accent-subtle/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-main">{p.student.user.fullName}</p>
                      <p className="font-mono text-[11px] text-text-muted">
                        Roll: {p.student.rollNumber}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase">
                        {p.method}
                      </span>
                      <p className="font-mono text-[11px] text-text-main mt-0.5">
                        {p.accountNumber || "N/A"}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-green-700">
                      ৳{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-text-muted">
                      {p.transactionId || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          p.status === "PAID"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                            : p.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                            : p.status === "REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted font-mono">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status !== "PAID" && (
                        <button
                          onClick={() => {
                            setSelectedPayout(p);
                            setSettleForm({
                              status: "PAID",
                              transactionId: p.transactionId || "",
                              notes: p.notes || "",
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Process
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

      {/* Settle Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-brand-primary" /> Process Referral Payout
                </h3>
                <p className="text-xs text-text-muted">
                  Student: {selectedPayout.student.user.fullName} ({selectedPayout.student.rollNumber})
                </p>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Payout Method:</span>
                <span className="font-bold uppercase text-brand-primary">
                  {selectedPayout.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Destination Account:</span>
                <span className="font-mono font-bold text-text-main">
                  {selectedPayout.accountNumber}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-accent pt-1">
                <span>Disbursement Amount:</span>
                <span className="font-mono text-green-700 text-sm">
                  ৳{Number(selectedPayout.amount).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Status Action *</label>
                <select
                  value={settleForm.status}
                  onChange={(e) =>
                    setSettleForm({
                      ...settleForm,
                      status: e.target.value as "APPROVED" | "PAID" | "REJECTED",
                    })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-semibold"
                >
                  <option value="PAID">Disbursed & Mark as PAID</option>
                  <option value="APPROVED">Approve (Pending Send)</option>
                  <option value="REJECTED">Reject Request</option>
                </select>
              </div>

              {settleForm.status === "PAID" && (
                <div>
                  <label className="block font-semibold mb-1">
                    Mobile Banking TrxID / Ref No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9JH4K2LMNO"
                    value={settleForm.transactionId}
                    onChange={(e) =>
                      setSettleForm({ ...settleForm, transactionId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Accounts Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Sent via accounts mobile wallet"
                  value={settleForm.notes}
                  onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main"
                />
              </div>

              <div className="pt-3 border-t border-accent flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Confirm Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
