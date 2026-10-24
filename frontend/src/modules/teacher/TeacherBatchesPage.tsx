import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  BookOpen,
  Search,
  X,
  Plus,
  Trash2,
  Save,
  Loader2,
  Phone,
  Mail,
  GraduationCap,
  CheckCircle2,
  Clock4,
  Tag,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";

interface RoutineSlot {
  day: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  classroom?: string;
  room?: string;
  subject: string;
  teacherName?: string;
}

interface ClassModule {
  classNumber?: number;
  moduleNumber?: number;
  weekOrClass?: string;
  title: string;
  subject?: string;
  date?: string;
  time?: string;
  teacherId?: string;
  teacherUserId?: string;
  teacherName?: string;
  room?: string;
  topics?: string[] | string;
  isCompleted?: boolean;
  isMyModule?: boolean;
}

interface BatchItem {
  id: string;
  name: string;
  code: string;
  classroom?: string | null;
  classTime?: string | null;
  scheduleTime?: string | null;
  daysOfWeek?: string[];
  subjects?: string[];
  teacherAssignedSubjects?: string[];
  routine?: RoutineSlot[];
  classModules?: ClassModule[];
  startDate: string;
  endDate?: string | null;
  course?: { id: string; name: string; code: string; durationWeeks?: number } | null;
  academicClass?: { id: string; name: string; category?: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  _count?: {
    enrollments: number;
    exams: number;
    studyMaterials: number;
  };
}

export const TeacherBatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Tab states
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeBatchTab, setActiveBatchTab] = useState<
    "UPCOMING_CLASSES" | "ROSTER" | "ROUTINE" | "MODULES"
  >("UPCOMING_CLASSES");

  // Class & Module states
  const [modulesForm, setModulesForm] = useState<ClassModule[]>([]);
  const [savingModules, setSavingModules] = useState(false);
  const [classFilter, setClassFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED">("ALL");
  const [togglingModuleIdx, setTogglingModuleIdx] = useState<number | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<BatchItem[]>("/teacher/batches");
      if (res.success && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch {
      toast.error("Failed to load assigned batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openBatchDetails = async (
    batchId: string,
    initialTab: "UPCOMING_CLASSES" | "ROSTER" | "ROUTINE" | "MODULES" = "UPCOMING_CLASSES"
  ) => {
    try {
      setLoadingDetails(true);
      setActiveBatchTab(initialTab);
      const res = await apiClient.get<any>(`/teacher/batches/${batchId}`);
      if (res.success && res.data) {
        setSelectedBatch(res.data);
        const modules = Array.isArray(res.data.classModules) ? res.data.classModules : [];
        setModulesForm(modules);
      }
    } catch {
      toast.error("Failed to load batch details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleClassCompletion = async (moduleIdx: number) => {
    if (!selectedBatch) return;
    const targetModule = modulesForm[moduleIdx];
    if (!targetModule) return;

    if (targetModule.isMyModule === false) {
      toast.error("You are only authorized to mark completion for your own assigned classes");
      return;
    }

    const nextStatus = !targetModule.isCompleted;
    const updated = [...modulesForm];
    updated[moduleIdx] = { ...targetModule, isCompleted: nextStatus };
    setModulesForm(updated);

    try {
      setTogglingModuleIdx(moduleIdx);
      const res = await apiClient.put(`/teacher/batches/${selectedBatch.id}/routine`, {
        routine: selectedBatch.routine || [],
        classModules: updated,
      });

      if (res.success) {
        setSelectedBatch((prev: any) => ({ ...prev, classModules: updated }));
        toast.success(
          nextStatus
            ? `Lecture marked as completed!`
            : `Lecture marked as upcoming/pending.`
        );
      }
    } catch (err: any) {
      // Revert optimistic update
      setModulesForm(modulesForm);
      toast.error(err.message || "Failed to update lecture status");
    } finally {
      setTogglingModuleIdx(null);
    }
  };

  const handleAddModule = () => {
    const assignedSub = selectedBatch?.teacherAssignedSubjects?.[0] || selectedBatch?.course?.name || "General";
    setModulesForm((prev) => [
      ...prev,
      {
        classNumber: prev.length + 1,
        moduleNumber: prev.length + 1,
        title: "",
        subject: assignedSub,
        topics: "",
        isCompleted: false,
        isMyModule: true,
      },
    ]);
  };

  const handleRemoveModule = (index: number) => {
    const mod = modulesForm[index];
    if (mod && mod.isMyModule === false) {
      toast.error("You cannot delete modules for other instructors' courses");
      return;
    }
    setModulesForm((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((m, idx) => ({ ...m, classNumber: idx + 1, moduleNumber: idx + 1 }))
    );
  };

  const handleModuleChange = (index: number, field: keyof ClassModule, value: any) => {
    const mod = modulesForm[index];
    if (mod && mod.isMyModule === false) {
      toast.error("You cannot modify syllabus modules for other instructors' courses");
      return;
    }
    setModulesForm((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveModules = async () => {
    if (!selectedBatch) return;
    try {
      setSavingModules(true);
      const res = await apiClient.put(`/teacher/batches/${selectedBatch.id}/routine`, {
        routine: selectedBatch.routine || [],
        classModules: modulesForm,
      });
      if (res.success) {
        toast.success("Curriculum syllabus & lectures updated successfully");
        setSelectedBatch((prev: any) => ({
          ...prev,
          classModules: modulesForm,
        }));
        fetchBatches();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save syllabus changes");
    } finally {
      setSavingModules(false);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      (b.course?.name && b.course.name.toLowerCase().includes(q)) ||
      (b.academicClass?.name && b.academicClass.name.toLowerCase().includes(q))
    );
  });

  const getModuleDateStatus = (dateStr?: string, isCompleted?: boolean) => {
    if (isCompleted) {
      return { label: "Completed", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    }
    if (!dateStr) {
      return { label: "Scheduled", color: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" };
    }
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) {
      return { label: "Today's Class", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    }
    if (dateStr < today) {
      return { label: "Passed", color: "bg-accent/80 text-text-muted border-accent" };
    }
    return { label: "Upcoming", color: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" };
  };

  // Filter modules for the "UPCOMING_CLASSES" tab
  const getDisplayClasses = () => {
    const list = modulesForm;
    const today = new Date().toISOString().split("T")[0];

    if (classFilter === "UPCOMING") {
      return list.filter((m) => !m.isCompleted && (!m.date || m.date >= today));
    }
    if (classFilter === "COMPLETED") {
      return list.filter((m) => m.isCompleted);
    }
    return list;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" /> Academic Roster & Class Schedules
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Assigned Batches & Class Schedule
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Inspect your scheduled lectures, student rosters, official routine timetables, and track syllabus milestone progress.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search batch or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading assigned batches...
          </div>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <Calendar className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No assigned batches found</p>
          <p className="text-xs text-text-muted mt-1">
            You do not have any active cohorts assigned to your profile currently.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => {
            const routineList = Array.isArray(batch.routine) ? batch.routine : [];
            const studentCount = batch._count?.enrollments || 0;
            const mySubjects = batch.teacherAssignedSubjects || [];

            return (
              <div
                key={batch.id}
                className="bg-surface border border-accent rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-xs tracking-wider uppercase">
                      {batch.code}
                    </span>
                    <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                      <Users className="w-3 h-3" /> {studentCount} Enrolled
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-main leading-tight">{batch.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {batch.course?.name || "Curriculum"} • {batch.academicClass?.name || "Academic Class"}
                    </p>
                  </div>

                  {mySubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mySubjects.map((sub) => (
                        <span
                          key={sub}
                          className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="bg-bg-app rounded-sm p-3 border border-accent/60 space-y-1.5 text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">
                        {batch.classTime || batch.scheduleTime || "Scheduled Weekly"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">
                        {batch.classroom || "Main Classroom"} ({batch.branch?.name || "Campus"})
                      </span>
                    </div>
                  </div>

                  {/* Routine Quick Preview */}
                  {routineList.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Weekly Schedule</p>
                      <div className="flex flex-wrap gap-1">
                        {routineList.slice(0, 4).map((slot, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-surface border border-accent px-1.5 py-0.5 rounded-xs font-semibold text-text-main"
                          >
                            {slot.day}: {slot.startTime || slot.time || "Scheduled"}
                          </span>
                        ))}
                        {routineList.length > 4 && (
                          <span className="text-[10px] text-text-muted font-bold px-1 py-0.5">
                            +{routineList.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-accent grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openBatchDetails(batch.id, "UPCOMING_CLASSES")}
                    className="py-1.5 px-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center justify-center gap-1 shadow-xs"
                    title="Inspect upcoming classes"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Classes
                  </button>
                  <button
                    onClick={() => openBatchDetails(batch.id, "ROSTER")}
                    className="py-1.5 px-2 bg-surface hover:bg-bg-app border border-accent text-text-main text-xs font-bold rounded-sm flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5 text-brand-primary" /> Roster
                  </button>
                  <button
                    onClick={() => openBatchDetails(batch.id, "ROUTINE")}
                    className="py-1.5 px-2 bg-surface hover:bg-bg-app border border-accent text-text-main text-xs font-bold rounded-sm flex items-center justify-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-brand-primary" /> Routine
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Details Drawer / Modal */}
      {(selectedBatch || loadingDetails) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-accent flex items-start justify-between bg-bg-app shrink-0">
              {loadingDetails ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Fetching batch details...
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-xs tracking-wider uppercase">
                      {selectedBatch?.code}
                    </span>
                    <span className="text-xs text-text-muted">
                      {selectedBatch?.branch?.name || "Campus"} • {selectedBatch?.course?.name}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-text-main">{selectedBatch?.name}</h2>
                </div>
              )}
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="border-b border-accent px-5 flex items-center gap-4 sm:gap-6 bg-surface shrink-0 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveBatchTab("UPCOMING_CLASSES")}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeBatchTab === "UPCOMING_CLASSES"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Upcoming Classes ({modulesForm.length})
              </button>
              <button
                onClick={() => setActiveBatchTab("ROSTER")}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeBatchTab === "ROSTER"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Enrolled Students ({selectedBatch?.enrollments?.length || 0})
              </button>
              <button
                onClick={() => setActiveBatchTab("ROUTINE")}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeBatchTab === "ROUTINE"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Weekly Timetable
              </button>
              <button
                onClick={() => setActiveBatchTab("MODULES")}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeBatchTab === "MODULES"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Course Syllabus Modules
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingDetails ? (
                <div className="py-16 text-center text-xs text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-primary mb-2" />
                  Loading batch records...
                </div>
              ) : activeBatchTab === "UPCOMING_CLASSES" ? (
                /* UPCOMING CLASSES & SCHEDULE TAB (AS REQUESTED) */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-accent">
                    <div>
                      <h4 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> Scheduled Lectures & Upcoming Classes
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Inspect all class lectures, check scheduled times, classroom venues, topics, and mark completion.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(["ALL", "UPCOMING", "COMPLETED"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setClassFilter(filter)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-sm border transition-colors ${
                            classFilter === filter
                              ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                              : "bg-surface text-text-muted border-accent hover:text-text-main"
                          }`}
                        >
                          {filter === "ALL" ? "All Classes" : filter === "UPCOMING" ? "Upcoming" : "Completed"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {getDisplayClasses().length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-accent rounded-sm text-xs text-text-muted">
                      {classFilter === "UPCOMING"
                        ? "No upcoming classes found. All scheduled lectures have been completed or passed."
                        : classFilter === "COMPLETED"
                        ? "No completed classes yet in this cohort."
                        : "No scheduled class lectures found in this batch curriculum yet."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getDisplayClasses().map((cm, idx) => {
                        const originalIdx = modulesForm.indexOf(cm);
                        const statusObj = getModuleDateStatus(cm.date, cm.isCompleted);
                        const isToggling = togglingModuleIdx === originalIdx;
                        const topicsList = Array.isArray(cm.topics)
                          ? cm.topics
                          : typeof cm.topics === "string" && cm.topics.trim()
                          ? cm.topics.split(",").map((s) => s.trim())
                          : [];

                        return (
                          <div
                            key={idx}
                            className={`border rounded-sm p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              cm.isCompleted
                                ? "bg-bg-app/40 border-accent opacity-85"
                                : "bg-surface border-accent hover:border-brand-primary/40 shadow-xs"
                            }`}
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold bg-bg-app border border-accent text-text-main px-2 py-0.5 rounded-xs uppercase tracking-wider">
                                  {cm.weekOrClass || `Lecture ${String(cm.classNumber || idx + 1).padStart(2, "0")}`}
                                </span>
                                {cm.subject && (
                                  <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs">
                                    {cm.subject}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-xs border ${statusObj.color}`}
                                >
                                  {statusObj.label}
                                </span>
                                {cm.isMyModule ? (
                                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-xs">
                                    Assigned to You
                                  </span>
                                ) : cm.teacherName ? (
                                  <span className="text-[10px] text-text-muted">
                                    Instructor: {cm.teacherName}
                                  </span>
                                ) : null}
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-text-main">{cm.title || `Class Lecture ${idx + 1}`}</h4>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                  <span>{cm.date || "Date scheduled weekly"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock4 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                  <span>{cm.time || selectedBatch?.classTime || "Time TBD"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                  <span>{cm.room || selectedBatch?.classroom || "Main Classroom"}</span>
                                </div>
                              </div>

                              {topicsList.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                  <span className="text-[10px] font-bold text-text-muted flex items-center gap-1 mr-1">
                                    <Tag className="w-3 h-3" /> Topics:
                                  </span>
                                  {topicsList.map((top, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="text-[10px] bg-bg-app text-text-muted border border-accent px-1.5 py-0.5 rounded-xs font-medium"
                                    >
                                      {top}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Mark Completed button */}
                            <div className="shrink-0 self-end sm:self-center">
                              {cm.isMyModule !== false ? (
                                <button
                                  onClick={() => handleToggleClassCompletion(originalIdx)}
                                  disabled={isToggling}
                                  className={`py-1.5 px-3 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors border ${
                                    cm.isCompleted
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                      : "bg-surface hover:bg-bg-app border-accent text-text-main"
                                  }`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                                  ) : cm.isCompleted ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-text-muted" />
                                  )}
                                  {cm.isCompleted ? "Completed" : "Mark Done"}
                                </button>
                              ) : (
                                <span className="text-[11px] text-text-muted italic">Read-only</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : activeBatchTab === "ROSTER" ? (
                /* Student Roster Table */
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <p className="text-xs text-text-muted">
                      Active students officially registered and attending this cohort.
                    </p>
                    <span className="text-xs font-bold text-text-main">
                      Total: {selectedBatch?.enrollments?.length || 0}
                    </span>
                  </div>

                  {!selectedBatch?.enrollments || selectedBatch.enrollments.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-accent rounded-sm text-xs text-text-muted">
                      No active students enrolled in this batch yet.
                    </div>
                  ) : (
                    <div className="border border-accent rounded-sm overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg-app border-b border-accent text-text-muted font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3">Roll</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-accent">
                          {selectedBatch.enrollments.map((item: any) => (
                            <tr key={item.id} className="hover:bg-bg-app/50 transition-colors">
                              <td className="p-3 font-bold text-text-main">
                                {item.student?.rollNumber || "N/A"}
                              </td>
                              <td className="p-3 font-semibold text-text-main flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[10px]">
                                  {item.student?.user?.fullName?.[0] || "S"}
                                </div>
                                {item.student?.user?.fullName || "Student"}
                              </td>
                              <td className="p-3 text-text-muted">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {item.student?.user?.email || "—"}
                                </div>
                              </td>
                              <td className="p-3 text-text-muted">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {item.student?.user?.phone || "—"}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  ACTIVE
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeBatchTab === "ROUTINE" ? (
                /* READ-ONLY WEEKLY TIMETABLE ROUTINE (CANNOT BE CHANGED BY TEACHER) */
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-3 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Official Administration Timetable (Read-Only)</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Weekly routine schedule is configured exclusively by campus administration and cannot be modified by instructors.
                      </p>
                    </div>
                  </div>

                  {!selectedBatch?.routine || selectedBatch.routine.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-accent rounded-sm text-xs text-text-muted">
                      No weekly timetable slots have been scheduled for this batch by administration.
                    </div>
                  ) : (
                    <div className="border border-accent rounded-sm overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg-app border-b border-accent text-text-muted font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3">Day</th>
                            <th className="p-3">Time Slot</th>
                            <th className="p-3">Course / Subject</th>
                            <th className="p-3">Instructor</th>
                            <th className="p-3 text-right">Classroom</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-accent">
                          {selectedBatch.routine.map((slot: any, idx: number) => (
                            <tr key={idx} className="hover:bg-bg-app/50 transition-colors">
                              <td className="p-3 font-bold text-brand-primary">
                                <span className="bg-brand-primary/10 px-2 py-0.5 rounded-xs uppercase">
                                  {slot.day}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-medium text-text-main">
                                {slot.startTime && slot.endTime
                                  ? `${slot.startTime} - ${slot.endTime}`
                                  : slot.time || "Scheduled"}
                              </td>
                              <td className="p-3 font-semibold text-text-main">
                                {slot.subject || selectedBatch?.course?.name || "General"}
                              </td>
                              <td className="p-3 text-text-muted">
                                {slot.teacherName || "Assigned Faculty"}
                              </td>
                              <td className="p-3 text-right font-medium text-text-main">
                                {slot.classroom || slot.room || selectedBatch?.classroom || "Room 101"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Course Modules & Topics Editor (Restricted to teacher's own modules) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-accent">
                    <div>
                      <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                        Syllabus Milestones & Chapter Outline
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Track curriculum completion and update notes for your assigned courses.
                      </p>
                    </div>
                    <button
                      onClick={handleAddModule}
                      className="py-1 px-2.5 bg-surface hover:bg-bg-app border border-accent text-brand-primary text-xs font-bold rounded-sm flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Milestone
                    </button>
                  </div>

                  {modulesForm.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-accent rounded-sm text-xs text-text-muted">
                      No syllabus modules listed. Click "Add Milestone" to plan your curriculum milestones.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {modulesForm.map((m, index) => {
                        const isMine = m.isMyModule !== false;
                        const topicsVal = Array.isArray(m.topics) ? m.topics.join(", ") : m.topics || "";

                        return (
                          <div
                            key={index}
                            className={`border rounded-sm p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs ${
                              isMine ? "bg-bg-app border-accent" : "bg-bg-app/40 border-accent/60 opacity-80"
                            }`}
                          >
                            <span className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {m.classNumber || m.moduleNumber || index + 1}
                            </span>

                            <div className="flex-1 w-full space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  disabled={!isMine}
                                  value={m.title}
                                  onChange={(e) => handleModuleChange(index, "title", e.target.value)}
                                  placeholder={`Module ${index + 1} Title (e.g. Kinematics & Vectors)`}
                                  className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs font-bold text-text-main disabled:opacity-60"
                                />
                                {m.subject && (
                                  <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs shrink-0">
                                    {m.subject}
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                disabled={!isMine}
                                value={topicsVal}
                                onChange={(e) => handleModuleChange(index, "topics", e.target.value)}
                                placeholder="Key sub-topics covered (comma separated)..."
                                className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs text-text-muted disabled:opacity-60"
                              />
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-text-muted">
                                <input
                                  type="checkbox"
                                  disabled={!isMine}
                                  checked={!!m.isCompleted}
                                  onChange={(e) => handleModuleChange(index, "isCompleted", e.target.checked)}
                                  className="accent-brand-primary w-4 h-4 rounded-xs"
                                />
                                Completed
                              </label>

                              {isMine ? (
                                <button
                                  onClick={() => handleRemoveModule(index)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xs"
                                  title="Delete your milestone"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold text-text-muted bg-surface px-1.5 py-0.5 rounded-xs border border-accent">
                                  {m.teacherName || "Other Faculty"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-accent bg-bg-app flex items-center justify-between shrink-0">
              <span className="text-[11px] text-text-muted">
                {activeBatchTab === "ROUTINE"
                  ? "Routine schedule is set by administration"
                  : activeBatchTab === "ROSTER"
                  ? "Showing confirmed batch roll"
                  : "Changes to your syllabus modules are saved to cohort records"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="px-3.5 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Close
                </button>
                {activeBatchTab === "MODULES" && (
                  <button
                    onClick={handleSaveModules}
                    disabled={savingModules}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {savingModules ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
