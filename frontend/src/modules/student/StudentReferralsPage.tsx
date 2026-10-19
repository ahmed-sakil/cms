import React, { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  CreditCard,
  Clock,
  CheckCircle2,
  X,
  Smartphone,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod } from "../../types/index.js";

interface PayoutRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  accountNumber?: string | null;
  transactionId?: string | null;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
  paidAt?: string | null;
}

interface ReferralProfileData {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayouts: number;
  availableBalance: number;
  payoutsList: PayoutRecord[];
}

export const StudentReferralsPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralProfileData>({
    referralCode: "REF-PENDING",
    totalReferrals: 0,
    totalEarned: 0,
    totalPaid: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    payoutsList: [],
  });

  // Payout request modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState<{
    amount: number;
    method: PaymentMethod;
    accountNumber: string;
    notes: string;
  }>({
    amount: 500,
    method: PaymentMethod.BKASH,
    accountNumber: "",
    notes: "",
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("cms_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/v1/students/referrals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          if (json.data.availableBalance > 0) {
            setPayoutForm((prev) => ({
              ...prev,
              amount: Math.min(json.data.availableBalance, 1000),
            }));
          }
        }
      } else {
        // Fallback to user stored rollNumber for referral link
        try {
          const stored = localStorage.getItem("cms_user");
          if (stored) {
            const user = JSON.parse(stored);
            setData((prev) => ({
              ...prev,
              referralCode: user.rollNumber ? `REF-${user.rollNumber.replace(/[^a-zA-Z0-9]/g, "")}` : "REF-PENDING",
            }));
          }
        } catch {}
      }
    } catch {
      console.warn("Could not reach referral service, displaying offline profile state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const referralLink = `${window.location.origin}/register?ref=${data.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutForm.amount <= 0) {
      toast.error("Withdrawal amount must be greater than zero");
      return;
    }
    if (payoutForm.amount > data.availableBalance) {
      toast.error(`Amount exceeds your available referral balance (৳${data.availableBalance})`);
      return;
    }
    if (payoutForm.method !== PaymentMethod.CASH && !payoutForm.accountNumber.trim()) {
      toast.error("Please enter your mobile financial account number");
      return;
    }

    try {
      setSubmittingPayout(true);
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/students/referrals/payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payoutForm),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Payout request submitted! Admin will process your transfer.");
        setShowPayoutModal(false);
        fetchReferralData();
      } else {
        toast.error(json.message || "Failed to submit payout request");
      }
    } catch {
      toast.error("Error submitting payout request");
    } finally {
      setSubmittingPayout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-theme pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-primary" /> Student Referral & Rewards Hub
          </h1>
          <p className="text-xs text-text-main/60 mt-0.5">
            Share your unique invite link with peers. Once they register and enroll in a batch, you automatically earn ৳500 commission!
          </p>
        </div>

        <button
          onClick={() => setShowPayoutModal(true)}
          disabled={data.availableBalance < 500}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
        >
          <CreditCard className="w-3.5 h-3.5" /> Request Commission Payout
        </button>
      </div>

      {/* Referral Link & Share Card */}
      <div className="bg-surface border-2 border-brand-primary/20 rounded-sm p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 rounded-xs uppercase tracking-wider">
                Active Reward Rate: ৳500 / Enrolled Friend
              </span>
            </div>
            <h2 className="text-sm font-bold text-text-main">
              Your Personalized Student Referral Link
            </h2>
            <p className="text-xs text-text-main/60">
              When new students click your link, your referral code is automatically applied during their registration.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-bg-app border border-theme px-3 py-2 rounded-sm w-full md:w-auto">
              <span className="text-[10px] text-text-main/50 uppercase font-bold tracking-wider">Code:</span>
              <span className="font-mono text-xs font-black text-brand-primary">
                {data.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity shadow-xs whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link Copied!" : "Copy Invite Link"}
            </button>
          </div>
        </div>

        {/* Complete URL Box */}
        <div className="p-2.5 bg-bg-app border border-theme rounded-sm flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono text-text-main/80">
          <span className="truncate">{referralLink}</span>
          <button
            onClick={handleCopyLink}
            className="text-xs font-semibold text-brand-primary hover:underline whitespace-nowrap shrink-0"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-medium">Referred Students</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{data.totalReferrals}</p>
          <p className="text-[10px] text-green-600 font-medium">Enrolled via your code</p>
        </div>

        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-medium">Total Commission</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">৳{data.totalEarned.toLocaleString()}</p>
          <p className="text-[10px] text-text-main/50 font-mono">৳500 per admission</p>
        </div>

        <div className="bg-surface border border-theme rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-main/60">
            <span className="text-xs font-medium">Paid Out</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-text-main">৳{data.totalPaid.toLocaleString()}</p>
          <p className="text-[10px] text-text-main/50 font-mono">Disbursed via bKash/Nagad</p>
        </div>

        <div className="bg-surface border-2 border-brand-primary/30 rounded-sm p-4 space-y-1 shadow-xs bg-brand-primary/5">
          <div className="flex justify-between items-center text-brand-primary">
            <span className="text-xs font-bold uppercase">Available Balance</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-brand-primary font-mono">
            ৳{data.availableBalance.toLocaleString()}
          </p>
          <p className="text-[10px] text-text-main/60">
            {data.availableBalance >= 500 ? "Ready for withdrawal" : "Min. ৳500 to withdraw"}
          </p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-surface border border-theme rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-bold text-text-main">Commission Withdrawal History</h2>
          </div>
          <span className="text-[11px] text-text-main/50">
            {data.payoutsList?.length || 0} withdrawal requests
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-text-main/50">Loading payout records...</div>
        ) : !data.payoutsList || data.payoutsList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-text-main/30 mx-auto" />
            <p className="text-xs font-semibold text-text-main">No payout requests yet</p>
            <p className="text-[11px] text-text-main/50 max-w-sm mx-auto">
              Once you have referred peers and earned at least ৳500 balance, you can request withdrawal to your personal bKash or Nagad wallet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-bg-app border-b border-theme text-[10px] uppercase font-bold text-text-main/60 tracking-wider">
                <tr>
                  <th className="p-3">Request Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Account No.</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Trx ID / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {data.payoutsList.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-app/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-text-main/70">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-bold font-mono text-text-main">
                      ৳{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs border border-theme bg-bg-app">
                        {p.method}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-text-main/70">
                      {p.accountNumber || "Cash Counter"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                          p.status === "PAID"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                            : p.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : p.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-text-main/60">
                      {p.transactionId || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-bold text-text-main">
                  Request Referral Commission Withdrawal
                </h3>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1 hover:bg-bg-app rounded-sm text-text-main/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-main/60 mb-1">
                  Available Commission Balance
                </label>
                <div className="text-2xl font-black text-brand-primary font-mono">
                  ৳{data.availableBalance.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Withdrawal Amount (BDT) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  max={data.availableBalance}
                  value={payoutForm.amount}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:border-brand-primary outline-none font-mono"
                />
                <p className="text-[10px] text-text-main/50 mt-1">
                  Minimum withdrawal threshold: ৳500
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Payout Method / Channel *
                </label>
                <select
                  value={payoutForm.method}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, method: e.target.value as PaymentMethod })
                  }
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:border-brand-primary outline-none"
                >
                  <option value={PaymentMethod.BKASH}>bKash Personal Mobile Wallet</option>
                  <option value={PaymentMethod.NAGAD}>Nagad Personal Mobile Wallet</option>
                  <option value={PaymentMethod.ROCKET}>Rocket Personal Mobile Wallet</option>
                  <option value={PaymentMethod.CASH}>Campus Cash Counter Collection</option>
                </select>
              </div>

              {payoutForm.method !== PaymentMethod.CASH && (
                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-text-main/40" />
                    Mobile Financial Wallet Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 017XXXXXXXX"
                    value={payoutForm.accountNumber}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, accountNumber: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:border-brand-primary outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Note for Accounts Officer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal bKash number, urgent payout"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:border-brand-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-text-main/70 hover:bg-bg-app border border-theme rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-95 transition-opacity shadow-xs disabled:opacity-50"
                >
                  {submittingPayout ? "Submitting..." : "Submit Withdrawal Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
