import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Calendar, CheckCircle2, Layers, GraduationCap, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  ClassCategory,
  type BranchRecord,
  type TeacherRecord,
  type AcademicClassRecord,
  type PendingEnrollmentRecord,
} from "../../types/index.js";
import { BatchesListTab, type BatchRecordItem } from "./batches/BatchesListTab.js";
import { BatchFormModal } from "./batches/BatchFormModal.js";
import { AdmissionsDeskTab } from "./batches/AdmissionsDeskTab.js";
import { AcademicClassesTab } from "./batches/AcademicClassesTab.js";
import { BatchRosterDrawer } from "./batches/BatchRosterDrawer.js";

export const BatchesManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"batches" | "admissions" | "classes">("batches");

  const [batches, setBatches] = useState<BatchRecordItem[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassRecord[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRecordItem | null>(null);
  const [selectedBatchForRoster, setSelectedBatchForRoster] = useState<BatchRecordItem | null>(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("cms_user") || localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";
  const userBranchId = currentUser?.branchId || "";

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("cms_token") || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const [resB, resBr, resT, resCl, resP] = await Promise.all([
        fetch("/api/v1/academics/batches", { headers }),
        fetch("/api/v1/admin/branches", { headers }),
        fetch("/api/v1/admin/teachers", { headers }),
        fetch("/api/v1/academics/classes", { headers }),
        fetch("/api/v1/academics/enrollments/pending", { headers }),
      ]);

      const [dataB, dataBr, dataT, dataCl, dataP] = await Promise.all([
        resB.json(),
        resBr.json(),
        resT.json(),
        resCl.json(),
        resP.json(),
      ]);

      if (dataB.success && Array.isArray(dataB.data)) setBatches(dataB.data);
      if (dataBr.success && Array.isArray(dataBr.data)) setBranches(dataBr.data);
      if (dataT.success && Array.isArray(dataT.data)) setTeachers(dataT.data);
      if (dataCl.success && Array.isArray(dataCl.data)) setAcademicClasses(dataCl.data);
      if (dataP.success && Array.isArray(dataP.data)) setPendingEnrollments(dataP.data);
    } catch (err) {
      console.warn("Could not retrieve all academic resources:", err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateBatch = useCallback(() => {
    setEditingBatch(null);
    setIsBatchModalOpen(true);
  }, []);

  const handleOpenEditBatch = (batch: BatchRecordItem) => {
    setEditingBatch(batch);
    setIsBatchModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreateBatch();
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, handleOpenCreateBatch]);

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to cancel / remove this offline batch?")) return;
    try {
      const res = await fetch(`/api/v1/academics/batches/${batchId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete batch");
      toast.success("Batch removed successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove batch");
    }
  };

  const handleVerifyEnrollment = async (
    enrollmentId: string,
    action: "APPROVE" | "REJECT_REFUND",
    adminNotes: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/academics/enrollments/${enrollmentId}/verify`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ action, adminNotes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Verification action failed");

      toast[action === "APPROVE" ? "success" : "info"](
        action === "APPROVE" ? "Admission Verified & Seat Locked!" : "Application Rejected / Refund Scheduled"
      );
      loadData();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
      return false;
    }
  };

  const handleSaveClass = async (form: {
    name: string;
    code: string;
    academicYear: string;
    category: ClassCategory;
    displayOrder: number;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/v1/academics/classes", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create class");
      toast.success(`Academic class '${json.data.name}' created!`);
      loadData();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to create class");
      return false;
    }
  };

  const handleDeleteClass = async (classId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/academics/classes/${classId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete class");
      toast.success("Academic class deleted");
      loadData();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to delete class");
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-accent pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" /> Batches & Academic Operations
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary ml-1" />}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage cohort schedules, branch seat limits, pending admissions verification, and academic standards.
          </p>
        </div>
        <Link
          to="/admin/courses"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-subtle border border-accent hover:border-brand-primary/40 text-text-main text-xs font-semibold rounded-sm transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
          <span>Courses Repository</span>
          <ExternalLink className="w-3 h-3 text-text-muted ml-0.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-accent overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("batches")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "batches"
              ? "border-brand-primary text-brand-primary bg-accent-subtle/50"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Offline Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab("admissions")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "admissions"
              ? "border-brand-primary text-brand-primary bg-accent-subtle/50"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Pending Admissions Desk
          {pendingEnrollments.length > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              {pendingEnrollments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "classes"
              ? "border-brand-primary text-brand-primary bg-accent-subtle/50"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          <Layers className="w-4 h-4" />
          Academic Classes ({academicClasses.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "batches" && (
        <BatchesListTab
          batches={batches}
          academicClasses={academicClasses}
          branches={branches}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isBranchAdmin={isBranchAdmin}
          loading={loading}
          onRefresh={loadData}
          onOpenCreateBatch={handleOpenCreateBatch}
          onOpenEditBatch={handleOpenEditBatch}
          onDeleteBatch={handleDeleteBatch}
          onOpenRoster={(batch) => setSelectedBatchForRoster(batch)}
        />
      )}

      {activeTab === "admissions" && (
        <AdmissionsDeskTab
          pendingEnrollments={pendingEnrollments}
          loading={loading}
          onVerifyEnrollment={handleVerifyEnrollment}
        />
      )}

      {activeTab === "classes" && (
        <AcademicClassesTab
          academicClasses={academicClasses}
          loading={loading}
          onSaveClass={handleSaveClass}
          onDeleteClass={handleDeleteClass}
        />
      )}

      {/* Modals & Drawers */}
      <BatchFormModal
        isOpen={isBatchModalOpen}
        editingBatch={editingBatch}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={loadData}
        academicClasses={academicClasses}
        branches={branches}
        teachers={teachers}
        isBranchAdmin={isBranchAdmin}
        userBranchId={userBranchId}
      />

      <BatchRosterDrawer
        isOpen={Boolean(selectedBatchForRoster)}
        batch={selectedBatchForRoster}
        onClose={() => setSelectedBatchForRoster(null)}
        onRosterChanged={loadData}
      />
    </div>
  );
};
