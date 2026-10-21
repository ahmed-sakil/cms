import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  UserCheck,
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Crown,
  GraduationCap,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Gender, BranchRecord } from "../../types/index.js";
import { apiClient } from "../../lib/apiClient.js";
import { FileUpload } from "../../components/common/FileUpload.js";
import { StudentIdCardModal, StudentIdCardData } from "../../components/StudentIdCardModal.js";

export const StudentsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit Student Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // ID Card Modal
  const [cardModalStudent, setCardModalStudent] = useState<StudentIdCardData | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";
  const userBranchId = currentUser?.branchId || currentUser?.branch?.id || "";

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isBranchAdmin ? userBranchId : "ALL"
  );

  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);

  const defaultBranchId = isBranchAdmin
    ? userBranchId
    : selectedBranchId !== "ALL"
    ? selectedBranchId
    : branches[0]?.id || "";

  // Admission Form State
  const [admissionForm, setAdmissionForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    avatarUrl: "",
    branchId: defaultBranchId,
    rollNumber: "",
    currentClass: "",
    institutionName: "",
    batchId: "",
    gender: Gender.MALE,
    dateOfBirth: "",
    bloodGroup: "",
    fatherName: "",
    motherName: "",
    guardianType: "FATHER",
    guardianName: "",
    guardianPhone: "",
    address: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const branchQuery =
        !isBranchAdmin && selectedBranchId !== "ALL" ? `?branchId=${selectedBranchId}` : "";

      const [resStudents, resBranches, resBatches, resLanding] = await Promise.all([
        apiClient.get<any>(`/admin/students${branchQuery}`),
        apiClient.get<BranchRecord[]>("/admin/branches"),
        apiClient.get<any[]>("/academics/batches"),
        apiClient.get<any>("/public/landing"),
      ]);

      if (resStudents.success && resStudents.data?.items) {
        setStudents(resStudents.data.items);
      } else if (resStudents.success && Array.isArray(resStudents.data)) {
        setStudents(resStudents.data);
      }

      if (resBranches.success && Array.isArray(resBranches.data)) {
        setBranches(resBranches.data);
      }

      if (resBatches.success && Array.isArray(resBatches.data)) {
        setBatches(resBatches.data);
      }

      if (resLanding.success && resLanding.data?.organization) {
        setOrganization(resLanding.data.organization);
      }
    } catch {
      toast.error("Failed to synchronize student directory with database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  useEffect(() => {
    if (searchParams.get("action") === "admit") {
      handleOpenAdmissionModal();
      const updated = new URLSearchParams(searchParams);
      updated.delete("action");
      setSearchParams(updated, { replace: true });
    }
  }, [searchParams]);

  const handleOpenAdmissionModal = () => {
    setShowPassword(false);
    setAdmissionForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      avatarUrl: "",
      branchId: isBranchAdmin ? userBranchId : selectedBranchId !== "ALL" ? selectedBranchId : branches[0]?.id || "",
      rollNumber: "",
      currentClass: "",
      institutionName: "",
      batchId: "",
      gender: Gender.MALE,
      dateOfBirth: "",
      bloodGroup: "",
      fatherName: "",
      motherName: "",
      guardianType: "FATHER",
      guardianName: "",
      guardianPhone: "",
      address: "",
    });
    setIsAdmissionModalOpen(true);
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionForm.fullName || !admissionForm.email || !admissionForm.phone) {
      toast.error("Please fill in required fields (Name, Email, Phone)");
      return;
    }
    if (!admissionForm.guardianName || !admissionForm.guardianPhone) {
      toast.error("Please provide guardian name and contact mobile number");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        fullName: admissionForm.fullName,
        email: admissionForm.email,
        phone: admissionForm.phone,
        password: admissionForm.password || undefined,
        avatarUrl: admissionForm.avatarUrl || undefined,
        branchId: isBranchAdmin ? userBranchId : admissionForm.branchId || branches[0]?.id,
        rollNumber: admissionForm.rollNumber || undefined,
        currentClass: admissionForm.currentClass || undefined,
        institutionName: admissionForm.institutionName || undefined,
        gender: admissionForm.gender,
        dateOfBirth: admissionForm.dateOfBirth ? new Date(admissionForm.dateOfBirth).toISOString() : undefined,
        bloodGroup: admissionForm.bloodGroup || undefined,
        fatherName: admissionForm.fatherName || undefined,
        motherName: admissionForm.motherName || undefined,
        guardianType: admissionForm.guardianType || "FATHER",
        guardianName: admissionForm.guardianName,
        guardianPhone: admissionForm.guardianPhone,
        address: admissionForm.address || undefined,
      };

      if (admissionForm.batchId) {
        payload.batchId = admissionForm.batchId;
      }

      const res = await apiClient.post<any>("/admin/students", payload);
      if (!res.success) throw new Error(res.message || "Failed to admit student");

      toast.success(
        res.data?.credentialsNote || `Student '${admissionForm.fullName}' admitted successfully!`
      );

      setIsAdmissionModalOpen(false);
      await fetchData();

      // If admitted, ask if admin wants to go directly to student profile
      if (res.data?.student?.id) {
        navigate(`/admin/students/${res.data.student.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to admit student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName || "",
      email: student.email || "",
      phone: student.phone || "",
      avatarUrl: student.avatarUrl || "",
      branchId: student.branch?.id || student.branchId || "",
      rollNumber: student.rollNumber || "",
      currentClass: student.currentClass || "",
      institutionName: student.institutionName || "",
      gender: student.gender || Gender.MALE,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      bloodGroup: student.bloodGroup || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      guardianType: student.guardianType || "FATHER",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      address: student.address || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsUpdating(true);
    try {
      const res = await apiClient.put<any>(`/admin/students/${editingStudent.id}`, editForm);
      if (res.success) {
        toast.success("Student profile updated successfully");
        setIsEditModalOpen(false);
        await fetchData();
      } else {
        toast.error(res.message || "Failed to update student profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update student profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = (student: any) => {
    toast(`Delete student account "${student.fullName}"?`, {
      description: "This will deactivate the student account and archive all batch enrollments.",
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          try {
            const res = await apiClient.delete<any>(`/admin/students/${student.id}`);
            if (res.success) {
              toast.success(`Account for '${student.fullName}' deleted successfully`);
              await fetchData();
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

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.rollNumber || "").toLowerCase().includes(q);

    const matchesBranch =
      isBranchAdmin ||
      selectedBranchId === "ALL" ||
      s.branch?.id === selectedBranchId ||
      s.branchId === selectedBranchId;

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      {/* ========================================== */}
      {/* STATUS OVERVIEW HEADER CARD */}
      {/* ========================================== */}
      <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-xs">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-text-main">
                Student Directory & Admissions
              </h2>
            </div>
            <p className="text-xs text-text-main/60">
              Manage student registrations, academic batch admissions, financial records, and official physical ID cards.
            </p>
          </div>

          {/* Operational Scope Badge */}
          <div className="flex items-center gap-2">
            {isBranchAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold rounded-xs tracking-wide">
                <Building2 className="w-3.5 h-3.5" />
                {currentUser?.branch?.name || "Assigned Branch"} (Branch Scoped)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-bold rounded-xs tracking-wide">
                <Crown className="w-3.5 h-3.5" />
                Universal (All Campuses)
              </span>
            )}

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-1.5 border border-theme text-text-main/70 hover:text-text-main rounded-sm hover:bg-bg-app transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Informative Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-theme">
          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Total Students</span>
            <span className="text-xl font-black text-text-main mt-0.5 block font-mono">
              {students.length}
            </span>
          </div>
          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Active Campuses</span>
            <span className="text-xl font-black text-brand-primary mt-0.5 block font-mono">
              {branches.length}
            </span>
          </div>
          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Academic Batches</span>
            <span className="text-xl font-black text-emerald-500 mt-0.5 block font-mono">
              {batches.length}
            </span>
          </div>
          <div className="p-3 bg-bg-app/50 border border-theme rounded-xs">
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Filtered Results</span>
            <span className="text-xl font-black text-amber-500 mt-0.5 block font-mono">
              {filteredStudents.length}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* CONTROL & FILTER BAR */}
      {/* ========================================== */}
      <div className="bg-surface border border-theme rounded-sm p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-text-main/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, roll number, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {isBranchAdmin ? (
            <div className="text-xs px-2.5 py-1.5 bg-bg-app border border-theme rounded-sm text-text-main/80 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-primary" />
              <span>{currentUser?.branch?.name || "My Branch"}</span>
              <Lock className="w-3 h-3 text-text-main/40" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-text-main/50" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="ALL">All Campuses</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleOpenAdmissionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Student Admission
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* STUDENTS DATA TABLE */}
      {/* ========================================== */}
      <div className="bg-surface border border-theme rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-app text-text-main/60 border-b border-theme uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">Roll Number</th>
                <th className="py-2.5 px-4">Campus / Branch</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Guardian Contact</th>
                <th className="py-2.5 px-4">Enrolled Batches</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-text-main/50">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-brand-primary" />
                    Loading live student admissions from database...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-text-main/50">
                    No student records found matching the current query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const enrollmentsList = s.enrollments || [];
                  const primaryBatch =
                    enrollmentsList.length > 0
                      ? enrollmentsList[0]?.batch?.name
                      : "General Batch";

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-bg-app/50 transition-colors group cursor-pointer"
                    >
                      {/* Student Name & Avatar */}
                      <td
                        className="py-3 px-4"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        <div className="flex items-center gap-2.5">
                          {s.avatarUrl ? (
                            <img
                              src={s.avatarUrl}
                              alt={s.fullName}
                              className="w-8 h-8 rounded-sm object-cover border border-theme shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-sm bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0 font-mono">
                              {s.fullName ? s.fullName.charAt(0).toUpperCase() : "S"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-text-main hover:text-brand-primary transition-colors">
                              {s.fullName}
                            </p>
                            <p className="text-[10px] text-text-main/50">
                              {s.currentClass ? `${s.currentClass} • ` : ""}
                              {s.institutionName || "Student"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td
                        className="py-3 px-4 font-mono font-bold text-text-main"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        <span className="px-2 py-0.5 bg-bg-app border border-theme rounded-xs text-[11px]">
                          {s.rollNumber || "PENDING"}
                        </span>
                      </td>

                      {/* Campus */}
                      <td
                        className="py-3 px-4"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        <span className="inline-flex items-center gap-1 text-text-main/80 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                          {s.branch?.name || "Main Campus"}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td
                        className="py-3 px-4 space-y-0.5 text-text-main/70"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-brand-primary" />
                          <span>{s.email}</span>
                        </div>
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <Phone className="w-3 h-3 text-text-main/40" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Guardian Contact */}
                      <td
                        className="py-3 px-4 text-text-main/70"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        <p className="font-medium text-text-main">{s.guardianName || "N/A"}</p>
                        <p className="text-[11px] font-mono text-text-main/50">{s.guardianPhone || "—"}</p>
                      </td>

                      {/* Enrolled Batches */}
                      <td
                        className="py-3 px-4"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        {enrollmentsList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {enrollmentsList.map((e: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-medium rounded-xs border border-brand-primary/20"
                              >
                                {e.batch?.name || "Batch"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-main/40 italic">Not enrolled</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xs">
                          ACTIVE
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/students/${s.id}/admit`}
                            className="p-1.5 text-text-main/60 hover:text-brand-primary hover:bg-bg-app border border-transparent hover:border-theme rounded-xs transition-colors"
                            title="Admit into Batch with Financial Records"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/admin/students/${s.id}`}
                            className="p-1.5 text-text-main/60 hover:text-brand-primary hover:bg-bg-app border border-transparent hover:border-theme rounded-xs transition-colors"
                            title="View Full Profile (Admin POV)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-text-main/60 hover:text-brand-primary hover:bg-bg-app border border-transparent hover:border-theme rounded-xs transition-colors"
                            title="Edit Student Information"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              setCardModalStudent({
                                id: s.id,
                                fullName: s.fullName,
                                rollNumber: s.rollNumber || "PENDING",
                                email: s.email,
                                phone: s.phone || "",
                                avatarUrl: s.avatarUrl,
                                bloodGroup: s.bloodGroup,
                                guardianName: s.guardianName || "",
                                guardianPhone: s.guardianPhone || "",
                                branchName: s.branch?.name || "",
                                batchName: primaryBatch,
                                academicYear: "2026-2027",
                              })
                            }
                            className="p-1.5 text-text-main/60 hover:text-brand-primary hover:bg-bg-app border border-transparent hover:border-theme rounded-xs transition-colors"
                            title="Generate Physical ID Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xs transition-colors"
                            title="Delete Student Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: COMPREHENSIVE NEW STUDENT ADMISSION */}
      {/* ========================================== */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-primary" /> Official Student Registration Form
                </h3>
                <p className="text-xs text-text-main/60">
                  Register new student profile with full personal, academic, and guardian records.
                </p>
              </div>
              <button
                onClick={() => setIsAdmissionModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Credential Note */}
            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xs flex items-start gap-2.5 text-xs text-text-main/80">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-brand-primary">Password & Credential Policy</p>
                <p className="text-[11px] mt-0.5 text-text-main/70">
                  Optionally specify a custom password below, or leave it blank to automatically configure the student's <strong>Email Address</strong> as their initial login password.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdmissionSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Student Photo / Passport Avatar</label>
                <FileUpload
                  folder="avatars"
                  value={admissionForm.avatarUrl}
                  onChange={(url) => setAdmissionForm({ ...admissionForm, avatarUrl: url })}
                  helperText="Upload official student photograph for physical ID cards and database"
                />
              </div>

              {/* 1. Personal Information */}
              <div className="border-t border-theme pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-main/50">
                  1. Basic Personal Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mahir Faysal"
                      value={admissionForm.fullName}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, fullName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Official Email (Username) *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.edu"
                      value={admissionForm.email}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+880 1..."
                      value={admissionForm.phone}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                      <span>Account Password</span>
                      <span className="text-[10px] text-text-main/50 font-normal">Optional (defaults to email)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank for email"
                        value={admissionForm.password}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, password: e.target.value })}
                        className="w-full px-3 py-1.5 pr-8 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-main/40 hover:text-text-main"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Gender</label>
                    <select
                      value={admissionForm.gender}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value as Gender })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value={Gender.MALE}>Male</option>
                      <option value={Gender.FEMALE}>Female</option>
                      <option value={Gender.OTHER}>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Date of Birth</label>
                    <input
                      type="date"
                      value={admissionForm.dateOfBirth}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Blood Group</label>
                    <select
                      value={admissionForm.bloodGroup}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, bloodGroup: e.target.value })}
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
              </div>

              {/* 2. Campus & Academic Information */}
              <div className="border-t border-theme pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-main/50">
                  2. Campus & Academic Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Campus / Branch *</label>
                    {isBranchAdmin ? (
                      <div className="w-full px-3 py-1.5 text-xs bg-bg-app/50 border border-theme rounded-sm text-text-main/80 flex items-center justify-between">
                        <span className="truncate">{currentUser?.branch?.name || "Assigned Branch"}</span>
                        <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-1 shrink-0">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      </div>
                    ) : (
                      <select
                        value={admissionForm.branchId}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, branchId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                      <span>Roll Number</span>
                      <span className="text-[10px] text-text-main/50 font-normal">Auto-generated if blank</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-DH-0105"
                      value={admissionForm.rollNumber}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, rollNumber: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Current Class / Level</label>
                    <input
                      type="text"
                      placeholder="e.g. Class 10, HSC 1st Year, Admission"
                      value={admissionForm.currentClass}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, currentClass: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">College / School Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. Notre Dame College"
                      value={admissionForm.institutionName}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, institutionName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                    <span>Initial Batch Enrollment</span>
                    <span className="text-[10px] text-text-main/50 font-normal">
                      Or admit later via dedicated Batch Admission page
                    </span>
                  </label>
                  <select
                    value={admissionForm.batchId}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, batchId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">No Batch Assignment Yet</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} {batch.course?.name ? `(${batch.course.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Parents & Guardian Details */}
              <div className="border-t border-theme pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-main/50">
                  3. Parents & Guardian Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Father's Name</label>
                    <input
                      type="text"
                      placeholder="Father full name"
                      value={admissionForm.fatherName}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, fatherName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Mother's Name</label>
                    <input
                      type="text"
                      placeholder="Mother full name"
                      value={admissionForm.motherName}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, motherName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Guardian Type</label>
                    <select
                      value={admissionForm.guardianType}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, guardianType: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="OTHER">Other Guardian</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Parent/Guardian Name"
                      value={admissionForm.guardianName}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, guardianName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Guardian Mobile *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+880 1..."
                      value={admissionForm.guardianPhone}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, guardianPhone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Residential Address</label>
                  <input
                    type="text"
                    placeholder="Street, area, city"
                    value={admissionForm.address}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, address: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Admitting Student..." : "Admit Student & Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EDIT STUDENT RECORD */}
      {/* ========================================== */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Edit className="w-4 h-4 text-brand-primary" /> Edit Student Record
                </h3>
                <p className="text-xs text-text-main/60">
                  Update student profile details, academic records, and parent information.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Profile Photo / Avatar</label>
                <FileUpload
                  folder="avatars"
                  value={editForm.avatarUrl || ""}
                  onChange={(url) => setEditForm({ ...editForm, avatarUrl: url })}
                  helperText="Upload official photograph"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Student Full Name *</label>
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
                    value={editForm.currentClass}
                    onChange={(e) => setEditForm({ ...editForm, currentClass: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Institution</label>
                  <input
                    type="text"
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
                  <label className="text-xs font-semibold text-text-main">Guardian Full Name *</label>
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
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PRINTABLE ID CARD MODAL */}
      {/* ========================================== */}
      {cardModalStudent && (
        <StudentIdCardModal
          isOpen={!!cardModalStudent}
          onClose={() => setCardModalStudent(null)}
          student={cardModalStudent}
          institutionName={organization?.name || ""}
          institutionTagline={organization?.tagline || ""}
          institutionPhone={organization?.phone || ""}
          institutionAddress={organization?.address || ""}
          institutionLogo={organization?.logoUrl || ""}
        />
      )}
    </div>
  );
};

export default StudentsManagement;
