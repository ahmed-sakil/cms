import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Plus,
  Users,
  Clock,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  DoorOpen,
  ExternalLink,
  CreditCard,
  Building2,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { BatchFeeType, type BranchRecord, type AcademicClassRecord } from "../../../types/index.js";
import { formatCurrency, formatDate } from "../../../lib/formatters.js";

export interface BatchRecordItem {
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

interface BatchesListTabProps {
  batches: BatchRecordItem[];
  academicClasses: AcademicClassRecord[];
  branches: BranchRecord[];
  selectedBranch: string;
  setSelectedBranch: (val: string) => void;
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isBranchAdmin: boolean;
  loading: boolean;
  onRefresh: () => void;
  onOpenCreateBatch: () => void;
  onOpenEditBatch: (batch: BatchRecordItem) => void;
  onDeleteBatch: (batchId: string) => void;
  onOpenRoster: (batch: BatchRecordItem) => void;
}

export const BatchesListTab: React.FC<BatchesListTabProps> = ({
  batches,
  academicClasses,
  branches,
  selectedBranch,
  setSelectedBranch,
  selectedClass,
  setSelectedClass,
  selectedStatus,
  setSelectedStatus,
  searchQuery,
  setSearchQuery,
  isBranchAdmin,
  loading,
  onRefresh,
  onOpenCreateBatch,
  onOpenEditBatch,
  onDeleteBatch,
  onOpenRoster,
}) => {
  const filteredBatches = batches.filter((b) => {
    const matchesBranch = selectedBranch === "ALL" || b.branch?.id === selectedBranch;
    const matchesClass = selectedClass === "ALL" || b.academicClass?.id === selectedClass;
    const matchesStatus = selectedStatus === "ALL" || b.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(q) ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.academicClass && b.academicClass.name.toLowerCase().includes(q)) ||
      (b.classroom && b.classroom.toLowerCase().includes(q));
    return matchesBranch && matchesClass && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="bg-surface border border-accent rounded-sm p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search cohort title, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {!isBranchAdmin && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary cursor-pointer"
              >
                <option value="ALL">All Campuses</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value="ALL">All Academic Classes</option>
            {academicClasses.map((ac) => (
              <option key={ac.id} value={ac.id}>
                {ac.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={onRefresh}
            title="Refresh Batches"
            className="p-1.5 bg-surface border border-accent text-text-muted hover:text-text-main rounded-sm hover:bg-accent-subtle transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onOpenCreateBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Batch
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center text-xs text-text-muted">
          Loading cohorts and batch schedules...
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center space-y-3 shadow-xs">
          <Calendar className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs text-text-muted">
            {searchQuery
              ? `No batches matching "${searchQuery}"`
              : "No batches found. Click 'Schedule Batch' to create a learning cohort."}
          </p>
          <button
            onClick={onOpenCreateBatch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => {
            const seatLimit = batch.seatLimit || batch.maxCapacity || 40;
            const fillPercentage = Math.min(100, Math.round((batch.enrolledCount / seatLimit) * 100));
            const seatsLeft = Math.max(0, seatLimit - batch.enrolledCount);

            return (
              <div
                key={batch.id}
                className="bg-surface border border-accent rounded-sm overflow-hidden flex flex-col justify-between hover:border-brand-primary/50 transition-colors shadow-xs"
              >
                <div>
                  {/* Cover image banner container */}
                  <div className="h-32 w-full bg-accent-subtle/50 border-b border-accent overflow-hidden relative group flex items-center justify-center">
                    {batch.coverImage ? (
                      <img
                        src={batch.coverImage}
                        alt={batch.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-bg-app to-surface">
                        <DoorOpen className="w-6 h-6 text-brand-primary/40 mb-1" />
                        <span className="text-[11px] font-semibold text-text-muted">
                          {batch.classroom ? `Classroom: ${batch.classroom}` : "In-Person Classroom Cohort"}
                        </span>
                      </div>
                    )}

                    {/* Classroom and Academic Class Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                      {batch.academicClass && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs uppercase shadow-xs">
                          {batch.academicClass.name}
                        </span>
                      )}
                      {batch.classroom && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-surface/90 border border-accent text-text-main rounded-xs shadow-xs flex items-center gap-1 backdrop-blur-xs">
                          <DoorOpen className="w-3 h-3 text-brand-primary" /> {batch.classroom}
                        </span>
                      )}
                      {((batch.totalClasses ?? 0) > 0 || (batch.totalExams ?? 0) > 0) && (
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-surface/90 border border-accent text-text-muted rounded-xs shadow-xs flex items-center gap-1 backdrop-blur-xs">
                          <BookOpen className="w-3 h-3 text-brand-primary" /> {batch.totalClasses || 0} classes • {batch.totalExams || 0} exams
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-xs border shadow-xs backdrop-blur-xs ${
                          batch.status === "ONGOING"
                            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/80 dark:text-green-300"
                            : batch.status === "UPCOMING"
                            ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300"
                            : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/80 dark:text-gray-300"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div>
                      <h3 className="text-sm font-bold text-text-main line-clamp-1">
                        {batch.title || batch.name}
                      </h3>
                      <p className="text-[11px] text-text-muted font-mono">{batch.name}</p>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-1.5 text-xs text-text-muted pt-1">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="font-semibold text-text-main">
                          {batch.classroom ? `Classroom: ${batch.classroom}` : "Assigned Hall"}
                        </span>
                        <span className="text-[10px]">({batch.branch?.name})</span>
                      </div>

                      {(batch.classTime || batch.scheduleTime) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>{batch.classTime || batch.scheduleTime}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span>Starts: {formatDate(batch.startDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-accent">
                        <CreditCard className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="font-semibold text-text-main">
                          {formatCurrency(batch.feeAmount)}
                        </span>
                        <span className="text-[10px]">
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
                    <div className="space-y-1 pt-2 border-t border-accent">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-text-muted font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-brand-primary" /> Physical Seat Capacity
                        </span>
                        <span className="font-mono font-bold text-text-main">
                          {batch.enrolledCount} / {seatLimit} ({seatsLeft} left)
                        </span>
                      </div>

                      <div className="w-full h-2 bg-bg-app border border-accent rounded-xs overflow-hidden">
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
                <div className="p-3 bg-bg-app/50 border-t border-accent flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/batches/${batch.id}`}
                      target="_blank"
                      className="p-1.5 border border-accent rounded-sm text-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors"
                      title="Preview Public Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/admin/batches/${batch.id}/planner`}
                      className="px-2.5 py-1 text-xs font-semibold bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-sm text-brand-primary transition-colors flex items-center gap-1.5"
                      title="Syllabus, Routine & Exam Planner"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Curriculum Planner</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenRoster(batch)}
                      className="px-2.5 py-1 text-xs font-semibold bg-accent-subtle hover:bg-accent border border-accent rounded-sm text-text-main transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Users className="w-3 h-3 text-brand-primary" /> Roster ({batch.enrolledCount})
                    </button>

                    <button
                      onClick={() => onOpenEditBatch(batch)}
                      className="p-1.5 border border-accent rounded-sm text-text-muted hover:text-text-main hover:bg-accent-subtle transition-colors cursor-pointer"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteBatch(batch.id)}
                      className="p-1.5 border border-accent rounded-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Cancel / Delete Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
