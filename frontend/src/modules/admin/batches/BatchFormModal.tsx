import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image as ImageIcon, DoorOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../../components/common/FileUpload.js";
import {
  BatchFeeType,
  type BranchRecord,
  type TeacherRecord,
  type AcademicClassRecord,
} from "../../../types/index.js";
import type { BatchRecordItem } from "./BatchesListTab.js";

interface BatchFormModalProps {
  isOpen: boolean;
  editingBatch: BatchRecordItem | null;
  onClose: () => void;
  onSuccess: () => void;
  academicClasses: AcademicClassRecord[];
  branches: BranchRecord[];
  teachers: TeacherRecord[];
  isBranchAdmin: boolean;
  userBranchId: string;
}

export const BatchFormModal: React.FC<BatchFormModalProps> = ({
  isOpen,
  editingBatch,
  onClose,
  onSuccess,
  academicClasses,
  branches,
  teachers,
  isBranchAdmin,
  userBranchId,
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: "",
    title: "",
    academicClassId: "",
    courseId: "",
    branchId: "",
    teacherId: "",
    classroom: "",
    classTime: "04:30 PM - 06:00 PM",
    scheduleTime: "04:30 PM - 06:00 PM",
    seatLimit: 40,
    totalClasses: 36,
    totalExams: 12,
    classesPerWeek: 3,
    daysOfWeek: ["SAT", "MON", "WED"] as string[],
    feeAmount: 12000,
    feeType: BatchFeeType.ONE_TIME,
    coverImage: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "UPCOMING",
    isPublic: true,
  });

  useEffect(() => {
    if (editingBatch) {
      setBatchForm({
        name: editingBatch.name || "",
        title: editingBatch.title || editingBatch.name || "",
        academicClassId: editingBatch.academicClass?.id || "",
        courseId: editingBatch.course?.id || "",
        branchId: editingBatch.branch?.id || (isBranchAdmin && userBranchId ? userBranchId : branches[0]?.id || ""),
        teacherId: editingBatch.teacher?.id || "",
        classroom: editingBatch.classroom || "",
        classTime: editingBatch.classTime || editingBatch.scheduleTime || "04:30 PM - 06:00 PM",
        scheduleTime: editingBatch.scheduleTime || editingBatch.classTime || "04:30 PM - 06:00 PM",
        seatLimit: editingBatch.seatLimit || editingBatch.maxCapacity || 40,
        totalClasses: editingBatch.totalClasses || 36,
        totalExams: editingBatch.totalExams || 12,
        classesPerWeek: editingBatch.classesPerWeek || 3,
        daysOfWeek: editingBatch.daysOfWeek || ["SAT", "MON", "WED"],
        feeAmount: editingBatch.feeAmount !== undefined ? editingBatch.feeAmount : 12000,
        feeType: editingBatch.feeType || BatchFeeType.ONE_TIME,
        coverImage: editingBatch.coverImage || "",
        startDate: editingBatch.startDate ? editingBatch.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
        endDate: editingBatch.endDate ? editingBatch.endDate.split("T")[0] : "",
        status: editingBatch.status || "UPCOMING",
        isPublic: true,
      });
    } else {
      setBatchForm({
        name: "",
        title: "",
        academicClassId: academicClasses[0]?.id || "",
        courseId: "",
        branchId: isBranchAdmin && userBranchId ? userBranchId : branches[0]?.id || "",
        teacherId: "",
        classroom: "",
        classTime: "04:30 PM - 06:00 PM",
        scheduleTime: "04:30 PM - 06:00 PM",
        seatLimit: 40,
        totalClasses: 36,
        totalExams: 12,
        classesPerWeek: 3,
        daysOfWeek: ["SAT", "MON", "WED"],
        feeAmount: 12000,
        feeType: BatchFeeType.ONE_TIME,
        coverImage: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        status: "UPCOMING",
        isPublic: true,
      });
    }
  }, [editingBatch, isOpen, academicClasses, branches, isBranchAdmin, userBranchId]);

  if (!isOpen) return null;

  const currentBranchName =
    branches.find((b) => b.id === userBranchId)?.name || "Assigned Campus";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.name.trim()) {
      toast.error("Internal batch identifier is required (e.g. BUET-2026-M1)");
      return;
    }

    const selectedBranchId = isBranchAdmin && userBranchId
      ? userBranchId
      : batchForm.branchId || branches[0]?.id || "";

    if (!selectedBranchId) {
      toast.error("Please select a physical campus / branch");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("cms_token") || localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const payload: any = {
        name: batchForm.name.trim(),
        title: batchForm.title.trim() || batchForm.name.trim(),
        academicClassId: batchForm.academicClassId?.trim() || null,
        courseId: batchForm.courseId?.trim() || null,
        branchId: selectedBranchId,
        teacherId: batchForm.teacherId?.trim() || null,
        classroom: batchForm.classroom?.trim() || null,
        classTime: batchForm.classTime?.trim() || batchForm.scheduleTime?.trim() || null,
        scheduleTime: batchForm.scheduleTime?.trim() || batchForm.classTime?.trim() || null,
        seatLimit: Number(batchForm.seatLimit) || 40,
        maxCapacity: Number(batchForm.seatLimit) || 40,
        totalClasses: Number(batchForm.totalClasses) || 36,
        totalExams: Number(batchForm.totalExams) || 12,
        classesPerWeek: Number(batchForm.classesPerWeek) || 3,
        daysOfWeek: batchForm.daysOfWeek || [],
        feeAmount: Number(batchForm.feeAmount) || 0,
        feeType: batchForm.feeType || BatchFeeType.ONE_TIME,
        coverImage: batchForm.coverImage?.trim() || null,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate?.trim() || null,
        status: batchForm.status,
        isPublic: batchForm.isPublic,
      };

      const url = editingBatch
        ? `/api/v1/academics/batches/${editingBatch.id}`
        : "/api/v1/academics/batches";
      const method = editingBatch ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors && typeof json.errors === "object") {
          const formatted = Object.entries(json.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
            .join("; ");
          throw new Error(formatted || json.message || "Failed to schedule batch");
        }
        throw new Error(json.message || "Failed to schedule batch");
      }

      const createdBatch = json.data;
      if (editingBatch) {
        toast.success("Batch details updated successfully");
      } else {
        toast.success("New batch scheduled successfully!", {
          description: "Click below to plan syllabus, lecture schedule & exams.",
          action: createdBatch?.id
            ? {
                label: "Open Planner",
                onClick: () => navigate(`/admin/batches/${createdBatch.id}/planner`),
              }
            : undefined,
          duration: 8000,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule batch");
    } finally {
      setIsSaving(false);
    }
  };

  const quickRooms = ["Room 101", "Room 202", "Room 303", "Main Hall", "Science Lab", "Seminar Room"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-surface border border-accent rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-accent pb-3">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-4.5 h-4.5 text-brand-primary" />
            <div>
              <h2 className="font-bold text-sm text-text-main">
                {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Schedule New Offline Batch & Classroom"}
              </h2>
              <p className="text-[11px] text-text-muted">
                Configure classroom assignment, seat limit, routine schedules, and poster banner.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 rounded-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Program Identity & Academic Standard */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Public Program Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUET Engineering Admission Master Batch 2026"
                  value={batchForm.title}
                  onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Internal Code / Batch ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUET-ENG-MORN-01"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Academic Class / Standard *</label>
                <select
                  required
                  value={batchForm.academicClassId}
                  onChange={(e) => setBatchForm({ ...batchForm, academicClassId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                >
                  <option value="">-- Select Class --</option>
                  {academicClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Campus / Physical Branch *</label>
                {isBranchAdmin ? (
                  <input
                    type="text"
                    disabled
                    value={currentBranchName}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app/50 border border-accent rounded-sm text-text-muted cursor-not-allowed font-medium"
                  />
                ) : (
                  <select
                    required
                    value={batchForm.branchId}
                    onChange={(e) => setBatchForm({ ...batchForm, branchId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">-- Select Campus --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Classroom & Physical Routine */}
          <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-main">
              <DoorOpen className="w-3.5 h-3.5 text-brand-primary" />
              <span>Classroom & Routine Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Room / Classroom Number</label>
                <input
                  type="text"
                  placeholder="e.g. Room 402, Science Building"
                  value={batchForm.classroom}
                  onChange={(e) => setBatchForm({ ...batchForm, classroom: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
                {/* Quick Room Presets */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-text-muted">Suggestions:</span>
                  {quickRooms.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setBatchForm({ ...batchForm, classroom: qr })}
                      className="px-1.5 py-0.5 text-[10px] bg-accent-subtle hover:bg-accent border border-accent text-text-main rounded-xs transition-colors"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Faculty / Lead Mentor</label>
                <select
                  value={batchForm.teacherId}
                  onChange={(e) => setBatchForm({ ...batchForm, teacherId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                >
                  <option value="">-- Unassigned / To Be Announced --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Class Slot / Routine Time</label>
                <input
                  type="text"
                  placeholder="e.g. 04:30 PM - 06:00 PM"
                  value={batchForm.classTime}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      classTime: e.target.value,
                      scheduleTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Physical Seat Limit *</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={batchForm.seatLimit}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, seatLimit: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Batch Cover / Poster Image Upload */}
          <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-primary" />
                Batch Banner / Poster / Classroom Media
              </label>
              <span className="text-[10px] text-text-muted">16:9 banner or flyer recommended</span>
            </div>
            <FileUpload
              folder="posters"
              value={batchForm.coverImage}
              onChange={(url) => setBatchForm({ ...batchForm, coverImage: url })}
              helperText="Upload program poster or classroom photo. Displayed on public website and student portal."
            />
          </div>

          {/* Section 4: Academic Metrics & Tuition Fee */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Total Classes</label>
              <input
                type="number"
                min="1"
                value={batchForm.totalClasses}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, totalClasses: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Total Exams</label>
              <input
                type="number"
                min="0"
                value={batchForm.totalExams}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, totalExams: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Classes / Week</label>
              <input
                type="number"
                min="1"
                max="7"
                value={batchForm.classesPerWeek}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, classesPerWeek: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>
          </div>

          {/* Fee & Billing Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Standard Admission Fee (BDT) *</label>
              <input
                type="number"
                min="0"
                required
                value={batchForm.feeAmount}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, feeAmount: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Billing Frequency</label>
              <select
                value={batchForm.feeType}
                onChange={(e) => setBatchForm({ ...batchForm, feeType: e.target.value as BatchFeeType })}
                className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
              >
                <option value={BatchFeeType.ONE_TIME}>Full Course (One-Time)</option>
                <option value={BatchFeeType.MONTHLY}>Monthly Recurring</option>
                <option value={BatchFeeType.INSTALLMENT}>Multiple Installments</option>
              </select>
            </div>
          </div>

          {/* Schedule Dates & Lifecycle Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Start Date *</label>
              <input
                type="date"
                required
                value={batchForm.startDate}
                onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Target End Date</label>
              <input
                type="date"
                value={batchForm.endDate}
                onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Lifecycle Status</label>
              <select
                value={batchForm.status}
                onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
              >
                <option value="UPCOMING">Upcoming / Open for Admissions</option>
                <option value="ONGOING">Ongoing / Active in Session</option>
                <option value="COMPLETED">Completed / Concluded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-accent">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-accent text-xs font-semibold rounded-sm hover:bg-bg-app text-text-muted hover:text-text-main transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : editingBatch ? (
                <span>Save Batch Changes</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirm & Schedule Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
