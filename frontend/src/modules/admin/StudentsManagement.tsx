import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Gender, BranchRecord } from "../../types/index.js";
import { StudentIdCardModal, StudentIdCardData } from "../../components/StudentIdCardModal.js";

export const StudentsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cardModalStudent, setCardModalStudent] = useState<StudentIdCardData | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

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

  // Student Admission Form state
  const [admissionForm, setAdmissionForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    branchId: defaultBranchId,
    rollNumber: "",
    batchId: "",
    gender: Gender.MALE,
    guardianName: "",
    guardianPhone: "",
    address: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("cms_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const branchQuery =
        !isBranchAdmin && selectedBranchId !== "ALL" ? `?branchId=${selectedBranchId}` : "";

      const [resStudents, resBranches, resBatches, resLanding] = await Promise.all([
        fetch(`/api/v1/admin/students${branchQuery}`, { headers }),
        fetch("/api/v1/admin/branches", { headers }),
        fetch("/api/v1/academics/batches", { headers }),
        fetch("/api/v1/public/landing"),
      ]);

      const [dataStud, dataBr, dataBat, dataLand] = await Promise.all([
        resStudents.json(),
        resBranches.json(),
        resBatches.json(),
        resLanding.json(),
      ]);

      if (dataStud.success && dataStud.data?.items) {
        setStudents(dataStud.data.items);
      } else if (dataStud.success && Array.isArray(dataStud.data)) {
        setStudents(dataStud.data);
      }

      if (dataBr.success && Array.isArray(dataBr.data)) {
        setBranches(dataBr.data);
      }

      if (dataBat.success && Array.isArray(dataBat.data)) {
        setBatches(dataBat.data);
      }

      if (dataLand.success && dataLand.data?.organization) {
        setOrganization(dataLand.data.organization);
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

  const handleOpenAdmissionModal = () => {
    setShowPassword(false);
    setAdmissionForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      branchId: isBranchAdmin ? userBranchId : branches[0]?.id || "",
      rollNumber: "",
      batchId: "",
      gender: Gender.MALE,
      guardianName: "",
      guardianPhone: "",
      address: "",
    });
    setIsModalOpen(true);
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionForm.fullName || !admissionForm.email || !admissionForm.phone) {
      toast.error("Please fill in required fields (Name, Email, Phone)");
      return;
    }

    const token = localStorage.getItem("cms_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setIsSubmitting(true);
    try {
      const payload: any = {
        fullName: admissionForm.fullName,
        email: admissionForm.email,
        phone: admissionForm.phone,
        password: admissionForm.password || undefined,
        branchId: isBranchAdmin ? userBranchId : admissionForm.branchId || branches[0]?.id,
        rollNumber: admissionForm.rollNumber || undefined,
        gender: admissionForm.gender,
        guardianName: admissionForm.guardianName,
        guardianPhone: admissionForm.guardianPhone,
        address: admissionForm.address,
      };

      if (admissionForm.batchId) {
        payload.batchId = admissionForm.batchId;
      }

      const res = await fetch("/api/v1/admin/students", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to admit student");

      toast.success(
        json.data?.credentialsNote ||
          `Student '${admissionForm.fullName}' admitted successfully!`
      );

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to admit student");
    } finally {
      setIsSubmitting(false);
    }
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
              Manage student registrations, live batch enrollments, credentials provisioning, and official ID cards.
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
            <span className="text-[10px] uppercase font-bold text-text-main/50 block">Matching Filter</span>
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
                <th className="py-2.5 px-4">Roll Number</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Contact Info</th>
                <th className="py-2.5 px-4">Campus</th>
                <th className="py-2.5 px-4">Enrolled Batch(es)</th>
                <th className="py-2.5 px-4">Guardian Contact</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Physical ID Card</th>
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
                    <tr key={s.id} className="hover:bg-bg-app/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-text-main">
                        <span className="px-2 py-0.5 bg-bg-app border border-theme rounded-xs text-[11px]">
                          {s.rollNumber || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-main">{s.fullName}</p>
                        <p className="text-[10px] text-text-main/40 font-mono">
                          ID: {s.id.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="py-3 px-4 space-y-0.5 text-text-main/70">
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
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-text-main/80 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                          {s.branch?.name || "Main Campus"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                          <span className="text-[11px] text-text-main/40 italic">Not enrolled in batch</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-main/70">
                        <p className="font-medium text-text-main">{s.guardianName || "N/A"}</p>
                        <p className="text-[11px] font-mono text-text-main/50">{s.guardianPhone || "—"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xs">
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setCardModalStudent({
                              id: s.id,
                              fullName: s.fullName,
                              rollNumber: s.rollNumber || "PENDING",
                              email: s.email,
                              phone: s.phone || "",
                              guardianName: s.guardianName || "",
                              guardianPhone: s.guardianPhone || "",
                              branchName: s.branch?.name || "",
                              batchName: primaryBatch,
                              academicYear: "2026-2027",
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-bg-app hover:bg-brand-primary hover:text-white border border-theme rounded-sm transition-colors cursor-pointer"
                          title="Generate / Print Official Physical ID Card"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> ID Card
                        </button>
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
      {/* MODAL: ADMISSION / ENROLLMENT */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-primary" /> Official Student Admission Form
                </h3>
                <p className="text-xs text-text-main/60">
                  Admit a student to coaching database with roll assignment and credential provisioning.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Password Policy Banner */}
            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xs flex items-start gap-2.5 text-xs text-text-main/80">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-brand-primary">Password & Credential Policy</p>
                <p className="text-[11px] mt-0.5 text-text-main/70">
                  You can specify a custom password below, or leave it blank to automatically configure the student's <strong>Email Address</strong> as their initial login password.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdmissionSubmit} className="space-y-3">
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
                  <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                    <span>Account Password</span>
                    <span className="text-[10px] text-text-main/50 font-normal">Optional</span>
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
              </div>

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
                  <label className="text-xs font-semibold text-text-main">Initial Batch Enrollment</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                    <span>Roll Number</span>
                    <span className="text-[10px] text-text-main/50 font-normal">Auto-generated if empty</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-DH-0105"
                    value={admissionForm.rollNumber}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, rollNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-theme">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Parent or guardian full name"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Admitting Student..." : "Admit Student & Provision Account"}
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
