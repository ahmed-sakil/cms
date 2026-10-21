import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Building2,
  DollarSign,
  CreditCard,
  Printer,
  Edit,
  Trash2,
  BookOpen,
  Award,
  ShieldCheck,
  UserCheck,
  X,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/formatters.js";
import { Gender, PaymentMethod, InvoiceStatus } from "../../types/index.js";
import { FileUpload } from "../../components/common/FileUpload.js";
import { StudentIdCardModal } from "../../components/StudentIdCardModal.js";
import { PrintableReceiptModal, ReceiptData } from "../../components/PrintableReceiptModal.js";

export const StudentProfileAdminView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "financial" | "academics">("overview");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [branches, setBranches] = useState<any[]>([]);

  // Collect Fee Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [feeForm, setFeeForm] = useState({
    amount: 0,
    method: PaymentMethod.CASH,
    transactionId: "",
    accountNumber: "",
    notes: "",
  });
  const [isCollectingFee, setIsCollectingFee] = useState(false);

  // Print Modals
  const [printableReceipt, setPrintableReceipt] = useState<ReceiptData | null>(null);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [organization, setOrganization] = useState<any>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const fetchStudentDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [resStudent, resOrg, resBranches] = await Promise.all([
        apiClient.get<any>(`/admin/students/${id}`),
        apiClient.get<any>("/public/landing"),
        apiClient.get<any[]>("/admin/branches"),
      ]);

      if (resStudent.success && resStudent.data) {
        setStudent(resStudent.data);
      } else {
        toast.error("Could not find student record");
        navigate("/admin/students");
      }

      if (resOrg.success && resOrg.data?.organization) {
        setOrganization(resOrg.data.organization);
      }
      if (resBranches.success && Array.isArray(resBranches.data)) {
        setBranches(resBranches.data);
      }
    } catch {
      toast.error("Failed to load student record from server");
      navigate("/admin/students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const handleOpenEdit = () => {
    if (!student) return;
    const p = student.studentProfile || {};
    setEditForm({
      fullName: student.fullName || "",
      email: student.email || "",
      phone: student.phone || "",
      avatarUrl: student.avatarUrl || "",
      branchId: student.branchId || student.branch?.id || "",
      rollNumber: p.rollNumber || "",
      gender: p.gender || Gender.MALE,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
      bloodGroup: p.bloodGroup || "",
      currentClass: p.currentClass || "",
      institutionName: p.institutionName || "",
      fatherName: p.fatherName || "",
      motherName: p.motherName || "",
      guardianType: p.guardianType || "FATHER",
      guardianName: p.guardianName || "",
      guardianPhone: p.guardianPhone || "",
      address: p.address || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsUpdating(true);
    try {
      const res = await apiClient.put<any>(`/admin/students/${id}`, editForm);
      if (res.success) {
        toast.success("Student profile updated successfully");
        setIsEditModalOpen(false);
        await fetchStudentDetails();
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = () => {
    if (!student) return;
    toast(`Delete student account "${student.fullName}"?`, {
      description: "This will deactivate the student account and archive all enrolled batch records.",
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          try {
            const res = await apiClient.delete<any>(`/admin/students/${student.id}`);
            if (res.success) {
              toast.success(`Account for '${student.fullName}' deleted successfully`);
              navigate("/admin/students");
            } else {
              toast.error(res.message || "Failed to delete student account");
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to delete student account");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(),
      },
      duration: 10000,
    });
  };

  const handleOpenFeeModal = (invoice?: any) => {
    setSelectedInvoice(invoice || null);
    setFeeForm({
      amount: invoice ? Number(invoice.dueAmount) : 0,
      method: PaymentMethod.CASH,
      transactionId: "",
      accountNumber: "",
      notes: "",
    });
    setIsFeeModalOpen(true);
  };

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      toast.error("Please select an invoice to collect payment");
      return;
    }
    if (feeForm.amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    setIsCollectingFee(true);
    try {
      const res = await apiClient.post<any>(`/finance/invoices/${selectedInvoice.id}/collect`, {
        amount: Number(feeForm.amount),
        method: feeForm.method,
        transactionId: feeForm.transactionId || undefined,
        accountNumber: feeForm.accountNumber || undefined,
        notes: feeForm.notes || undefined,
      });

      if (res.success && res.data) {
        toast.success("Payment recorded successfully!");
        setIsFeeModalOpen(false);
        // Prepare printable receipt
        setPrintableReceipt({
          id: res.data.id,
          receiptNumber: res.data.receiptNumber,
          invoiceNumber: selectedInvoice.invoiceNumber,
          paidAt: res.data.paidAt || new Date().toISOString(),
          amount: Number(res.data.amount),
          method: res.data.method,
          transactionId: res.data.transactionId,
          accountNumber: res.data.accountNumber,
          notes: res.data.notes,
          student: {
            fullName: student.fullName,
            rollNumber: student.studentProfile?.rollNumber || "N/A",
            phone: student.phone,
            guardianName: student.studentProfile?.guardianName,
            guardianPhone: student.studentProfile?.guardianPhone,
          },
          invoice: {
            title: selectedInvoice.title,
            subtotal: Number(selectedInvoice.subtotal),
            discountAmount: Number(selectedInvoice.discountAmount),
            discountReason: selectedInvoice.discountReason,
            totalAmount: Number(selectedInvoice.totalAmount),
            paidAmount: Number(selectedInvoice.paidAmount) + Number(feeForm.amount),
            dueAmount: Math.max(0, Number(selectedInvoice.dueAmount) - Number(feeForm.amount)),
            batchName: selectedInvoice.batch?.name,
            branchName: selectedInvoice.branch?.name,
          },
        });
        await fetchStudentDetails();
      } else {
        toast.error(res.message || "Failed to record payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsCollectingFee(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
        <p className="text-xs text-text-main/60">Loading student profile record...</p>
      </div>
    );
  }

  if (!student) return null;

  const profile = student.studentProfile || {};
  const enrollments = profile.enrollments || [];
  const invoices = profile.invoices || [];
  const payments = profile.payments || [];
  const attendances = profile.attendances || [];
  const examResults = profile.examResults || [];

  // Financial calculations
  const totalBilled = invoices.reduce((acc: number, inv: any) => acc + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((acc: number, inv: any) => acc + Number(inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((acc: number, inv: any) => acc + Number(inv.dueAmount || 0), 0);

  // Attendance rate
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const attendanceRate = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : null;

  // Exam stats
  const avgExamScore =
    examResults.length > 0
      ? Math.round(
          examResults.reduce((acc: number, r: any) => {
            const perc = (Number(r.marksObtained) / Number(r.exam?.totalMarks || 100)) * 100;
            return acc + perc;
          }, 0) / examResults.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* ========================================== */}
      {/* BREADCRUMB & NAVIGATION BAR */}
      {/* ========================================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-1 text-xs text-text-main/60 hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Students Directory</span>
          </Link>
          <span className="text-xs text-text-main/30">/</span>
          <span className="text-xs font-semibold text-text-main">{student.fullName}</span>
        </div>
      </div>

      {/* ========================================== */}
      {/* STUDENT HERO CARD */}
      {/* ========================================== */}
      <div className="bg-surface border border-theme rounded-sm p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Avatar and Basic Details */}
          <div className="flex items-center gap-4">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={student.fullName}
                className="w-16 h-16 rounded-sm object-cover border border-theme shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-sm bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-black text-xl font-mono">
                {student.fullName ? student.fullName.charAt(0).toUpperCase() : "S"}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-text-main tracking-tight">{student.fullName}</h1>
                <span className="px-2 py-0.5 bg-bg-app border border-theme rounded-xs text-xs font-mono font-bold text-text-main">
                  ROLL: {profile.rollNumber || "PENDING"}
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xs text-[10px] font-bold tracking-wider uppercase">
                  Active
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-text-main/70 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                  {student.branch?.name || "Main Campus"}
                </span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-text-main/40" />
                  {student.phone || "No phone"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-text-main/40" />
                  {student.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-text-main/50">
                  <Calendar className="w-3.5 h-3.5" />
                  Admitted {formatDate(student.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <Link
              to={`/admin/students/${student.id}/admit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 shadow-xs transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Admit to Batch
            </Link>

            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-app border border-theme text-xs font-semibold text-text-main hover:bg-surface rounded-sm transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-text-main/60" />
              Edit Profile
            </button>

            <button
              onClick={() => setIsIdCardOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-app border border-theme text-xs font-semibold text-text-main hover:bg-surface rounded-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-text-main/60" />
              Print ID Card
            </button>

            <button
              onClick={handleDeleteStudent}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-semibold rounded-sm transition-colors"
              title="Delete or deactivate student account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Informative Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-theme">
          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Enrolled Batches</span>
            <span className="text-xl font-black text-brand-primary mt-0.5 block font-mono">
              {enrollments.length}
            </span>
          </div>

          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Total Tuition Invoiced</span>
            <span className="text-xl font-black text-text-main mt-0.5 block font-mono">
              {formatCurrency(totalBilled)}
            </span>
          </div>

          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Fees Paid</span>
            <span className="text-xl font-black text-emerald-500 mt-0.5 block font-mono">
              {formatCurrency(totalPaid)}
            </span>
          </div>

          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Outstanding Dues</span>
            <span
              className={`text-xl font-black mt-0.5 block font-mono ${
                totalDue > 0 ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {formatCurrency(totalDue)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB NAVIGATION */}
      {/* ========================================== */}
      <div className="flex border-b border-theme gap-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Bio & Registration Details
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "batches"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Enrolled Batches ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab("financial")}
          className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "financial"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Financial Ledger ({invoices.length} Invoices)
        </button>

        <button
          onClick={() => setActiveTab("academics")}
          className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "academics"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Attendance & Exam History
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: BIO & REGISTRATION DETAILS */}
      {/* ========================================== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Personal & Academic */}
          <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 border-b border-theme pb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              Academic & Personal Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Roll Number:</span>
                <span className="font-mono font-bold text-text-main">{profile.rollNumber || "PENDING"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Campus / Branch:</span>
                <span className="font-semibold text-text-main">{student.branch?.name || "Main Campus"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Current Class / Level:</span>
                <span className="font-semibold text-text-main">{profile.currentClass || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">School / College:</span>
                <span className="font-semibold text-text-main">{profile.institutionName || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Gender:</span>
                <span className="font-semibold text-text-main">{profile.gender || "MALE"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Date of Birth:</span>
                <span className="font-semibold text-text-main">
                  {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Blood Group:</span>
                <span className="font-mono font-bold text-rose-500">{profile.bloodGroup || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-main/60">Referral Code:</span>
                <span className="font-mono font-bold text-brand-primary">{profile.referralCode || "—"}</span>
              </div>
            </div>
          </div>

          {/* Card: Guardian & Contact Details */}
          <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 border-b border-theme pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Parents & Guardian Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Primary Guardian:</span>
                <span className="font-semibold text-text-main">
                  {profile.guardianName} ({profile.guardianType || "Guardian"})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Guardian Mobile:</span>
                <span className="font-mono font-bold text-brand-primary">{profile.guardianPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Father's Name:</span>
                <span className="font-semibold text-text-main">{profile.fatherName || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Mother's Name:</span>
                <span className="font-semibold text-text-main">{profile.motherName || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Student Email:</span>
                <span className="font-mono text-text-main">{student.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-text-main/60">Student Phone:</span>
                <span className="font-mono text-text-main">{student.phone || "—"}</span>
              </div>
              <div className="py-1">
                <span className="text-text-main/60 block mb-1">Residential Address:</span>
                <span className="font-medium text-text-main block bg-bg-app p-2 border border-theme rounded-xs">
                  {profile.address || "No residential address provided."}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: ENROLLED BATCHES */}
      {/* ========================================== */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-main">Academic Batch Enrollments</h3>
            <Link
              to={`/admin/students/${student.id}/admit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Admit into New Batch
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-theme rounded-sm space-y-3">
              <BookOpen className="w-8 h-8 text-text-main/30 mx-auto" />
              <p className="text-xs text-text-main/60">This student is not yet enrolled into any batch.</p>
              <Link
                to={`/admin/students/${student.id}/admit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90"
              >
                Enroll into a Batch Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((e: any) => {
                const batch = e.batch || {};
                const course = batch.course || {};
                return (
                  <div
                    key={e.id}
                    className="bg-surface border border-theme rounded-sm p-4 space-y-3 shadow-xs hover:border-brand-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-text-main">{batch.name}</h4>
                        <p className="text-xs text-text-main/60">{course.name || "Specialized Academic Program"}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/30 rounded-xs text-[10px] font-bold">
                        {e.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-text-main/70 pt-2 border-t border-theme">
                      <div>
                        <span className="text-text-main/40 block">Enrolled On:</span>
                        <span className="font-mono font-semibold">{formatDate(e.enrolledAt)}</span>
                      </div>
                      <div>
                        <span className="text-text-main/40 block">Tuition Fee:</span>
                        <span className="font-mono font-bold text-text-main">
                          {formatCurrency(batch.feeAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-main/40 block">Class Schedule:</span>
                        <span>{batch.scheduleTime || batch.classTime || "Routine as published"}</span>
                      </div>
                      <div>
                        <span className="text-text-main/40 block">Classroom:</span>
                        <span>{batch.classroom || "Assigned Room"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: FINANCIAL LEDGER */}
      {/* ========================================== */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          {/* Invoices Section */}
          <div className="bg-surface border border-theme rounded-sm shadow-xs overflow-hidden">
            <div className="p-4 border-b border-theme flex justify-between items-center bg-bg-app/40">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-text-main">Student Invoices</h3>
                <p className="text-[11px] text-text-main/60">Official billing and tuition records.</p>
              </div>
              <Link
                to={`/admin/students/${student.id}/admit`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5" /> New Batch Invoice
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-app text-text-main/60 border-b border-theme uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Title / Program</th>
                    <th className="py-2.5 px-4">Total</th>
                    <th className="py-2.5 px-4">Paid</th>
                    <th className="py-2.5 px-4">Due</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-text-main/50">
                        No invoices generated yet for this student.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-bg-app/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-primary">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-text-main">
                          {inv.title}
                          {inv.batch && (
                            <span className="block text-[10px] text-text-main/50 font-normal">
                              Batch: {inv.batch.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-text-main">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-500 font-semibold">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-500 font-bold">
                          {formatCurrency(inv.dueAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-main/60">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border ${
                              inv.status === InvoiceStatus.PAID
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : inv.status === InvoiceStatus.PARTIALLY_PAID
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {Number(inv.dueAmount) > 0 && (
                            <button
                              onClick={() => handleOpenFeeModal(inv)}
                              className="px-2.5 py-1 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                            >
                              Collect Fee
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

          {/* Payment Transactions Section */}
          <div className="bg-surface border border-theme rounded-sm shadow-xs overflow-hidden">
            <div className="p-4 border-b border-theme bg-bg-app/40">
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-main">Payment Receipts</h3>
              <p className="text-[11px] text-text-main/60">Recorded payment transactions & physical money receipts.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-app text-text-main/60 border-b border-theme uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Channel / Method</th>
                    <th className="py-2.5 px-4">Transaction Ref</th>
                    <th className="py-2.5 px-4 text-right">Print Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-text-main/50">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-bg-app/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-text-main">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-main/70">
                          {formatDateTime(p.paidAt)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-500">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-bg-app border border-theme rounded-xs text-[10px] font-semibold text-text-main">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-text-main/60 text-[11px]">
                          {p.transactionId || "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setPrintableReceipt({
                                id: p.id,
                                receiptNumber: p.receiptNumber,
                                invoiceNumber: p.invoice?.invoiceNumber,
                                paidAt: p.paidAt,
                                amount: Number(p.amount),
                                method: p.method,
                                transactionId: p.transactionId,
                                accountNumber: p.accountNumber,
                                student: {
                                  fullName: student.fullName,
                                  rollNumber: profile.rollNumber || "N/A",
                                  phone: student.phone,
                                  guardianName: profile.guardianName,
                                  guardianPhone: profile.guardianPhone,
                                },
                                invoice: p.invoice
                                  ? {
                                      title: p.invoice.title || "Tuition Invoice",
                                      subtotal: Number(p.amount),
                                      discountAmount: 0,
                                      totalAmount: Number(p.amount),
                                      paidAmount: Number(p.amount),
                                      dueAmount: 0,
                                    }
                                  : null,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-bg-app hover:bg-brand-primary hover:text-white border border-theme rounded-sm transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Receipt
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

      {/* ========================================== */}
      {/* TAB 4: ACADEMICS & EXAMS */}
      {/* ========================================== */}
      {activeTab === "academics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exam Results */}
          <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 border-b border-theme pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-primary" />
                Exam Results Record
              </span>
              {avgExamScore !== null && (
                <span className="text-emerald-500 font-mono font-bold">Avg: {avgExamScore}%</span>
              )}
            </h3>

            {examResults.length === 0 ? (
              <p className="text-xs text-text-main/50 italic py-6 text-center">
                No formal examination scores logged yet.
              </p>
            ) : (
              <div className="space-y-2">
                {examResults.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 bg-bg-app border border-theme rounded-xs flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-semibold text-text-main">{r.exam?.title || "Exam"}</p>
                      <p className="text-[10px] text-text-main/50">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-brand-primary text-sm">
                        {r.marksObtained} / {r.exam?.totalMarks || 100}
                      </span>
                      <span className="block text-[10px] font-semibold text-emerald-500">
                        {Math.round((Number(r.marksObtained) / Number(r.exam?.totalMarks || 100)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Log */}
          <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main/60 border-b border-theme pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-primary" />
                Attendance Log (Recent 30 Sessions)
              </span>
              {attendanceRate !== null && (
                <span className="text-brand-primary font-mono font-bold">{attendanceRate}% Present</span>
              )}
            </h3>

            {attendances.length === 0 ? (
              <p className="text-xs text-text-main/50 italic py-6 text-center">
                No attendance sessions recorded yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {attendances.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-2.5 bg-bg-app border border-theme rounded-xs flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono font-medium text-text-main">{formatDate(a.date)}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                        a.status === "PRESENT"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : a.status === "LATE"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EDIT STUDENT PROFILE */}
      {/* ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Edit className="w-4 h-4 text-brand-primary" /> Edit Student Record
                </h3>
                <p className="text-xs text-text-main/60">
                  Update personal, academic, and parent details for this student profile.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Profile Photo / Avatar</label>
                <FileUpload
                  folder="avatars"
                  value={editForm.avatarUrl || ""}
                  onChange={(url) => setEditForm({ ...editForm, avatarUrl: url })}
                  helperText="Upload official student passport photograph"
                />
              </div>

              {/* Personal Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Email (Username) *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as Gender })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Blood Group</label>
                  <select
                    value={editForm.bloodGroup || ""}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">Select Blood Group</option>
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Academic Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-theme">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Roll Number</label>
                  <input
                    type="text"
                    value={editForm.rollNumber}
                    onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Class / Level</label>
                  <input
                    type="text"
                    placeholder="e.g. HSC 2nd Year"
                    value={editForm.currentClass}
                    onChange={(e) => setEditForm({ ...editForm, currentClass: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Institution</label>
                  <input
                    type="text"
                    placeholder="College or School"
                    value={editForm.institutionName}
                    onChange={(e) => setEditForm({ ...editForm, institutionName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Assigned Campus / Branch</label>
                  <select
                    value={editForm.branchId}
                    onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parents Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-theme">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Father's Name</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Mother's Name</label>
                  <input
                    type="text"
                    value={editForm.motherName}
                    onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Guardian Type</label>
                  <select
                    value={editForm.guardianType}
                    onChange={(e) => setEditForm({ ...editForm, guardianType: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="OTHER">Other Guardian</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.guardianName}
                    onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Guardian Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.guardianPhone}
                    onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Residential Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: COLLECT FEE */}
      {/* ========================================== */}
      {isFeeModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-primary" /> Collect Student Fee
                </h3>
                <p className="text-xs text-text-main/60">
                  Invoice: {selectedInvoice.invoiceNumber} • Due: {formatCurrency(selectedInvoice.dueAmount)}
                </p>
              </div>
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Payment Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Number(selectedInvoice.dueAmount)}
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono text-base font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Payment Channel / Method *</label>
                <select
                  value={feeForm.method}
                  onChange={(e) => setFeeForm({ ...feeForm, method: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                >
                  <option value={PaymentMethod.CASH}>Cash (Desk Counter)</option>
                  <option value={PaymentMethod.BKASH}>bKash</option>
                  <option value={PaymentMethod.NAGAD}>Nagad</option>
                  <option value={PaymentMethod.ROCKET}>Rocket</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                </select>
              </div>

              {feeForm.method !== PaymentMethod.CASH && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Transaction Reference ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRX99283741"
                    value={feeForm.transactionId}
                    onChange={(e) => setFeeForm({ ...feeForm, transactionId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Optional memo"
                  value={feeForm.notes}
                  onChange={(e) => setFeeForm({ ...feeForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCollectingFee}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50"
                >
                  {isCollectingFee ? "Processing..." : "Confirm & Print Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PRINTABLE ID CARD MODAL */}
      {/* ========================================== */}
      {isIdCardOpen && (
        <StudentIdCardModal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          student={{
            id: student.id,
            fullName: student.fullName,
            rollNumber: profile.rollNumber || "PENDING",
            email: student.email,
            phone: student.phone || "",
            avatarUrl: student.avatarUrl,
            bloodGroup: profile.bloodGroup,
            guardianName: profile.guardianName,
            guardianPhone: profile.guardianPhone,
            branchName: student.branch?.name || "Main Campus",
            batchName: enrollments[0]?.batch?.name || "General Batch",
            academicYear: "2026-2027",
          }}
          institutionName={organization?.name || ""}
          institutionTagline={organization?.tagline || ""}
          institutionPhone={organization?.phone || ""}
          institutionAddress={organization?.address || ""}
          institutionLogo={organization?.logoUrl || ""}
        />
      )}

      {/* ========================================== */}
      {/* PRINTABLE RECEIPT MODAL */}
      {/* ========================================== */}
      {printableReceipt && (
        <PrintableReceiptModal
          isOpen={!!printableReceipt}
          onClose={() => setPrintableReceipt(null)}
          receipt={printableReceipt}
          institutionName={organization?.name || ""}
          institutionTagline={organization?.tagline || ""}
          institutionPhone={organization?.phone || ""}
          institutionAddress={organization?.address || ""}
        />
      )}
    </div>
  );
};

export default StudentProfileAdminView;
