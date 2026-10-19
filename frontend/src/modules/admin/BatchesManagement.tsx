import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Plus,
  Users,
  Clock,
  GraduationCap,
  Edit2,
  Trash2,
  X,
  UserCheck,
  Search,
  DoorOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  BatchFeeType,
  ClassCategory,
  type BranchRecord,
  type TeacherRecord,
  type AcademicClassRecord,
  type PendingEnrollmentRecord,
} from "../../types/index.js";

interface CourseItem {
  id: string;
  name: string;
  code: string;
  feeAmount: number | string;
  durationWeeks: number;
}

interface BatchRecordItem {
  id: string;
  name: string;
  title?: string | null;
  coverImage?: string | null;
  classroom?: string | null;
  classTime?: string | null;
  scheduleTime?: string | null;
  startDate: string;
  endDate?: string | null;
  seatLimit: number;
  maxCapacity: number;
  enrolledCount: number;
  availableSeats: number;
  isHouseFull: boolean;
  totalClasses: number;
  totalExams: number;
  classesPerWeek: number;
  daysOfWeek: string[];
  feeAmount: number;
  feeType: BatchFeeType;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  course?: { id: string; name: string; code: string; feeAmount: number | string } | null;
  academicClass?: { id: string; name: string; code: string; category?: string } | null;
  branch: { id: string; name: string; code: string };
  teacher?: { id: string; fullName: string; email: string; phone?: string; avatarUrl?: string | null } | null;
  examsCount?: number;
  materialsCount?: number;
}

interface RosterStudent {
  enrollmentId: string;
  studentId: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string;
  guardianName?: string;
  guardianPhone?: string;
  status: string;
  enrolledAt: string;
}

