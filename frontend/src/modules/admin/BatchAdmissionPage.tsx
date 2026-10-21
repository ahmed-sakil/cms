import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  DollarSign,
  AlertCircle,
  Clock,
  User,
  Lock,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { formatCurrency } from "../../lib/formatters.js";
import { PaymentMethod } from "../../types/index.js";

export const BatchAdmissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [discountsList, setDiscountsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [baseFee, setBaseFee] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"NONE" | "FIXED" | "PERCENTAGE">("NONE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });

  // Payment Collection State
  const [collectPaymentNow, setCollectPaymentNow] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [transactionId, setTransactionId] = useState("");
  const [notes] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const resStudent = await apiClient.get<any>(`/admin/students/${id}`);
        if (!resStudent.success || !resStudent.data) {
          toast.error("Student record not found");
          navigate("/admin/students");
          return;
        }

        const studentData = resStudent.data;
        setStudent(studentData);

        const studentBranchId = studentData.branchId || studentData.branch?.id || "";

        // Query batches scoped to student branch
        const batchQuery = studentBranchId ? `?branchId=${studentBranchId}` : "";
        const [resBatches, resDiscounts] = await Promise.all([
          apiClient.get<any[]>(`/academics/batches${batchQuery}`),
          apiClient.get<any[]>("/finance/discounts"),
        ]);

        if (resBatches.success && Array.isArray(resBatches.data)) {
          setBatches(resBatches.data);
          if (resBatches.data.length > 0) {
            const first = resBatches.data[0];
            setSelectedBatchId(first.id);
            const fee = Number(first.feeAmount || 6000);
            setBaseFee(fee);
            setPaymentAmount(fee);
          }
        }

        if (resDiscounts.success && Array.isArray(resDiscounts.data)) {
          setDiscountsList(resDiscounts.data);
        }
      } catch {
        toast.error("Failed to load admission parameters");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const chosen = batches.find((b) => b.id === batchId);
    if (chosen) {
      const fee = Number(chosen.feeAmount || 6000);
      setBaseFee(fee);
      recalcPayment(fee, discountType, discountValue);
    }
  };

  const handleDiscountTypeChange = (type: "NONE" | "FIXED" | "PERCENTAGE") => {
    setDiscountType(type);
    if (type === "NONE") {
      setDiscountValue(0);
      recalcPayment(baseFee, "NONE", 0);
    } else {
      recalcPayment(baseFee, type, discountValue);
    }
  };

  const handleDiscountValueChange = (val: number) => {
    setDiscountValue(val);
    recalcPayment(baseFee, discountType, val);
  };

  const recalcPayment = (base: number, dType: string, dVal: number) => {
    let discount = 0;
    if (dType === "FIXED") {
      discount = Math.min(base, dVal);
    } else if (dType === "PERCENTAGE") {
      discount = Math.min(base, (base * dVal) / 100);
    }
    const net = Math.max(0, base - discount);
    setPaymentAmount(net);
  };

  // Calculations
  const calculatedDiscount =
    discountType === "FIXED"
      ? Math.min(baseFee, discountValue)
      : discountType === "PERCENTAGE"
      ? Math.min(baseFee, (baseFee * discountValue) / 100)
      : 0;

  const netPayable = Math.max(0, baseFee - calculatedDiscount);
  const remainingDue = Math.max(0, netPayable - (collectPaymentNow ? Number(paymentAmount) : 0));

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const isBatchFull =
    selectedBatch &&
    selectedBatch.seatLimit &&
    selectedBatch._count?.enrollments >= selectedBatch.seatLimit;

  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !selectedBatchId) {
      toast.error("Please select an academic batch");
      return;
    }

    if (isBatchFull) {
      toast.error("Selected batch has reached maximum physical seating capacity!");
      return;
    }

    if (collectPaymentNow) {
      if (paymentAmount < 0) {
        toast.error("Payment amount cannot be negative");
        return;
      }
      if (paymentAmount > netPayable) {
        toast.error(`Payment amount cannot exceed the net payable amount of ${formatCurrency(netPayable)}`);
        return;
      }
      if (paymentMethod !== PaymentMethod.CASH && !transactionId.trim()) {
        toast.error("Please provide a transaction ID for digital/bank payment");
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Enroll student into batch
      const enrollRes = await apiClient.post<any>(`/academics/batches/${selectedBatchId}/enroll`, {
        studentId: student.id,
        status: "ACTIVE",
      });

      if (!enrollRes.success) {
        throw new Error(enrollRes.message || "Failed to enroll student into batch");
      }

      // 2. Generate Student Invoice
      const invoicePayload = {
        studentId: student.id,
        batchId: selectedBatchId,
        branchId: student.branchId || student.branch?.id,
        title: `Admission & Tuition - ${selectedBatch?.name || "Batch Enrollment"}`,
        subtotal: baseFee,
        discountAmount: calculatedDiscount,
        discountReason: calculatedDiscount > 0 ? discountReason || "Special Admission Waiver" : undefined,
        dueDate,
        notes: notes || undefined,
      };

      const invoiceRes = await apiClient.post<any>("/finance/invoices", invoicePayload);
      if (!invoiceRes.success || !invoiceRes.data) {
        throw new Error(invoiceRes.message || "Batch enrolled, but invoice generation failed");
      }

      const createdInvoice = invoiceRes.data;

      // 3. If initial payment collected, record it
      if (collectPaymentNow && paymentAmount > 0) {
        const paymentPayload = {
          invoiceId: createdInvoice.id,
          amount: Number(paymentAmount),
          method: paymentMethod,
          transactionId: transactionId || undefined,
          notes: notes || "Initial Admission Payment",
        };

        const paymentRes = await apiClient.post<any>(
          `/finance/invoices/${createdInvoice.id}/collect`,
          paymentPayload
        );

        if (!paymentRes.success) {
          toast.warning("Admission & invoice created, but payment recording encountered an issue.");
        }
      }

      toast.success(
        `Successfully admitted ${student.fullName} into ${selectedBatch?.name}! Invoice and financial records updated.`
      );

      navigate(`/admin/students/${student.id}`);
    } catch (err: any) {
      toast.error(err.message || "Admission process failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
        <p className="text-xs text-text-main/60">Preparing admission desk...</p>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ========================================== */}
      {/* BREADCRUMBS */}
      {/* ========================================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/students/${student.id}`}
            className="inline-flex items-center gap-1 text-xs text-text-main/60 hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </Link>
          <span className="text-xs text-text-main/30">/</span>
          <span className="text-xs font-semibold text-text-main">Batch Admission & Financial Desk</span>
        </div>
      </div>

      {/* ========================================== */}
      {/* STEP 1: AUTO-FILLED STUDENT SUMMARY */}
      {/* ========================================== */}
      <div className="bg-surface border border-theme rounded-sm p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center border-b border-theme pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-main/60 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-primary" />
            Student Credentials (Auto-Filled & Verified)
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-text-main/60 bg-bg-app px-2 py-0.5 border border-theme rounded-xs">
            <Lock className="w-3 h-3 text-brand-primary" /> Locked
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={student.fullName}
                className="w-12 h-12 rounded-sm object-cover border border-theme shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-sm bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-base font-mono">
                {student.fullName ? student.fullName.charAt(0).toUpperCase() : "S"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-text-main">{student.fullName}</h3>
                <span className="font-mono text-xs px-1.5 py-0.5 bg-bg-app border border-theme rounded-xs font-bold">
                  {student.studentProfile?.rollNumber || "PENDING"}
                </span>
              </div>
              <p className="text-xs text-text-main/60">
                {student.email} • {student.phone || "No phone"}
              </p>
            </div>
          </div>

          <div className="text-xs space-y-0.5 sm:text-right">
            <div className="inline-flex items-center gap-1 text-text-main font-semibold">
              <Building2 className="w-3.5 h-3.5 text-brand-primary" />
              <span>{student.branch?.name || "Main Campus"}</span>
            </div>
            <p className="text-[11px] text-text-main/60">
              Guardian: {student.studentProfile?.guardianName} ({student.studentProfile?.guardianPhone})
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitAdmission} className="space-y-6">
        {/* ========================================== */}
        {/* STEP 2: BATCH SELECTION & CAPACITY */}
        {/* ========================================== */}
        <div className="bg-surface border border-theme rounded-sm p-5 shadow-xs space-y-4">
          <div className="border-b border-theme pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-main/60 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
              Select Target Academic Batch
            </h2>
            <p className="text-[11px] text-text-main/50 mt-0.5">
              Batches available at {student.branch?.name || "the assigned campus"}.
            </p>
          </div>

          {batches.length === 0 ? (
            <div className="p-6 text-center bg-bg-app border border-theme rounded-sm space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs font-medium text-text-main">
                No active batches found for this campus.
              </p>
              <p className="text-[11px] text-text-main/60">
                Please create a batch for this campus in the Batches Management module before admitting students.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {batches.map((b) => {
                  const isSelected = selectedBatchId === b.id;
                  const seatLimit = b.seatLimit || b.maxCapacity || 40;
                  const enrolled = b._count?.enrollments || 0;
                  const available = Math.max(0, seatLimit - enrolled);
                  const isFull = available === 0;

                  return (
                    <div
                      key={b.id}
                      onClick={() => !isFull && handleBatchChange(b.id)}
                      className={`p-3.5 border rounded-sm transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary"
                          : isFull
                          ? "bg-bg-app/40 border-theme opacity-50 cursor-not-allowed"
                          : "bg-surface border-theme hover:border-text-main/30"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-text-main">{b.name}</h4>
                          <p className="text-[11px] text-text-main/60">
                            {b.course?.name || "Academic Program"}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-brand-primary">
                          {formatCurrency(b.feeAmount)}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-theme/50 flex items-center justify-between text-[11px] text-text-main/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-main/40" />
                          {b.scheduleTime || b.classTime || "Scheduled Routine"}
                        </span>
                        <span
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-xs ${
                            isFull
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {isFull ? "SEATS FULL" : `${available} seats left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedBatch && (
                <div className="p-3 bg-bg-app border border-theme rounded-xs text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-primary" />
                    <span>
                      Selected: <strong>{selectedBatch.name}</strong> • Base Tuition:{" "}
                      <strong>{formatCurrency(selectedBatch.feeAmount)}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-text-main/50">
                    Physical Room: {selectedBatch.classroom || "Assigned Classroom"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* STEP 3: FINANCIAL RECORDS & TUITION SETUP */}
        {/* ========================================== */}
        <div className="bg-surface border border-theme rounded-sm p-5 shadow-xs space-y-4">
          <div className="border-b border-theme pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-main/60 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-brand-primary" />
              Tuition Billing & Waiver Breakdown
            </h2>
            <p className="text-[11px] text-text-main/50 mt-0.5">
              Configure tuition fee, apply scholarships or waivers, and record initial desk payment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Column: Fee & Discount */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Base Tuition Fee (৳) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={baseFee}
                  onChange={(e) => {
                    const fee = Number(e.target.value);
                    setBaseFee(fee);
                    recalcPayment(fee, discountType, discountValue);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Tuition Waiver / Scholarship</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDiscountTypeChange("NONE")}
                    className={`py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
                      discountType === "NONE"
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-bg-app border-theme text-text-main/70"
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscountTypeChange("FIXED")}
                    className={`py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
                      discountType === "FIXED"
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-bg-app border-theme text-text-main/70"
                    }`}
                  >
                    Flat ৳
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscountTypeChange("PERCENTAGE")}
                    className={`py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
                      discountType === "PERCENTAGE"
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-bg-app border-theme text-text-main/70"
                    }`}
                  >
                    Percent %
                  </button>
                </div>

                {discountsList.length > 0 && (
                  <div className="pt-2">
                    <select
                      onChange={(e) => {
                        const d = discountsList.find((item) => item.id === e.target.value);
                        if (d) {
                          const isPercent = d.type === "PERCENTAGE";
                          setDiscountType(isPercent ? "PERCENTAGE" : "FIXED");
                          setDiscountValue(Number(d.value));
                          setDiscountReason(d.name || d.title || "Preset Discount");
                          recalcPayment(baseFee, isPercent ? "PERCENTAGE" : "FIXED", Number(d.value));
                        }
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">Or pick standard scholarship template...</option>
                      {discountsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.title} ({d.type === "PERCENTAGE" ? `${d.value}%` : `৳${d.value}`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {discountType !== "NONE" && (
                <div className="space-y-3 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xs">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-primary">
                      {discountType === "FIXED" ? "Discount Amount (৳)" : "Discount Percentage (%)"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={discountType === "PERCENTAGE" ? 100 : baseFee}
                      value={discountValue}
                      onChange={(e) => handleDiscountValueChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-primary">Waiver / Scholarship Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Merit scholarship or sibling discount"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Invoice Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            {/* Right Column: Calculation & Live Receipt preview */}
            <div className="p-4 bg-bg-app border border-theme rounded-sm space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 mb-2">
                  Financial Invoice Summary
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-theme/40">
                    <span className="text-text-main/60">Subtotal Tuition:</span>
                    <span className="font-mono font-bold text-text-main">{formatCurrency(baseFee)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-theme/40">
                    <span className="text-text-main/60">Discount / Waiver:</span>
                    <span className="font-mono font-bold text-rose-500">
                      - {formatCurrency(calculatedDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b-2 border-theme">
                    <span className="font-bold text-text-main">Net Payable:</span>
                    <span className="font-mono font-black text-brand-primary text-base">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Initial Payment Toggle */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectPaymentNow}
                    onChange={(e) => setCollectPaymentNow(e.target.checked)}
                    className="rounded-xs text-brand-primary focus:ring-0"
                  />
                  <span>Collect Initial Payment at Desk Now</span>
                </label>

                {collectPaymentNow && (
                  <div className="space-y-2 pt-2 border-t border-theme">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <label className="font-semibold text-text-main">Amount Received (৳)</label>
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(netPayable)}
                          className="text-brand-primary hover:underline"
                        >
                          Full Paid
                        </button>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={netPayable}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono font-bold text-emerald-500 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-text-main">Payment Channel</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                      >
                        <option value={PaymentMethod.CASH}>Cash (Desk Counter)</option>
                        <option value={PaymentMethod.BKASH}>bKash</option>
                        <option value={PaymentMethod.NAGAD}>Nagad</option>
                        <option value={PaymentMethod.ROCKET}>Rocket</option>
                        <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                      </select>
                    </div>

                    {paymentMethod !== PaymentMethod.CASH && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-text-main">Transaction ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. TRX-9923847"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs pt-1 font-semibold">
                      <span className="text-text-main/60">Remaining Due Balance:</span>
                      <span
                        className={`font-mono font-bold ${
                          remainingDue > 0 ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {formatCurrency(remainingDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to={`/admin/students/${student.id}`}
            className="px-4 py-2 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || batches.length === 0 || isBatchFull}
            className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 shadow-xs transition-colors disabled:opacity-50"
          >
            <GraduationCap className="w-4 h-4" />
            {submitting ? "Processing Batch Admission..." : "Confirm Batch Admission & Issue Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BatchAdmissionPage;
