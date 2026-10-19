import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Building2,
  BookOpen,
  GraduationCap,
  Briefcase,
  X,
  Edit2,
  Search,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../components/common/FileUpload.js";
import type { TeacherRecord, StaffRecord, BranchRecord } from "../../types/index.js";

export const TeachersManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"TEACHERS" | "STAFF">("TEACHERS");
  const [isLoading, setIsLoading] = useState(true);

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

  // Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);

  // Password visibility
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Branches
  const [branches, setBranches] = useState<BranchRecord[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isBranchAdmin ? userBranchId : "ALL"
  );

  // Faculty State - empty initial state, loaded dynamically
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);

  // Staff State - empty initial state, loaded dynamically
  const [staffs, setStaffs] = useState<StaffRecord[]>([]);

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    branchId: "",
    qualification: "",
    specialization: "",
    bio: "",
    avatarUrl: "",
    isActive: true,
  });

  const [staffForm, setStaffForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "STAFF" as "STAFF" | "BRANCH_ADMIN",
    branchId: "",
    designation: "",
    department: "Administration",
    avatarUrl: "",
    isActive: true,
  });

  // Fetch live teachers, staff, and branches
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("cms_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const branchQuery =
        !isBranchAdmin && selectedBranchId !== "ALL" ? `?branchId=${selectedBranchId}` : "";

      const [resT, resS, resB] = await Promise.all([
        fetch(`/api/v1/admin/teachers${branchQuery}`, { headers }),
        fetch(`/api/v1/admin/staffs${branchQuery}`, { headers }),
        fetch("/api/v1/admin/branches", { headers }),
      ]);

      const [dataT, dataS, dataB] = await Promise.all([resT.json(), resS.json(), resB.json()]);

      if (dataT.success && Array.isArray(dataT.data)) setTeachers(dataT.data);
      if (dataS.success && Array.isArray(dataS.data)) setStaffs(dataS.data);
      if (dataB.success && Array.isArray(dataB.data)) setBranches(dataB.data);
    } catch {
      toast.error("Failed to synchronize faculty and staff records from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const defaultBranchId = isBranchAdmin
    ? userBranchId
    : selectedBranchId !== "ALL"
    ? selectedBranchId
    : branches[0]?.id || "";

  // ==========================================
  // TEACHER HANDLERS
  // ==========================================
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setShowTeacherPassword(false);
    setTeacherForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      branchId: defaultBranchId,
      qualification: "",
      specialization: "",
      bio: "",
      avatarUrl: "",
      isActive: true,
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: TeacherRecord) => {
    setEditingTeacher(teacher);
    setShowTeacherPassword(false);
    setTeacherForm({
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      password: "",
      branchId: teacher.branch?.id || defaultBranchId,
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      bio: teacher.bio || "",
      avatarUrl: teacher.avatarUrl || "",
      isActive: teacher.isActive,
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.fullName || !teacherForm.phone || !teacherForm.specialization) {
      toast.error("Please fill in required fields (Name, Phone, Specialization)");
      return;
    }

    const token = localStorage.getItem("cms_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      if (editingTeacher) {
        // Update teacher
        const res = await fetch(`/api/v1/admin/teachers/${editingTeacher.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            fullName: teacherForm.fullName,
            phone: teacherForm.phone,
            branchId: isBranchAdmin ? userBranchId : teacherForm.branchId || undefined,
            qualification: teacherForm.qualification,
            specialization: teacherForm.specialization,
            bio: teacherForm.bio,
            avatarUrl: teacherForm.avatarUrl,
            isActive: teacherForm.isActive,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to update teacher");

        toast.success(`Faculty '${teacherForm.fullName}' profile updated successfully`);
      } else {
        // Create teacher
        if (!teacherForm.email) {
          toast.error("Email address is required for account creation");
          return;
        }

        const res = await fetch("/api/v1/admin/teachers", {
          method: "POST",
          headers,
          body: JSON.stringify({
            fullName: teacherForm.fullName,
            email: teacherForm.email,
            phone: teacherForm.phone,
            password: teacherForm.password || undefined,
            branchId: isBranchAdmin ? userBranchId : teacherForm.branchId || branches[0]?.id,
            qualification: teacherForm.qualification,
            specialization: teacherForm.specialization,
            bio: teacherForm.bio,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to admit faculty");

        toast.success(
          json.data?.credentialsNote ||
            `Faculty '${teacherForm.fullName}' admitted successfully!`
        );
      }

      setIsTeacherModalOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save faculty record");
    }
  };

  // ==========================================
  // STAFF HANDLERS
  // ==========================================
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setShowStaffPassword(false);
    setStaffForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "STAFF",
      branchId: defaultBranchId,
      designation: "",
      department: "Administration",
      avatarUrl: "",
      isActive: true,
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffRecord) => {
    setEditingStaff(staff);
    setShowStaffPassword(false);
    setStaffForm({
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      password: "",
      role: staff.role === "BRANCH_ADMIN" ? "BRANCH_ADMIN" : "STAFF",
      branchId: staff.branch?.id || defaultBranchId,
      designation: staff.designation || "",
      department: staff.department || "",
      avatarUrl: "",
      isActive: staff.isActive,
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.fullName || !staffForm.phone || !staffForm.designation) {
      toast.error("Please fill in required fields (Name, Phone, Designation)");
      return;
    }

    const token = localStorage.getItem("cms_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      if (editingStaff) {
        // Update staff
        const res = await fetch(`/api/v1/admin/staffs/${editingStaff.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            fullName: staffForm.fullName,
            phone: staffForm.phone,
            branchId: isBranchAdmin ? userBranchId : staffForm.branchId || undefined,
            role: staffForm.role,
            designation: staffForm.designation,
            department: staffForm.department,
            avatarUrl: staffForm.avatarUrl,
            isActive: staffForm.isActive,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to update staff member");

        toast.success(`Staff member '${staffForm.fullName}' updated successfully`);
      } else {
        // Create staff
        if (!staffForm.email) {
          toast.error("Email address is required for account creation");
          return;
        }

        const res = await fetch("/api/v1/admin/staffs", {
          method: "POST",
          headers,
          body: JSON.stringify({
            fullName: staffForm.fullName,
            email: staffForm.email,
            phone: staffForm.phone,
            password: staffForm.password || undefined,
            role: staffForm.role,
            branchId: isBranchAdmin ? userBranchId : staffForm.branchId || branches[0]?.id,
            designation: staffForm.designation,
            department: staffForm.department,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to register staff member");

        toast.success(
          json.data?.credentialsNote ||
            `Staff member '${staffForm.fullName}' registered successfully!`
        );
      }

      setIsStaffModalOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save staff record");
    }
  };

  // Filtered lists
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.specialization && t.specialization.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBranch =
      selectedBranchId === "ALL" || t.branch?.id === selectedBranchId;

    return matchesSearch && matchesBranch;
  });

  const filteredStaffs = staffs.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.designation && s.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBranch =
      selectedBranchId === "ALL" || s.branch?.id === selectedBranchId;

    return matchesSearch && matchesBranch;
  });

  const branchAdminsCount = staffs.filter((s) => s.role === "BRANCH_ADMIN").length;
  const regularStaffCount = staffs.filter((s) => s.role !== "BRANCH_ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Meaningful Status Header Card (Matching Student Portal standard) */}
      <div className="bg-surface border border-theme rounded-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary">
              Human Resources & Campus Operations
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xs">
              {isBranchAdmin
                ? `Campus Scope: ${currentUser?.branch?.name || "Assigned Branch"}`
                : "Universal Scope: All Campuses"}
            </span>
          </div>

          <h1 className="text-lg font-bold text-text-main flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-primary" /> Faculty & Staff Administration
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-main/60 pt-0.5">
            <span>
              Total Faculty: <strong className="text-text-main">{teachers.length}</strong>
            </span>
            <span>•</span>
            <span>
              Operational Staff: <strong className="text-text-main">{regularStaffCount}</strong>
            </span>
            <span>•</span>
            <span>
              Branch Admins: <strong className="text-amber-600 dark:text-amber-400">{branchAdminsCount}</strong>
            </span>
            <span>•</span>
            <span>
              Active Campuses: <strong className="text-text-main">{branches.length}</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {activeTab === "TEACHERS" ? (
            <button
              onClick={handleOpenAddTeacher}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> Admit Faculty Member
            </button>
          ) : (
            <button
              onClick={handleOpenAddStaff}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> Register Staff / Branch Admin
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Tabs, Search, and Branch Filtering */}
      <div className="bg-surface border border-theme rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-theme pb-3">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-bg-app p-1 rounded-sm border border-theme w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("TEACHERS")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xs transition-all ${
                activeTab === "TEACHERS"
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-text-main/70 hover:text-text-main"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Faculty / Teachers ({teachers.length})
            </button>
            <button
              onClick={() => setActiveTab("STAFF")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xs transition-all ${
                activeTab === "STAFF"
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-text-main/70 hover:text-text-main"
              }`}
            >
              <Briefcase className="w-4 h-4" /> Staff & Branch Admins ({staffs.length})
            </button>
          </div>

          {/* Branch Filter (Only for Super Admin) */}
          {!isBranchAdmin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-text-main/50 shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full sm:w-56 px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
              >
                <option value="ALL">All Campuses (Universal)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-main/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === "TEACHERS"
                ? "Search faculty by name, email, phone, specialization..."
                : "Search staff by name, email, designation, department..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-surface border border-theme rounded-sm p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-sm shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-32 bg-accent rounded-xs" />
                  <div className="h-3 w-24 bg-accent/60 rounded-xs" />
                </div>
              </div>
              <div className="h-3 w-full bg-accent/40 rounded-xs" />
              <div className="h-3 w-3/4 bg-accent/40 rounded-xs" />
              <div className="pt-2 border-t border-theme flex justify-between">
                <div className="h-3 w-20 bg-accent/50 rounded-xs" />
                <div className="h-3 w-16 bg-accent/50 rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "TEACHERS" ? (
        /* Faculty Cards Grid */
        filteredTeachers.length === 0 ? (
          <div className="bg-surface border border-theme rounded-sm p-12 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-text-main/30 mx-auto" />
            <h3 className="text-sm font-bold text-text-main">No Faculty Members Found</h3>
            <p className="text-xs text-text-main/60 max-w-sm mx-auto">
              {searchTerm || selectedBranchId !== "ALL"
                ? "No instructors match your current search or branch filters."
                : "No faculty members have been registered in the system yet."}
            </p>
            <button
              onClick={handleOpenAddTeacher}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> Admit First Faculty Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((t) => (
              <div
                key={t.id}
                className="bg-surface border border-theme rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.avatarUrl ? (
                        <img
                          src={t.avatarUrl}
                          alt={t.fullName}
                          className="w-10 h-10 object-cover rounded-sm border border-theme shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-brand-primary text-white font-bold rounded-sm flex items-center justify-center text-xs shrink-0">
                          {t.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-text-main truncate" title={t.fullName}>
                          {t.fullName}
                        </h3>
                        <p className="text-[11px] font-semibold text-brand-primary truncate">
                          {t.specialization || "General Faculty"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs shrink-0 ${
                        t.isActive
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border border-red-500/20"
                      }`}
                    >
                      {t.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-text-main/70 pt-1 border-t border-theme">
                    {t.qualification && (
                      <p className="text-[11px] font-medium text-text-main line-clamp-1" title={t.qualification}>
                        🎓 {t.qualification}
                      </p>
                    )}
                    {t.bio && <p className="text-[11px] text-text-main/60 line-clamp-2">{t.bio}</p>}
                    <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">{t.branch?.name || "All Campuses"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate font-mono">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="font-mono">{t.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-theme flex justify-between items-center text-xs">
                  <span className="text-[11px] text-text-main/60 flex items-center gap-1 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-brand-primary" /> {t.batches?.length || 0} Batches
                  </span>

                  <button
                    onClick={() => handleOpenEditTeacher(t)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 rounded-sm transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Staff & Branch Admins Grid */
        filteredStaffs.length === 0 ? (
          <div className="bg-surface border border-theme rounded-sm p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-text-main/30 mx-auto" />
            <h3 className="text-sm font-bold text-text-main">No Staff Members Found</h3>
            <p className="text-xs text-text-main/60 max-w-sm mx-auto">
              {searchTerm || selectedBranchId !== "ALL"
                ? "No administrative staff match your current search or branch filters."
                : "No operational staff or branch administrators have been registered yet."}
            </p>
            <button
              onClick={handleOpenAddStaff}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> Register Staff Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaffs.map((s) => {
              const isOfficerAdmin = s.role === "BRANCH_ADMIN";
              return (
                <div
                  key={s.id}
                  className={`bg-surface border rounded-sm p-5 shadow-xs flex flex-col justify-between transition-colors ${
                    isOfficerAdmin
                      ? "border-amber-500/40 hover:border-amber-500"
                      : "border-theme hover:border-brand-primary/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 font-bold rounded-sm flex items-center justify-center text-xs shrink-0 ${
                            isOfficerAdmin
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              : "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                          }`}
                        >
                          {isOfficerAdmin ? (
                            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            s.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-text-main truncate" title={s.fullName}>
                            {s.fullName}
                          </h3>
                          <p className="text-[11px] font-semibold text-text-main/70 truncate">
                            {s.designation || "Staff Officer"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs tracking-wider uppercase ${
                            isOfficerAdmin
                              ? "bg-amber-500 text-white font-black shadow-xs"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {isOfficerAdmin ? "Branch Admin" : "Staff"}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1 py-0.2 rounded-xs ${
                            s.isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-text-main/70 pt-1 border-t border-theme">
                      {s.department && (
                        <p className="text-[11px] font-medium text-text-main line-clamp-1">
                          Dept: <strong>{s.department}</strong>
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="truncate">{s.branch?.name || "Assigned Campus"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="truncate font-mono">{s.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="font-mono">{s.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-theme flex justify-end items-center text-xs">
                    <button
                      onClick={() => handleOpenEditStaff(s)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 rounded-sm transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Staff Record
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT FACULTY */}
      {/* ========================================== */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-primary" />
                {editingTeacher ? "Edit Faculty Member" : "Admit Faculty Member"}
              </h3>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rafiqul Islam"
                    value={teacherForm.fullName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1..."
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {!editingTeacher && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Official Email (Username) *</label>
                    <input
                      type="email"
                      required
                      placeholder="teacher@institution.edu"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                      <span>Account Password</span>
                      <span className="text-[10px] text-text-main/50 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showTeacherPassword ? "text" : "password"}
                        placeholder="Leave blank for email"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        className="w-full px-3 py-1.5 pr-8 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-main/40 hover:text-text-main"
                      >
                        {showTeacherPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Primary Campus</label>
                  {isBranchAdmin ? (
                    <div className="w-full px-3 py-1.5 text-xs bg-bg-app/50 border border-theme rounded-sm text-text-main/80 flex items-center justify-between">
                      <span className="truncate">{currentUser?.branch?.name || "Assigned Branch"}</span>
                      <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    </div>
                  ) : (
                    <select
                      value={teacherForm.branchId}
                      onChange={(e) => setTeacherForm({ ...teacherForm, branchId: e.target.value })}
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
                  <label className="text-xs font-semibold text-text-main">Specialization / Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Higher Math, Chemistry"
                    value={teacherForm.specialization}
                    onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Academic Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. M.Sc in Organic Chemistry, DU"
                  value={teacherForm.qualification}
                  onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Professional Bio</label>
                <textarea
                  rows={2}
                  placeholder="Teaching background, years of experience, mentor track record..."
                  value={teacherForm.bio}
                  onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                ></textarea>
              </div>

              <FileUpload
                label="Profile Photo"
                folder="avatars"
                value={teacherForm.avatarUrl}
                onChange={(url) => setTeacherForm({ ...teacherForm, avatarUrl: url })}
                helperText="Upload teacher portrait photo."
              />

              {editingTeacher && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="teacherActive"
                    checked={teacherForm.isActive}
                    onChange={(e) => setTeacherForm({ ...teacherForm, isActive: e.target.checked })}
                    className="rounded-xs"
                  />
                  <label htmlFor="teacherActive" className="text-xs font-semibold text-text-main cursor-pointer">
                    Account Active & Visible to Batches
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  {editingTeacher ? "Save Faculty Changes" : "Admit Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT STAFF */}
      {/* ========================================== */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-primary" />
                {editingStaff ? "Edit Staff Member" : "Register Operational Staff"}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Operational Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, role: "STAFF" })}
                    className={`p-2.5 border rounded-sm text-left transition-all ${
                      staffForm.role === "STAFF"
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                        : "border-theme bg-bg-app text-text-main/70 hover:border-theme/80"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Briefcase className="w-3.5 h-3.5" />
                      Staff Member
                    </div>
                    <p className="text-[10px] mt-0.5 opacity-80">
                      General operations, admissions, accounts
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, role: "BRANCH_ADMIN" })}
                    className={`p-2.5 border rounded-sm text-left transition-all ${
                      staffForm.role === "BRANCH_ADMIN"
                        ? "border-amber-500 bg-amber-500/5 text-amber-500"
                        : "border-theme bg-bg-app text-text-main/70 hover:border-theme/80"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Branch Admin
                    </div>
                    <p className="text-[10px] mt-0.5 opacity-80">
                      Administrative control over branch
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamrul Islam"
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1..."
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {!editingStaff && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="staff@institution.edu"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                      <span>Account Password</span>
                      <span className="text-[10px] text-text-main/50 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showStaffPassword ? "text" : "password"}
                        placeholder="Leave blank for email"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        className="w-full px-3 py-1.5 pr-8 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-main/40 hover:text-text-main"
                      >
                        {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Assigned Campus</label>
                  {isBranchAdmin ? (
                    <div className="w-full px-3 py-1.5 text-xs bg-bg-app/50 border border-theme rounded-sm text-text-main/80 flex items-center justify-between">
                      <span className="truncate">{currentUser?.branch?.name || "Assigned Branch"}</span>
                      <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    </div>
                  ) : (
                    <select
                      value={staffForm.branchId}
                      onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
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
                  <label className="text-xs font-semibold text-text-main">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Admission Officer"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Student Affairs, Finance & Accounts"
                  value={staffForm.department}
                  onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              {editingStaff && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="staffActive"
                    checked={staffForm.isActive}
                    onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                    className="rounded-xs"
                  />
                  <label htmlFor="staffActive" className="text-xs font-semibold text-text-main cursor-pointer">
                    Staff Member Active
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  {editingStaff ? "Save Staff Changes" : "Register Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