export const BatchesManagement: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"batches" | "admissions" | "classes" | "courses">("batches");

  // Data states
  const [batches, setBatches] = useState<BatchRecordItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassRecord[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Filters
  const [selectedBranch, setSelectedBranch] = useState(isBranchAdmin ? userBranchId : "ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRecordItem | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Verification prompt modal
  const [verifyModalItem, setVerifyModalItem] = useState<{
    item: PendingEnrollmentRecord;
    action: "APPROVE" | "REJECT_REFUND";
  } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Roster Drawer
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [activeBatchForRoster, setActiveBatchForRoster] = useState<BatchRecordItem | null>(null);
  const [rosterList, setRosterList] = useState<RosterStudent[]>([]);
  const [enrollRollNumber, setEnrollRollNumber] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Batch Form
  const [batchForm, setBatchForm] = useState({
    name: "",
    title: "",
    academicClassId: "",
    courseId: "",
    branchId: "",
    teacherId: "",
    classroom: "Room 101",
    classTime: "Fri, Sun, Tue (9:00 AM - 11:30 AM)",
    scheduleTime: "Fri, Sun, Tue (9:00 AM - 11:30 AM)",
    seatLimit: 40,
    totalClasses: 36,
    totalExams: 12,
    classesPerWeek: 3,
    daysOfWeek: ["Sunday", "Tuesday", "Thursday"],
    feeAmount: 6000,
    feeType: BatchFeeType.ONE_TIME,
    coverImage: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "UPCOMING",
    isPublic: true,
  });

  // Academic Class Form
  const [classForm, setClassForm] = useState({
    name: "",
    code: "",
    academicYear: "2026",
    category: ClassCategory.COLLEGE,
    displayOrder: 1,
  });

  // Course Form
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    durationWeeks: 24,
    feeAmount: 12000,
    branchId: "",
    description: "",
  });

  const getHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("cms_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const [resB, resC, resBr, resT, resCl, resP] = await Promise.all([
        fetch("/api/v1/academics/batches", { headers }),
        fetch("/api/v1/academics/courses", { headers }),
        fetch("/api/v1/admin/branches", { headers }),
        fetch("/api/v1/admin/teachers", { headers }),
        fetch("/api/v1/academics/classes", { headers }),
        fetch("/api/v1/academics/enrollments/pending", { headers }),
      ]);

      const [dataB, dataC, dataBr, dataT, dataCl, dataP] = await Promise.all([
        resB.json(),
        resC.json(),
        resBr.json(),
        resT.json(),
        resCl.json(),
        resP.json(),
      ]);

      if (dataB.success && Array.isArray(dataB.data)) setBatches(dataB.data);
      if (dataC.success && Array.isArray(dataC.data)) setCourses(dataC.data);
      if (dataBr.success && Array.isArray(dataBr.data)) {
        setBranches(dataBr.data);
        if (dataBr.data.length > 0 && !batchForm.branchId) {
          const defaultBranchId = isBranchAdmin && userBranchId ? userBranchId : dataBr.data[0].id;
          setBatchForm((prev) => ({ ...prev, branchId: defaultBranchId }));
          setCourseForm((prev) => ({ ...prev, branchId: defaultBranchId }));
        }
      }
      if (dataT.success && Array.isArray(dataT.data)) setTeachers(dataT.data);
      if (dataCl.success && Array.isArray(dataCl.data)) {
        setAcademicClasses(dataCl.data);
        if (dataCl.data.length > 0 && !batchForm.academicClassId) {
          setBatchForm((prev) => ({ ...prev, academicClassId: dataCl.data[0].id }));
        }
      }
      if (dataP.success && Array.isArray(dataP.data)) setPendingEnrollments(dataP.data);
    } catch (err) {
      console.warn("Could not retrieve all academic resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    const matchesBranch = selectedBranch === "ALL" || b.branch?.id === selectedBranch;
    const matchesClass = selectedClass === "ALL" || b.academicClass?.id === selectedClass;
    const matchesStatus = selectedStatus === "ALL" || b.status === selectedStatus;
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.title && b.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.academicClass && b.academicClass.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.classroom && b.classroom.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBranch && matchesClass && matchesStatus && matchesSearch;
  });

  // ==========================================
  // BATCH MODAL HANDLERS
  // ==========================================
  const handleOpenCreateBatch = () => {
    setEditingBatch(null);
    setBatchForm({
      name: "",
      title: "",
      academicClassId: academicClasses[0]?.id || "",
      courseId: courses[0]?.id || "",
      branchId: isBranchAdmin && userBranchId ? userBranchId : (branches[0]?.id || ""),
      teacherId: "",
      classroom: "Room 101",
      classTime: "Fri, Sun, Tue (9:00 AM - 11:30 AM)",
      scheduleTime: "Fri, Sun, Tue (9:00 AM - 11:30 AM)",
      seatLimit: 40,
      totalClasses: 36,
      totalExams: 12,
      classesPerWeek: 3,
      daysOfWeek: ["Sunday", "Tuesday", "Thursday"],
      feeAmount: 6000,
      feeType: BatchFeeType.ONE_TIME,
      coverImage: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      status: "UPCOMING",
      isPublic: true,
    });
    setIsBatchModalOpen(true);
  };

  const handleOpenEditBatch = (batch: BatchRecordItem) => {
    setEditingBatch(batch);
    setBatchForm({
      name: batch.name,
      title: batch.title || "",
      academicClassId: batch.academicClass?.id || "",
      courseId: batch.course?.id || "",
      branchId: batch.branch.id,
      teacherId: batch.teacher?.id || "",
      classroom: batch.classroom || "Room 101",
      classTime: batch.classTime || batch.scheduleTime || "",
      scheduleTime: batch.scheduleTime || batch.classTime || "",
      seatLimit: batch.seatLimit || batch.maxCapacity || 40,
      totalClasses: batch.totalClasses || 36,
      totalExams: batch.totalExams || 12,
      classesPerWeek: batch.classesPerWeek || 3,
      daysOfWeek: batch.daysOfWeek || ["Sunday", "Tuesday", "Thursday"],
      feeAmount: Number(batch.feeAmount || 6000),
      feeType: batch.feeType || BatchFeeType.ONE_TIME,
      coverImage: batch.coverImage || "",
      startDate: batch.startDate.split("T")[0],
      endDate: batch.endDate ? batch.endDate.split("T")[0] : "",
      status: batch.status,
      isPublic: true,
    });
    setIsBatchModalOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.name.trim()) {
      toast.error("Batch internal name is required");
      return;
    }

    try {
      const headers = getHeaders();
      const payload: any = {
        name: batchForm.name.trim(),
        title: batchForm.title.trim() || batchForm.name.trim(),
        academicClassId: batchForm.academicClassId || undefined,
        courseId: batchForm.courseId || undefined,
        branchId: isBranchAdmin && userBranchId ? userBranchId : batchForm.branchId,
        teacherId: batchForm.teacherId || null,
        classroom: batchForm.classroom || null,
        classTime: batchForm.classTime || batchForm.scheduleTime,
        scheduleTime: batchForm.scheduleTime || batchForm.classTime,
        seatLimit: Number(batchForm.seatLimit),
        maxCapacity: Number(batchForm.seatLimit),
        totalClasses: Number(batchForm.totalClasses),
        totalExams: Number(batchForm.totalExams),
        classesPerWeek: Number(batchForm.classesPerWeek),
        daysOfWeek: batchForm.daysOfWeek,
        feeAmount: Number(batchForm.feeAmount),
        feeType: batchForm.feeType,
        coverImage: batchForm.coverImage.trim() || undefined,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate ? batchForm.endDate : null,
        status: batchForm.status,
        isPublic: batchForm.isPublic,
      };

      const url = editingBatch
        ? `/api/v1/academics/batches/${editingBatch.id}`
        : "/api/v1/academics/batches";
      const method = editingBatch ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to schedule batch");

      toast.success(editingBatch ? "Batch details updated successfully" : "New batch scheduled!");
      setIsBatchModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to cancel / remove this offline batch?")) return;
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batchId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete batch");
      toast.success("Batch removed / cancelled successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ==========================================
  // ADMISSION VERIFICATION DESK HANDLERS
  // ==========================================
  const handleOpenVerifyModal = (item: PendingEnrollmentRecord, action: "APPROVE" | "REJECT_REFUND") => {
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
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/enrollments/${verifyModalItem.item.id}/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: verifyModalItem.action,
          adminNotes: verifyNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Verification action failed");
      }

      if (verifyModalItem.action === "APPROVE") {
        toast.success("Admission Verified & Seat Locked!", {
          description: `Confirmed seat for ${verifyModalItem.item.studentName}. Verified invoice & receipt generated.`,
        });
      } else {
        toast.info("Application Rejected / Refund Scheduled", {
          description: `Applicant ${verifyModalItem.item.studentName} marked for fee return.`,
        });
      }

      setVerifyModalItem(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to process admission verification");
    } finally {
      setIsVerifying(false);
    }
  };

  // ==========================================
  // ACADEMIC CLASSES HANDLERS
  // ==========================================
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.code.trim()) {
      toast.error("Class name and code are required");
      return;
    }

    try {
      const headers = getHeaders();
      const res = await fetch("/api/v1/academics/classes", {
        method: "POST",
        headers,
        body: JSON.stringify(classForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create academic class");

      toast.success(`Academic class '${json.data.name}' created!`);
      setIsClassModalOpen(false);
      setClassForm({
        name: "",
        code: "",
        academicYear: "2026",
        category: ClassCategory.COLLEGE,
        displayOrder: 1,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm("Remove this academic class? Existing batches under it will lose their category tag.")) return;
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/classes/${classId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete class");
      toast.success("Academic class deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ==========================================
  // COURSE HANDLERS
  // ==========================================
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name || !courseForm.code) {
      toast.error("Please fill in course name and code");
      return;
    }

    try {
      const headers = getHeaders();
      const res = await fetch("/api/v1/academics/courses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: courseForm.name,
          code: courseForm.code.toUpperCase(),
          durationWeeks: Number(courseForm.durationWeeks),
          feeAmount: Number(courseForm.feeAmount),
          branchId: isBranchAdmin && userBranchId ? userBranchId : (courseForm.branchId || branches[0]?.id),
          description: courseForm.description,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to save course");

      toast.success(`Course ${json.data.name} created!`);
      setIsCourseModalOpen(false);
      setCourseForm({
        name: "",
        code: "",
        durationWeeks: 24,
        feeAmount: 12000,
        branchId: branches[0]?.id || "",
        description: "",
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ==========================================
  // ROSTER HANDLERS
  // ==========================================
  const handleOpenRoster = async (batch: BatchRecordItem) => {
    setActiveBatchForRoster(batch);
    setRosterList([]);
    setIsRosterModalOpen(true);
    setEnrollRollNumber("");

    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batch.id}/roster`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRosterList(json.data);
      }
    } catch (err) {
      console.warn("Could not load full roster");
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollRollNumber.trim() || !activeBatchForRoster) {
      toast.error("Please enter a student roll number or ID");
      return;
    }

    setIsEnrolling(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${activeBatchForRoster.id}/enroll`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rollNumber: enrollRollNumber.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Enrollment failed");

      toast.success("Student enrolled directly into batch");
      setEnrollRollNumber("");

      // Refresh roster
      const refreshRes = await fetch(`/api/v1/academics/batches/${activeBatchForRoster.id}/roster`, { headers });
      const refreshJson = await refreshRes.json();
      if (refreshJson.success && Array.isArray(refreshJson.data)) {
        setRosterList(refreshJson.data);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!activeBatchForRoster) return;
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${activeBatchForRoster.id}/enroll/${studentId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to remove enrollment");

      toast.info("Student enrollment removed from batch");
      setRosterList((prev) => prev.filter((r) => r.studentId !== studentId));
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-theme pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" /> Batches & Academic Operations
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary ml-1" />}
          </h1>
          <p className="text-xs text-text-main/60 mt-0.5">
            Offline classroom programs, seat capacity management, online student admission verification desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border border-theme text-xs font-semibold text-text-main rounded-sm hover:border-brand-primary"
          >
            <Layers className="w-3.5 h-3.5 text-brand-primary" /> + Academic Class
          </button>

          <button
            onClick={handleOpenCreateBatch}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Offline Batch
          </button>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex border-b border-theme text-xs font-semibold overflow-x-auto bg-surface rounded-t-sm px-2">
        <button
          onClick={() => setActiveTab("batches")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "batches"
              ? "border-brand-primary text-brand-primary bg-bg-app/50"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Offline Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab("admissions")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "admissions"
              ? "border-brand-primary text-brand-primary bg-bg-app/50"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Pending Admissions Desk
          {pendingEnrollments.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              {pendingEnrollments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "classes"
              ? "border-brand-primary text-brand-primary bg-bg-app/50"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <Layers className="w-4 h-4" />
          Academic Classes ({academicClasses.length})
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "courses"
              ? "border-brand-primary text-brand-primary bg-bg-app/50"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Online Courses & Curricula ({courses.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFLINE BATCHES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "batches" && (
        <div className="space-y-5">
          {/* Controls Bar: Search, Campus Filter, Class Filter, Status Filter */}
          <div className="bg-surface border border-theme p-4 rounded-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-main/40" />
              <input
                type="text"
                placeholder="Search by batch title, class, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Campus */}
              <div className="flex items-center gap-1 text-xs text-text-main">
                <span className="font-semibold text-text-main/60">Campus:</span>
                {isBranchAdmin ? (
                  <span className="px-2.5 py-1 text-xs bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-semibold rounded-sm">
                    {currentUser?.branch?.name || branches.find((b) => b.id === userBranchId)?.name || "Assigned Campus"}
                  </span>
                ) : (
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="ALL">All Campuses</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Academic Class */}
              <div className="flex items-center gap-1 text-xs text-text-main">
                <span className="font-semibold text-text-main/60">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                >
                  <option value="ALL">All Classes</option>
                  {academicClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Tabs */}
              <div className="flex border border-theme rounded-sm overflow-hidden text-xs">
                {["ALL", "UPCOMING", "ONGOING", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1 text-[11px] font-semibold transition-colors ${
                      selectedStatus === st
                        ? "bg-brand-primary text-white"
                        : "bg-surface text-text-main/60 hover:text-text-main hover:bg-bg-app"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Batches Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBatches.length === 0 && (
              <div className="col-span-full text-center p-12 bg-surface border border-theme rounded-sm text-xs text-text-main/60">
                No offline batches match your filters. Click "Schedule Offline Batch" to schedule a new one.
              </div>
            )}

            {filteredBatches.map((batch) => {
              const seatLimit = batch.seatLimit || batch.maxCapacity || 40;
              const fillPercentage = Math.min(100, Math.round((batch.enrolledCount / seatLimit) * 100));
              const seatsLeft = Math.max(0, seatLimit - batch.enrolledCount);

              return (
                <div
                  key={batch.id}
                  className="bg-surface border border-theme rounded-sm overflow-hidden flex flex-col justify-between hover:border-brand-primary/50 transition-colors shadow-xs"
                >
                  <div>
                    {/* Cover image if available */}
                    {batch.coverImage && (
                      <div className="h-32 w-full bg-slate-900 overflow-hidden relative">
                        <img
                          src={batch.coverImage}
                          alt={batch.name}
                          className="w-full h-full object-cover opacity-85"
                        />
                        <div className="absolute top-2 left-2">
                          {batch.academicClass && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs uppercase">
                              {batch.academicClass.name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          {!batch.coverImage && batch.academicClass && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xs uppercase">
                              {batch.academicClass.name}
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-text-main mt-1 line-clamp-1">
                            {batch.title || batch.name}
                          </h3>
                          <p className="text-[11px] text-text-main/60 font-mono">{batch.name}</p>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-xs border ${
                            batch.status === "ONGOING"
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300"
                              : batch.status === "UPCOMING"
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>

                      {/* Info rows */}
                      <div className="space-y-1.5 text-xs text-text-main/70 pt-1">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span className="font-semibold text-text-main">
                            {batch.classroom ? `Classroom: ${batch.classroom}` : "Main Campus Room"}
                          </span>
                          <span className="text-[10px] text-text-main/50">({batch.branch?.name})</span>
                        </div>

                        {(batch.classTime || batch.scheduleTime) && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span>{batch.classTime || batch.scheduleTime}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>Starts: {new Date(batch.startDate).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-theme/60">
                          <CreditCard className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span className="font-semibold text-text-main">
                            ৳{Number(batch.feeAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            ({(batch.feeType || BatchFeeType.ONE_TIME).replace("_", " ")})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span className="font-medium text-text-main">
                            Mentor: {batch.teacher ? batch.teacher.fullName : "Campus Panel"}
                          </span>
                        </div>
                      </div>

                      {/* Physical Seat Occupancy Bar */}
                      <div className="space-y-1 pt-2 border-t border-theme">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-main/60 font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-brand-primary" /> Physical Seat Capacity
                          </span>
                          <span className="font-mono font-bold text-text-main">
                            {batch.enrolledCount} / {seatLimit} ({seatsLeft} left)
                          </span>
                        </div>

                        <div className="w-full h-2 bg-bg-app border border-theme rounded-xs overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-xs ${
                              fillPercentage >= 90
                                ? "bg-red-500"
                                : fillPercentage >= 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="p-3 bg-bg-app/50 border-t border-theme flex items-center justify-between gap-2">
                    <Link
                      to={`/batches/${batch.id}`}
                      target="_blank"
                      className="p-1.5 border border-theme rounded-sm text-text-main/60 hover:text-brand-primary hover:border-brand-primary"
                      title="Preview Student Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenRoster(batch)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 flex-1 justify-center shadow-xs"
                    >
                      <Users className="w-3 h-3" /> Roster & Enroll
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditBatch(batch)}
                      className="p-1.5 bg-surface border border-theme text-text-main/70 hover:text-text-main hover:border-brand-primary rounded-sm"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="p-1.5 bg-surface border border-theme text-text-main/50 hover:text-red-500 hover:border-red-500 rounded-sm"
                      title="Cancel Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING ADMISSIONS VERIFICATION DESK */}
      {/* ========================================================================= */}
      {activeTab === "admissions" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-sm flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <div className="font-bold text-sm">Admission Payment Verification Desk</div>
                <p>
                  Review TrxID / bank receipts submitted by students during self-checkout. Approving officially
                  locks a physical seat in the offline batch and automatically creates the student invoice and payment receipt.
                  If capacity is full, reject and issue a refund to the student.
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="p-2 bg-surface border border-theme rounded-sm hover:border-brand-primary text-xs flex items-center gap-1 shrink-0"
              title="Refresh applications"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="bg-surface border border-theme rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-app text-text-main/60 border-b border-theme uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Applicant Student</th>
                    <th className="py-3 px-4 font-semibold">Offline Batch & Campus</th>
                    <th className="py-3 px-4 font-semibold">Batch Seat Status</th>
                    <th className="py-3 px-4 font-semibold">Payment Details</th>
                    <th className="py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="py-3 px-4 font-semibold">Submitted At</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {pendingEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-text-main/50 space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                        <div>No pending admission applications. All student submissions are verified!</div>
                      </td>
                    </tr>
                  ) : (
                    pendingEnrollments.map((app) => (
                      <tr key={app.id} className="hover:bg-bg-app/40 transition-colors">
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
                          <div className="font-semibold text-text-main">{app.batchTitle || app.batchName}</div>
                          <div className="text-[11px] text-brand-primary font-semibold">{app.academicClass}</div>
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
                        <td className="py-3 px-4">
                          <div className="font-bold text-sm text-text-main">
                            ৳{app.paidAmount.toLocaleString()}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-text-muted text-[11px]">
                          {new Date(app.appliedAt).toLocaleString()}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(app, "APPROVE")}
                            disabled={!app.isSeatAvailable}
                            className={`px-3 py-1.5 text-xs font-bold rounded-sm shadow-xs inline-flex items-center gap-1 ${
                              app.isSeatAvailable
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-accent text-text-muted cursor-not-allowed"
                            }`}
                            title={app.isSeatAvailable ? "Verify and Lock Seat" : "Cannot approve: Batch is Housefull"}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve & Lock
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(app, "REJECT_REFUND")}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white rounded-sm inline-flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject & Refund
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

      {/* ========================================================================= */}
      {/* TAB 3: ACADEMIC CLASSES MASTER LIST */}
      {/* ========================================================================= */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface border border-theme p-4 rounded-sm">
            <div>
              <h3 className="font-bold text-sm text-text-main">Academic Classes & Levels</h3>
              <p className="text-xs text-text-muted">
                Define the academic standards (e.g. Class 1-10, HSC 1st/2nd Year 2026, Admission: BUET, Medical, DU) to categorize offline batches.
              </p>
            </div>
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Academic Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {academicClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-surface border border-theme p-4 rounded-sm space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs uppercase">
                      {cls.category}
                    </span>
                    <span className="font-mono text-xs text-text-muted">{cls.code}</span>
                  </div>
                  <h4 className="font-bold text-sm text-text-main mt-2">{cls.name}</h4>
                  <p className="text-xs text-text-muted">Academic Year: {cls.academicYear}</p>
                </div>

                <div className="pt-3 border-t border-theme flex justify-between items-center text-xs">
                  <span className="text-text-muted">
                    {cls.batchesCount !== undefined ? `${cls.batchesCount} Batches Scheduled` : "Active Class"}
                  </span>
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-1 text-text-muted hover:text-red-500 rounded-sm"
                    title="Delete Class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ONLINE COURSES & CURRICULA */}
      {/* ========================================================================= */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface border border-theme p-4 rounded-sm">
            <div>
              <h3 className="font-bold text-sm text-text-main">Online Courses & Curricula Repository</h3>
              <p className="text-xs text-text-muted">
                Courses represent online / remote programs that run without physical seat limits.
              </p>
            </div>
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-surface border border-theme p-4 rounded-sm space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-bg-app border border-theme text-brand-primary rounded-xs">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-text-main">
                      ৳{Number(c.feeAmount).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text-main mt-2">{c.name}</h4>
                  <p className="text-xs text-text-muted">Duration: {c.durationWeeks} Weeks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT OFFLINE BATCH */}
      {/* ========================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                {editingBatch ? "Edit Offline Batch Details" : "Schedule New Offline Batch"}
              </h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-text-main/40 hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4">
              {/* Batch Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Public Program Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUET Engineering Admission Master Batch 2026"
                    value={batchForm.title}
                    onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Internal Code / Batch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUET-ENG-MORN-01"
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Academic Class & Campus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Academic Class / Level *</label>
                  <select
                    value={batchForm.academicClassId}
                    onChange={(e) => setBatchForm({ ...batchForm, academicClassId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">-- Choose Academic Class --</option>
                    {academicClasses.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} ({cl.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Campus Branch *</label>
                  {isBranchAdmin ? (
                    <div className="w-full px-2.5 py-1.5 text-xs bg-brand-primary/10 border border-brand-primary/20 rounded-sm text-brand-primary font-semibold flex items-center justify-between">
                      <span className="truncate">
                        {currentUser?.branch?.name || branches.find((b) => b.id === userBranchId)?.name || "Assigned Campus"}
                      </span>
                      <span className="text-[10px] text-brand-primary/70 font-normal">(Campus Scoped)</span>
                    </div>
                  ) : (
                    <select
                      value={batchForm.branchId}
                      onChange={(e) => setBatchForm({ ...batchForm, branchId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Physical Seat Limit & Fees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Physical Seat Limit *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchForm.seatLimit}
                    onChange={(e) => setBatchForm({ ...batchForm, seatLimit: parseInt(e.target.value, 10) || 40 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Fee Amount (BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={batchForm.feeAmount}
                    onChange={(e) => setBatchForm({ ...batchForm, feeAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Fee Payment Type</label>
                  <select
                    value={batchForm.feeType}
                    onChange={(e: any) => setBatchForm({ ...batchForm, feeType: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value={BatchFeeType.ONE_TIME}>One-Time Full Fee</option>
                    <option value={BatchFeeType.INSTALLMENT}>Installments</option>
                    <option value={BatchFeeType.MONTHLY}>Monthly Subscription</option>
                  </select>
                </div>
              </div>

              {/* Classes & Exams Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Total Planned Lectures</label>
                  <input
                    type="number"
                    min="1"
                    value={batchForm.totalClasses}
                    onChange={(e) => setBatchForm({ ...batchForm, totalClasses: parseInt(e.target.value, 10) || 36 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Total Model Exams</label>
                  <input
                    type="number"
                    min="1"
                    value={batchForm.totalExams}
                    onChange={(e) => setBatchForm({ ...batchForm, totalExams: parseInt(e.target.value, 10) || 12 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Classes Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={batchForm.classesPerWeek}
                    onChange={(e) => setBatchForm({ ...batchForm, classesPerWeek: parseInt(e.target.value, 10) || 3 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Schedule, Classroom & Mentor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Classroom / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 302, Lab A"
                    value={batchForm.classroom}
                    onChange={(e) => setBatchForm({ ...batchForm, classroom: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Schedule Timetable</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 11:30 AM"
                    value={batchForm.classTime}
                    onChange={(e) => setBatchForm({ ...batchForm, classTime: e.target.value, scheduleTime: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Lead Teacher / Mentor</label>
                  <select
                    value={batchForm.teacherId}
                    onChange={(e) => setBatchForm({ ...batchForm, teacherId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">-- Campus Mentor Panel --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Days of Week Checkboxes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">Weekly Session Days</label>
                <div className="flex flex-wrap gap-2">
                  {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                    const isChecked = batchForm.daysOfWeek.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const updated = isChecked
                            ? batchForm.daysOfWeek.filter((d) => d !== day)
                            : [...batchForm.daysOfWeek, day];
                          setBatchForm({ ...batchForm, daysOfWeek: updated });
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-sm border transition-colors ${
                          isChecked
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-surface border-theme text-text-muted hover:text-text-main"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Image & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-text-main">Cover Banner Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={batchForm.coverImage}
                    onChange={(e) => setBatchForm({ ...batchForm, coverImage: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.startDate}
                    onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  {editingBatch ? "Save Batch Changes" : "Confirm & Schedule Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VERIFY ADMISSION APPLICATION */}
      {/* ========================================================= */}
      {verifyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                {verifyModalItem.action === "APPROVE" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                {verifyModalItem.action === "APPROVE" ? "Confirm Admission & Lock Seat" : "Cancel & Refund Application"}
              </h3>
              <button onClick={() => setVerifyModalItem(null)} className="text-text-main/40 hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-bg-app p-3 border border-theme rounded-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Student:</span>
                  <span className="font-bold text-text-main">{verifyModalItem.item.studentName} ({verifyModalItem.item.rollNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Batch:</span>
                  <span className="font-semibold text-text-main">{verifyModalItem.item.batchTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Method & TrxID:</span>
                  <span className="font-mono font-bold text-brand-primary">
                    {verifyModalItem.item.paymentMethod} • {verifyModalItem.item.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Amount:</span>
                  <span className="font-bold text-text-main">৳{verifyModalItem.item.paidAmount.toLocaleString()}</span>
                </div>
              </div>

              {verifyModalItem.action === "APPROVE" ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-emerald-900 dark:text-emerald-200 space-y-1">
                  <strong>Verification Consequence:</strong>
                  <p>
                    Approving locks 1 physical seat permanently in {verifyModalItem.item.batchTitle}. A Student Invoice
                    and official Payment Receipt will be recorded in the system.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-900 dark:text-rose-200 space-y-1">
                  <strong>Rejection / Refund Consequence:</strong>
                  <p>
                    This application will be marked as canceled. The transaction record will be logged for campus fee refund processing.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-text-main">Admin Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full p-2 bg-bg-app border border-theme rounded-sm text-text-main focus:outline-none focus:border-brand-primary text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setVerifyModalItem(null)}
                  className="px-3 py-1.5 border border-theme rounded-sm hover:bg-bg-app text-text-muted"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  disabled={isVerifying}
                  className={`px-4 py-1.5 text-white font-bold rounded-sm shadow-xs ${
                    verifyModalItem.action === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isVerifying ? "Processing..." : verifyModalItem.action === "APPROVE" ? "Approve & Lock Seat" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD ACADEMIC CLASS */}
      {/* ========================================================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-primary" /> Define Academic Class / Level
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-text-main/40 hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Class / Standard Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC 2nd Year 2026 or BUET Engineering Admission"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Class Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSC-2026"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2026"
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Category Tier</label>
                <select
                  value={classForm.category}
                  onChange={(e: any) => setClassForm({ ...classForm, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                >
                  <option value={ClassCategory.COLLEGE}>College / Intermediate (HSC)</option>
                  <option value={ClassCategory.ADMISSION}>University & Medical Admission</option>
                  <option value={ClassCategory.SCHOOL}>School / Secondary (Class 1-10)</option>
                  <option value={ClassCategory.PROFESSIONAL}>Professional & Skills</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  Save Academic Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE COURSE */}
      {/* ========================================================= */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-primary" /> Register Online Course
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-text-main/40 hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Mathematics: Calculus & Vector"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH-201"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Duration (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    value={courseForm.durationWeeks}
                    onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: parseInt(e.target.value, 10) || 24 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Fee (BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={courseForm.feeAmount}
                  onChange={(e) => setCourseForm({ ...courseForm, feeAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER / MODAL: BATCH ROSTER */}
      {/* ========================================================= */}
      {isRosterModalOpen && activeBatchForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-theme pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-text-main">{activeBatchForRoster.title || activeBatchForRoster.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-bg-app border border-theme text-brand-primary rounded-xs">
                      {activeBatchForRoster.classroom || "No Room Assigned"}
                    </span>
                  </div>
                  <p className="text-xs text-text-main/60 mt-0.5">
                    {activeBatchForRoster.branch.name} • Enrolled: {rosterList.length} / {activeBatchForRoster.seatLimit || activeBatchForRoster.maxCapacity} Seats
                  </p>
                </div>
                <button
                  onClick={() => setIsRosterModalOpen(false)}
                  className="text-text-main/40 hover:text-text-main rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Enroll Bar */}
              <form onSubmit={handleEnrollStudent} className="pt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-main/40" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Student Roll Number (e.g. 2026-DH-0101) to enroll directly..."
                    value={enrollRollNumber}
                    onChange={(e) => setEnrollRollNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 whitespace-nowrap shadow-xs"
                >
                  {isEnrolling ? "Enrolling..." : "+ Enroll Student"}
                </button>
              </form>

              {/* Roster Table */}
              <div className="mt-4 border border-theme rounded-sm overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-app text-text-main/60 border-b border-theme uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Roll Number</th>
                      <th className="py-2 px-3 font-semibold">Student Name</th>
                      <th className="py-2 px-3 font-semibold">Phone</th>
                      <th className="py-2 px-3 font-semibold">Guardian Contact</th>
                      <th className="py-2 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {rosterList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-text-main/50">
                          No students enrolled in this batch yet. Use the roll number input above to enroll.
                        </td>
                      </tr>
                    ) : (
                      rosterList.map((st) => (
                        <tr key={st.enrollmentId} className="hover:bg-bg-app/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-brand-primary">
                            {st.rollNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-text-main">{st.fullName}</td>
                          <td className="py-2.5 px-3 font-mono text-text-main/70">{st.phone}</td>
                          <td className="py-2.5 px-3 text-text-main/70 font-mono">
                            {st.guardianPhone || "N/A"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(st.studentId)}
                              className="p-1 text-text-main/40 hover:text-red-500 rounded-sm"
                              title="Drop Student from Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-theme pt-3 flex justify-between items-center text-xs text-text-main/50">
              <span>Roster updates reflect in student schedules immediately.</span>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app text-text-main"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
