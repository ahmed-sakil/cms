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
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";

interface RoutineSlot {
  day: string;
  startTime: string;
  endTime: string;
  classroom: string;
  subject: string;
}

interface ClassModule {
  moduleNumber: number;
  title: string;
  topics?: string;
  isCompleted?: boolean;
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

const DAYS_OF_WEEK = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];

export const TeacherBatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Edit states
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeBatchTab, setActiveBatchTab] = useState<"ROSTER" | "ROUTINE" | "MODULES">("ROSTER");

  // Routine Edit state
  const [routineForm, setRoutineForm] = useState<RoutineSlot[]>([]);
  const [modulesForm, setModulesForm] = useState<ClassModule[]>([]);
  const [savingRoutine, setSavingRoutine] = useState(false);

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

  const openBatchDetails = async (batchId: string, initialTab: "ROSTER" | "ROUTINE" | "MODULES" = "ROSTER") => {
    try {
      setLoadingDetails(true);
      setActiveBatchTab(initialTab);
      const res = await apiClient.get<any>(`/teacher/batches/${batchId}`);
      if (res.success && res.data) {
        setSelectedBatch(res.data);
        const routine = Array.isArray(res.data.routine) ? res.data.routine : [];
        const modules = Array.isArray(res.data.classModules) ? res.data.classModules : [];
        setRoutineForm(routine);
        setModulesForm(modules);
      }
    } catch {
      toast.error("Failed to load cohort details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddRoutineSlot = () => {
    setRoutineForm((prev) => [
      ...prev,
      { day: "SAT", startTime: "10:00 AM", endTime: "11:30 AM", classroom: selectedBatch?.classroom || "Room 101", subject: selectedBatch?.course?.name || "General" },
    ]);
  };

  const handleRemoveRoutineSlot = (index: number) => {
    setRoutineForm((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRoutineSlotChange = (index: number, field: keyof RoutineSlot, value: string) => {
    setRoutineForm((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddModule = () => {
    setModulesForm((prev) => [
      ...prev,
      { moduleNumber: prev.length + 1, title: "", topics: "", isCompleted: false },
    ]);
  };

  const handleRemoveModule = (index: number) => {
    setModulesForm((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((m, idx) => ({ ...m, moduleNumber: idx + 1 }))
    );
  };

  const handleModuleChange = (index: number, field: keyof ClassModule, value: any) => {
    setModulesForm((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveRoutineAndModules = async () => {
    if (!selectedBatch) return;
    try {
      setSavingRoutine(true);
      const res = await apiClient.put(`/teacher/batches/${selectedBatch.id}/routine`, {
        routine: routineForm,
        classModules: modulesForm,
      });
      if (res.success) {
        toast.success("Batch timetable & modules updated successfully");
        setSelectedBatch((prev: any) => ({
          ...prev,
          routine: routineForm,
          classModules: modulesForm,
        }));
        fetchBatches();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save timetable changes");
    } finally {
      setSavingRoutine(false);
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" /> Academic Roster & Schedules
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Assigned Batches & Timetable
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Review student rosters, weekly class routine schedules, and syllabus modules for your assigned cohorts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search cohort or course..."
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
                      {batch.course?.name || "Standard Curriculum"} • {batch.academicClass?.name || "Class"}
                    </p>
                  </div>

                  <div className="bg-bg-app rounded-sm p-3 border border-accent/60 space-y-1.5 text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">
                        {batch.classTime || batch.scheduleTime || "Scheduled Weekly"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">{batch.classroom || "Main Classroom"} ({batch.branch?.name || "Branch"})</span>
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
                            {slot.day}: {slot.startTime}
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

                <div className="pt-5 mt-4 border-t border-accent flex items-center gap-2">
                  <button
                    onClick={() => openBatchDetails(batch.id, "ROSTER")}
                    className="flex-1 py-1.5 px-3 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Users className="w-3.5 h-3.5" /> Student Roster
                  </button>
                  <button
                    onClick={() => openBatchDetails(batch.id, "ROUTINE")}
                    className="py-1.5 px-3 bg-surface hover:bg-bg-app border border-accent text-text-main text-xs font-bold rounded-sm flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Timetable
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
            <div className="border-b border-accent px-5 flex items-center gap-6 bg-surface shrink-0 text-xs font-bold">
              <button
                onClick={() => setActiveBatchTab("ROSTER")}
                className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
                  activeBatchTab === "ROSTER"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Enrolled Students ({selectedBatch?.enrollments?.length || 0})
              </button>
              <button
                onClick={() => setActiveBatchTab("ROUTINE")}
                className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
                  activeBatchTab === "ROUTINE"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Weekly Timetable Routine
              </button>
              <button
                onClick={() => setActiveBatchTab("MODULES")}
                className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
                  activeBatchTab === "MODULES"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Course Modules & Topics
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingDetails ? (
                <div className="py-16 text-center text-xs text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-primary mb-2" />
                  Loading batch records...
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

                  {(!selectedBatch?.enrollments || selectedBatch.enrollments.length === 0) ? (
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
                /* Weekly Timetable Routine Editor */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-accent">
                    <div>
                      <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                        Weekly Class Routine Slots
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Specify days, lecture hours, classroom numbers, and subjects for this batch.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddRoutineSlot}
                        className="py-1 px-2.5 bg-surface hover:bg-bg-app border border-accent text-brand-primary text-xs font-bold rounded-sm flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Routine Slot
                      </button>
                    </div>
                  </div>

                  {routineForm.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-accent rounded-sm text-xs text-text-muted">
                      No routine slots configured. Click "Add Routine Slot" above to define class timetable.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {routineForm.map((slot, index) => (
                        <div
                          key={index}
                          className="bg-bg-app border border-accent rounded-sm p-3 flex flex-col sm:flex-row items-center gap-2.5 text-xs"
                        >
                          <div className="w-full sm:w-28">
                            <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Day</label>
                            <select
                              value={slot.day}
                              onChange={(e) => handleRoutineSlotChange(index, "day", e.target.value)}
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs font-semibold text-text-main"
                            >
                              {DAYS_OF_WEEK.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full sm:w-32">
                            <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Start Time</label>
                            <input
                              type="text"
                              value={slot.startTime}
                              onChange={(e) => handleRoutineSlotChange(index, "startTime", e.target.value)}
                              placeholder="10:00 AM"
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs text-text-main font-mono"
                            />
                          </div>

                          <div className="w-full sm:w-32">
                            <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">End Time</label>
                            <input
                              type="text"
                              value={slot.endTime}
                              onChange={(e) => handleRoutineSlotChange(index, "endTime", e.target.value)}
                              placeholder="11:30 AM"
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs text-text-main font-mono"
                            />
                          </div>

                          <div className="w-full sm:w-32">
                            <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Classroom</label>
                            <input
                              type="text"
                              value={slot.classroom}
                              onChange={(e) => handleRoutineSlotChange(index, "classroom", e.target.value)}
                              placeholder="Room 101"
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs text-text-main"
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Subject / Topic</label>
                            <input
                              type="text"
                              value={slot.subject}
                              onChange={(e) => handleRoutineSlotChange(index, "subject", e.target.value)}
                              placeholder="Physics Paper 1"
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs text-text-main"
                            />
                          </div>

                          <div className="pt-4 sm:pt-0">
                            <button
                              onClick={() => handleRemoveRoutineSlot(index)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xs transition-colors"
                              title="Delete slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Course Modules & Topics Editor */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-accent">
                    <div>
                      <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                        Syllabus Modules & Milestones
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Define academic chapters and track completion progress for students.
                      </p>
                    </div>
                    <button
                      onClick={handleAddModule}
                      className="py-1 px-2.5 bg-surface hover:bg-bg-app border border-accent text-brand-primary text-xs font-bold rounded-sm flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Module
                    </button>
                  </div>

                  {modulesForm.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-accent rounded-sm text-xs text-text-muted">
                      No syllabus modules listed. Click "Add Module" to plan your curriculum milestones.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {modulesForm.map((m, index) => (
                        <div
                          key={index}
                          className="bg-bg-app border border-accent rounded-sm p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
                        >
                          <span className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {m.moduleNumber}
                          </span>

                          <div className="flex-1 w-full space-y-2">
                            <input
                              type="text"
                              value={m.title}
                              onChange={(e) => handleModuleChange(index, "title", e.target.value)}
                              placeholder={`Module ${m.moduleNumber} Title (e.g. Kinematics & Vectors)`}
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs font-bold text-text-main"
                            />
                            <input
                              type="text"
                              value={m.topics || ""}
                              onChange={(e) => handleModuleChange(index, "topics", e.target.value)}
                              placeholder="Key sub-topics covered (comma separated)..."
                              className="w-full p-1.5 bg-surface border border-accent rounded-xs text-xs text-text-muted"
                            />
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-text-muted">
                              <input
                                type="checkbox"
                                checked={!!m.isCompleted}
                                onChange={(e) => handleModuleChange(index, "isCompleted", e.target.checked)}
                                className="accent-brand-primary w-4 h-4 rounded-xs"
                              />
                              Completed
                            </label>

                            <button
                              onClick={() => handleRemoveModule(index)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xs"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-accent bg-bg-app flex items-center justify-between shrink-0">
              <span className="text-[11px] text-text-muted">
                {activeBatchTab === "ROSTER" ? "Showing confirmed batch roll" : "Changes are stored immediately in cohort database"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="px-3.5 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Close
                </button>
                {activeBatchTab !== "ROSTER" && (
                  <button
                    onClick={handleSaveRoutineAndModules}
                    disabled={savingRoutine}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {savingRoutine ? (
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
