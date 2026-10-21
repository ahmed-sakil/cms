import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { toast } from "sonner";
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
        name: editingBatch.name,
        title: editingBatch.title || "",
        academicClassId: editingBatch.academicClass?.id || "",
        courseId: editingBatch.course?.id || "",
        branchId: editingBatch.branch.id,
        teacherId: editingBatch.teacher?.id || "",
        classroom: editingBatch.classroom || "",
        classTime: editingBatch.classTime || editingBatch.scheduleTime || "04:30 PM - 06:00 PM",
        scheduleTime: editingBatch.scheduleTime || editingBatch.classTime || "04:30 PM - 06:00 PM",
        seatLimit: editingBatch.seatLimit || editingBatch.maxCapacity,
        totalClasses: editingBatch.totalClasses,
        totalExams: editingBatch.totalExams,
        classesPerWeek: editingBatch.classesPerWeek,
        daysOfWeek: editingBatch.daysOfWeek || [],
        feeAmount: editingBatch.feeAmount,
        feeType: editingBatch.feeType,
        coverImage: editingBatch.coverImage || "",
        startDate: editingBatch.startDate ? editingBatch.startDate.split("T")[0] : "",
        endDate: editingBatch.endDate ? editingBatch.endDate.split("T")[0] : "",
        status: editingBatch.status,
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
      toast.error("Batch internal name is required");
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
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule batch");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-surface border border-accent rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-accent pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            <h2 className="font-bold text-sm text-text-main">
              {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Schedule New Learning Cohort / Batch"}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 rounded-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Public Title & Code */}
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
              <label className="text-xs font-semibold text-text-main">Internal Code / Batch Name *</label>
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

          {/* Academic Class & Campus */}
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

          {/* Assigned Faculty & Classroom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Faculty / Lead Mentor</label>
              <select
                value={batchForm.teacherId}
                onChange={(e) => setBatchForm({ ...batchForm, teacherId: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
              >
                <option value="">-- Unassigned / To Be Announced --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Room / Classroom</label>
              <input
                type="text"
                placeholder="e.g. Room 402, Science Building"
                value={batchForm.classroom}
                onChange={(e) => setBatchForm({ ...batchForm, classroom: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Schedule Time & Physical Seat Capacity */}
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
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
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
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>
          </div>

          {/* Total Classes & Exams */}
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
              className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingBatch
                ? "Save Batch Changes"
                : "Confirm & Schedule Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
