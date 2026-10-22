import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Users,
  DoorOpen,
  Award,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ExamType,
  type TeacherRecord,
} from "../../../types/index.js";
import { formatDate } from "../../../lib/formatters.js";

const POPULAR_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Higher Mathematics",
  "Biology",
  "General Mathematics",
  "General Science",
  "English",
  "Bangla",
  "ICT",
  "Accounting",
  "Finance & Banking",
];

const WEEKDAY_NAMES: Record<string, string> = {
  SAT: "Saturday",
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};

const DAY_INDEX_MAP: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

interface ClassLectureItem {
  classNumber: number;
  weekOrClass: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  teacherId: string;
  teacherName: string;
  room: string;
  topics: string[];
}

interface ScheduledExamItem {
  id?: string;
  examNumber: number;
  title: string;
  subject: string;
  examType: ExamType;
  examDate: string;
  totalMarks: number;
  passMarks: number;
  instructions: string;
}

interface RoutineSlot {
  day: string;
  time: string;
  subject: string;
  room: string;
  teacherName: string;
}

export const BatchCurriculumPlanner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);

  // Planner States
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");
  const [subjectTeachers, setSubjectTeachers] = useState<Record<string, { teacherId: string; teacherName: string }>>({});
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["SAT", "MON", "WED"]);
  const [classTime, setClassTime] = useState("04:30 PM - 06:00 PM");
  const [classroom, setClassroom] = useState("");
  const [totalClassesTarget, setTotalClassesTarget] = useState(36);
  const [totalExamsTarget, setTotalExamsTarget] = useState(12);

  // Tab State
  const [activeTab, setActiveTab] = useState<"classes" | "exams" | "routine" | "subjects">("classes");

  // Scheduled Items
  const [classModules, setClassModules] = useState<ClassLectureItem[]>([]);
  const [exams, setExams] = useState<ScheduledExamItem[]>([]);
  const [routine, setRoutine] = useState<RoutineSlot[]>([]);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("cms_token") || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const headers = getHeaders();
      const [resBatch, resTeachers] = await Promise.all([
        fetch(`/api/v1/academics/batches/${id}`, { headers }),
        fetch("/api/v1/admin/teachers", { headers }),
      ]);

      const [dataBatch, dataTeachers] = await Promise.all([
        resBatch.json(),
        resTeachers.json(),
      ]);

      if (!dataBatch.success || !dataBatch.data) {
        throw new Error(dataBatch.message || "Failed to load batch details");
      }

      const b = dataBatch.data;
      setBatchData(b);
      if (dataTeachers.success && Array.isArray(dataTeachers.data)) {
        setTeachers(dataTeachers.data);
      }

      // Populate Planner State
      const currentSubjects: string[] = Array.isArray(b.subjects) && b.subjects.length > 0
        ? b.subjects
        : ["Physics", "Chemistry", "Higher Mathematics"];
      setSubjects(currentSubjects);

      // Populate subject-teacher map
      const teacherMap: Record<string, { teacherId: string; teacherName: string }> = {};
      if (Array.isArray(b.subjectTeachers)) {
        b.subjectTeachers.forEach((st: any) => {
          if (st.subject) {
            teacherMap[st.subject] = {
              teacherId: st.teacherId || "",
              teacherName: st.teacherName || "",
            };
          }
        });
      }
      setSubjectTeachers(teacherMap);

      setDaysOfWeek(Array.isArray(b.daysOfWeek) && b.daysOfWeek.length > 0 ? b.daysOfWeek : ["SAT", "MON", "WED"]);
      setClassTime(b.classTime || b.scheduleTime || "04:30 PM - 06:00 PM");
      setClassroom(b.classroom || "Room 101");
      setTotalClassesTarget(b.totalClasses || 36);
      setTotalExamsTarget(b.totalExams || 12);

      // Existing Class Modules
      if (Array.isArray(b.classModules) && b.classModules.length > 0) {
        setClassModules(
          b.classModules.map((cm: any, idx: number) => ({
            classNumber: cm.classNumber || idx + 1,
            weekOrClass: cm.weekOrClass || `Lecture ${String(idx + 1).padStart(2, "0")}`,
            title: cm.title || `Lecture ${idx + 1}`,
            subject: cm.subject || currentSubjects[0] || "General",
            date: cm.date || "",
            time: cm.time || b.classTime || "04:30 PM - 06:00 PM",
            teacherId: cm.teacherId || "",
            teacherName: cm.teacherName || "",
            room: cm.room || b.classroom || "Room 101",
            topics: cm.topics || [],
          }))
        );
      }

      // Existing Database Exams
      if (Array.isArray(b.exams) && b.exams.length > 0) {
        setExams(
          b.exams.map((ex: any, idx: number) => ({
            id: ex.id,
            examNumber: idx + 1,
            title: ex.title,
            subject: ex.subject || currentSubjects[0] || "General",
            examType: ex.examType || ExamType.MOCK_TEST,
            examDate: ex.examDate ? ex.examDate.split("T")[0] : "",
            totalMarks: ex.totalMarks || 100,
            passMarks: ex.passMarks || 40,
            instructions: ex.instructions || "",
          }))
        );
      }

      // Existing Routine
      if (Array.isArray(b.routine) && b.routine.length > 0) {
        setRoutine(b.routine);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load batch planner data");
    } finally {
      setLoading(false);
    }
  }, [id, getHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Adding a Subject
  const handleAddSubject = (subjectName: string) => {
    const trimmed = subjectName.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      toast.info(`'${trimmed}' is already added`);
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    setCustomSubjectInput("");
    toast.success(`Subject '${trimmed}' added to batch`);
  };

  // Handle Removing a Subject
  const handleRemoveSubject = (subjectName: string) => {
    if (subjects.length <= 1) {
      toast.error("At least one subject is required for the cohort");
      return;
    }
    setSubjects(subjects.filter((s) => s !== subjectName));
    const nextMap = { ...subjectTeachers };
    delete nextMap[subjectName];
    setSubjectTeachers(nextMap);
  };

  // Handle Assigning Teacher to Subject
  const handleAssignTeacher = (subjectName: string, teacherId: string) => {
    const selectedTeacher = teachers.find((t) => t.id === teacherId);
    setSubjectTeachers((prev) => ({
      ...prev,
      [subjectName]: {
        teacherId,
        teacherName: selectedTeacher?.fullName || "",
      },
    }));
    toast.success(`Assigned ${selectedTeacher?.fullName || "Faculty"} to ${subjectName}`);
  };

  // Toggle Day of Week
  const handleToggleDay = (day: string) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length <= 1) {
        toast.error("Please keep at least one active weekday for the batch routine");
        return;
      }
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  // Automated Timeline Generator
  const handleAutoGenerateTimeline = () => {
    if (subjects.length === 0) {
      toast.error("Please add at least one subject first");
      return;
    }
    if (daysOfWeek.length === 0) {
      toast.error("Please select at least one active weekday");
      return;
    }

    const start = batchData?.startDate ? new Date(batchData.startDate) : new Date();
    const targetDays = daysOfWeek.map((d) => DAY_INDEX_MAP[d]).filter((n) => n !== undefined);

    const generatedClasses: ClassLectureItem[] = [];
    const generatedExams: ScheduledExamItem[] = [];

    let currentDate = new Date(start);
    let classCounter = 0;
    let examCounter = 0;

    const examInterval = Math.max(2, Math.floor(totalClassesTarget / Math.max(1, totalExamsTarget)));

    // Prevent infinite loop with max days guard
    let safetyCounter = 0;
    while (classCounter < totalClassesTarget && safetyCounter < 730) {
      safetyCounter++;
      const dayIdx = currentDate.getDay();

      if (targetDays.includes(dayIdx)) {
        classCounter++;
        const currentSubject = subjects[(classCounter - 1) % subjects.length];
        const assignedMentor = subjectTeachers[currentSubject];
        const formattedDate = currentDate.toISOString().split("T")[0];

        generatedClasses.push({
          classNumber: classCounter,
          weekOrClass: `Lecture ${String(classCounter).padStart(2, "0")}`,
          title: `${currentSubject}: Core Topic ${Math.ceil(classCounter / subjects.length)}`,
          subject: currentSubject,
          date: formattedDate,
          time: classTime,
          teacherId: assignedMentor?.teacherId || batchData?.teacher?.id || "",
          teacherName: assignedMentor?.teacherName || batchData?.teacher?.fullName || "Assigned Faculty",
          room: classroom,
          topics: [`Introduction & Concepts`, `Formulae & Practical Applications`],
        });

        // Insert an Exam at regular intervals
        if (classCounter % examInterval === 0 && examCounter < totalExamsTarget) {
          examCounter++;
          const examSubject = currentSubject;
          const isMilestone = examCounter % 3 === 0 || examCounter === totalExamsTarget;

          generatedExams.push({
            examNumber: examCounter,
            title: isMilestone
              ? `Milestone Assessment ${examCounter}: ${examSubject} Comprehensive`
              : `Weekly Model Test ${examCounter}: ${examSubject} Assessment`,
            subject: examSubject,
            examType: isMilestone ? ExamType.TERM_FINAL : ExamType.WEEKLY_QUIZ,
            examDate: formattedDate,
            totalMarks: isMilestone ? 100 : 50,
            passMarks: isMilestone ? 40 : 20,
            instructions: "Standard classroom exam. Please bring official admit card and ID.",
          });
        }
      }

      // Increment by 1 day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate Weekly Routine
    const generatedRoutine: RoutineSlot[] = daysOfWeek.map((day, idx) => {
      const subj = subjects[idx % subjects.length];
      const mentor = subjectTeachers[subj];
      return {
        day,
        time: classTime,
        subject: subj,
        room: classroom,
        teacherName: mentor?.teacherName || batchData?.teacher?.fullName || "Faculty Panel",
      };
    });

    setClassModules(generatedClasses);
    setExams(generatedExams);
    setRoutine(generatedRoutine);

    toast.success("Curriculum Timeline Generated!", {
      description: `Generated ${generatedClasses.length} lecture slots and ${generatedExams.length} milestone exams across ${daysOfWeek.length} weekdays.`,
    });
  };

  // Save Everything to Database
  const handleSaveCurriculum = async () => {
    if (!id) return;
    setIsSaving(true);

    try {
      const subjectTeachersList = subjects.map((subj) => ({
        subject: subj,
        teacherId: subjectTeachers[subj]?.teacherId || null,
        teacherName: subjectTeachers[subj]?.teacherName || undefined,
      }));

      const payload = {
        subjects,
        subjectTeachers: subjectTeachersList,
        daysOfWeek,
        classTime,
        classroom,
        classModules,
        routine,
        exams,
      };

      const res = await fetch(`/api/v1/academics/batches/${id}/curriculum`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to publish curriculum plan");
      }

      toast.success("Syllabus & Exams Synchronized!", {
        description: `Successfully saved ${classModules.length} classes and synchronized ${exams.length} exams into the database.`,
      });

      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish curriculum plan");
    } finally {
      setIsSaving(false);
    }
  };

  // Add Single Class Manually
  const handleAddManualClass = () => {
    const nextNum = classModules.length + 1;
    const defaultSubject = subjects[0] || "General";
    const defaultMentor = subjectTeachers[defaultSubject];

    setClassModules([
      ...classModules,
      {
        classNumber: nextNum,
        weekOrClass: `Lecture ${String(nextNum).padStart(2, "0")}`,
        title: `Supplementary Class ${nextNum}`,
        subject: defaultSubject,
        date: new Date().toISOString().split("T")[0],
        time: classTime,
        teacherId: defaultMentor?.teacherId || "",
        teacherName: defaultMentor?.teacherName || "",
        room: classroom,
        topics: [],
      },
    ]);
  };

  // Add Single Exam Manually
  const handleAddManualExam = () => {
    const nextNum = exams.length + 1;
    const defaultSubject = subjects[0] || "General";

    setExams([
      ...exams,
      {
        examNumber: nextNum,
        title: `Model Test ${nextNum}: ${defaultSubject}`,
        subject: defaultSubject,
        examType: ExamType.WEEKLY_QUIZ,
        examDate: new Date().toISOString().split("T")[0],
        totalMarks: 50,
        passMarks: 20,
        instructions: "Pen & paper test. Negative marks 0.25 for incorrect MCQ.",
      },
    ]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
        <p className="text-xs text-text-muted">Loading batch curriculum workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-accent pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/batches")}
              className="p-1 text-text-muted hover:text-text-main hover:bg-accent-subtle rounded-sm transition-colors"
              title="Return to Batches"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-text-muted">Batches & Classrooms</span>
            <ChevronRight className="w-3 h-3 text-text-muted" />
            <span className="text-xs font-semibold text-brand-primary">Syllabus & Exam Planner</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-primary" />
            {batchData?.title || batchData?.name || "Batch Syllabus Planner"}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted pt-1">
            <span className="font-mono bg-bg-app border border-accent px-2 py-0.5 rounded-xs text-text-main">
              {batchData?.name}
            </span>
            <span>•</span>
            <span className="font-medium">{batchData?.branch?.name}</span>
            <span>•</span>
            {batchData?.academicClass && (
              <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xs font-bold">
                {batchData.academicClass.name}
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <DoorOpen className="w-3 h-3 text-brand-primary" /> {classroom || "Classroom"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-primary" /> Starts {formatDate(batchData?.startDate)}
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`/batches/${id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-subtle border border-accent hover:border-brand-primary/40 text-text-main text-xs font-semibold rounded-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
            <span>Public Preview</span>
          </Link>

          <button
            onClick={handleSaveCurriculum}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Publishing Plan..." : "Save & Sync Plan"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-accent p-3 rounded-sm space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Configured Subjects</span>
            <Layers className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-lg font-bold text-text-main">{subjects.length}</p>
        </div>

        <div className="bg-surface border border-accent p-3 rounded-sm space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Planned Lectures</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-text-main">
            {classModules.length} <span className="text-xs font-normal text-text-muted">/ {totalClassesTarget} target</span>
          </p>
        </div>

        <div className="bg-surface border border-accent p-3 rounded-sm space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Database Exams</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-text-main">
            {exams.length} <span className="text-xs font-normal text-text-muted">/ {totalExamsTarget} target</span>
          </p>
        </div>

        <div className="bg-surface border border-accent p-3 rounded-sm space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Assigned Faculty</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-lg font-bold text-text-main">
            {Object.keys(subjectTeachers).filter((k) => subjectTeachers[k]?.teacherId).length}
          </p>
        </div>
      </div>

      {/* Configuration Section 1: Subjects & Assigned Faculty */}
      <div className="bg-surface border border-accent rounded-sm p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-accent pb-3">
          <div>
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-primary" />
              1. Cohort Subjects & Faculty Mentors
            </h2>
            <p className="text-xs text-text-muted">
              Define the academic subjects taught in this batch and assign specific teachers to each course.
            </p>
          </div>
        </div>

        {/* Quick Add Subject Chips */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-main">Standard Subject Quick-Add:</label>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SUBJECTS.map((ps) => {
              const isAdded = subjects.includes(ps);
              return (
                <button
                  key={ps}
                  type="button"
                  onClick={() => (isAdded ? handleRemoveSubject(ps) : handleAddSubject(ps))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-xs border transition-colors flex items-center gap-1 cursor-pointer ${
                    isAdded
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-bg-app border-accent text-text-muted hover:text-text-main hover:border-brand-primary/40"
                  }`}
                >
                  <span>{ps}</span>
                  {isAdded ? "✓" : "+"}
                </button>
              );
            })}
          </div>

          {/* Custom Subject Input */}
          <div className="flex items-center gap-2 pt-2 max-w-md">
            <input
              type="text"
              placeholder="Or add custom subject (e.g. Higher Math 2nd Paper)..."
              value={customSubjectInput}
              onChange={(e) => setCustomSubjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubject(customSubjectInput);
                }
              }}
              className="flex-1 px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
            />
            <button
              type="button"
              onClick={() => handleAddSubject(customSubjectInput)}
              className="px-3 py-1.5 bg-accent-subtle hover:bg-accent border border-accent rounded-sm text-xs font-semibold text-text-main transition-colors"
            >
              Add Subject
            </button>
          </div>
        </div>

        {/* Subjects & Faculty Assignment Grid */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-text-main block pb-2">
            Assigned Instructors Per Subject:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subj) => {
              const currentAssignment = subjectTeachers[subj];
              return (
                <div
                  key={subj}
                  className="p-3 bg-bg-app border border-accent rounded-sm space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-main">{subj}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subj)}
                      className="text-text-muted hover:text-rose-500 p-0.5"
                      title="Remove subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted font-medium">Assigned Teacher:</label>
                    <select
                      value={currentAssignment?.teacherId || ""}
                      onChange={(e) => handleAssignTeacher(subj, e.target.value)}
                      className="w-full px-2 py-1 bg-surface border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">-- Select Instructor --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Configuration Section 2: Automated Schedule Generator */}
      <div className="bg-surface border border-accent rounded-sm p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-accent pb-3">
          <div>
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              2. Timeline & Calendar Automation
            </h2>
            <p className="text-xs text-text-muted">
              Configure weekly routine days, slot times, and let the planner calculate real calendar dates for all classes and exams.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoGenerateTimeline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-sm shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Class & Exam Timeline</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Active Days */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="font-semibold text-text-main block">Active Weekdays:</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(WEEKDAY_NAMES).map((day) => {
                const active = daysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`px-3 py-1 text-xs font-bold rounded-xs border transition-colors cursor-pointer ${
                      active
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-bg-app border-accent text-text-muted hover:text-text-main"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-text-muted pt-0.5">
              Lectures will be scheduled in rotation across: {daysOfWeek.join(", ")}
            </p>
          </div>

          {/* Routine Time Slot */}
          <div className="space-y-1">
            <label className="font-semibold text-text-main">Routine Time Slot</label>
            <input
              type="text"
              value={classTime}
              onChange={(e) => setClassTime(e.target.value)}
              placeholder="e.g. 04:30 PM - 06:00 PM"
              className="w-full px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs font-mono text-text-main focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Assigned Room */}
          <div className="space-y-1">
            <label className="font-semibold text-text-main">Default Classroom / Room</label>
            <input
              type="text"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              placeholder="e.g. Room 402"
              className="w-full px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Configuration Section 3: Interactive Schedule Editor Tabs */}
      <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-accent overflow-x-auto text-xs font-medium bg-bg-app/40">
          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "classes"
                ? "border-brand-primary text-brand-primary bg-surface font-bold"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Class Lectures & Syllabus ({classModules.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exams")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "exams"
                ? "border-brand-primary text-brand-primary bg-surface font-bold"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <Award className="w-4 h-4" />
            Scheduled Exams & Database Milestones ({exams.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("routine")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "routine"
                ? "border-brand-primary text-brand-primary bg-surface font-bold"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <Clock className="w-4 h-4" />
            Weekly Timetable Routine ({routine.length})
          </button>
        </div>

        {/* Tab 1: Class Lectures */}
        {activeTab === "classes" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-xs font-bold text-text-main">
                  Structured Lectures & Lesson Syllabus
                </h3>
                <p className="text-[11px] text-text-muted">
                  Every lecture is linked to a date, subject, topic title, room, and assigned instructor.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddManualClass}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-accent-subtle hover:bg-accent border border-accent rounded-sm text-xs font-semibold text-text-main transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-primary" /> Add Lecture Slot
              </button>
            </div>

            {classModules.length === 0 ? (
              <div className="py-12 text-center text-text-muted space-y-2">
                <Calendar className="w-8 h-8 mx-auto opacity-40 text-brand-primary" />
                <p className="text-xs">No lectures scheduled yet.</p>
                <button
                  type="button"
                  onClick={handleAutoGenerateTimeline}
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  Generate Timeline Now
                </button>
              </div>
            ) : (
              <div className="border border-accent rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-app border-b border-accent text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-16">#</th>
                      <th className="py-2.5 px-3 w-32">Date</th>
                      <th className="py-2.5 px-3 w-36">Subject</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Lesson Topic Title</th>
                      <th className="py-2.5 px-3 w-44">Assigned Faculty</th>
                      <th className="py-2.5 px-3 w-28">Room</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent">
                    {classModules.map((cm, idx) => (
                      <tr key={idx} className="hover:bg-accent-subtle/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-brand-primary">
                          {String(cm.classNumber || idx + 1).padStart(2, "0")}
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={cm.date || ""}
                            onChange={(e) => {
                              const updated = [...classModules];
                              updated[idx].date = e.target.value;
                              setClassModules(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={cm.subject}
                            onChange={(e) => {
                              const updated = [...classModules];
                              const newSubj = e.target.value;
                              updated[idx].subject = newSubj;
                              if (subjectTeachers[newSubj]) {
                                updated[idx].teacherId = subjectTeachers[newSubj].teacherId;
                                updated[idx].teacherName = subjectTeachers[newSubj].teacherName;
                              }
                              setClassModules(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          >
                            {subjects.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={cm.title}
                            placeholder="Enter lecture title..."
                            onChange={(e) => {
                              const updated = [...classModules];
                              updated[idx].title = e.target.value;
                              setClassModules(updated);
                            }}
                            className="w-full px-2.5 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={cm.teacherId}
                            onChange={(e) => {
                              const updated = [...classModules];
                              const tId = e.target.value;
                              const tObj = teachers.find((t) => t.id === tId);
                              updated[idx].teacherId = tId;
                              updated[idx].teacherName = tObj?.fullName || "";
                              setClassModules(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          >
                            <option value="">-- Faculty Mentor --</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.fullName}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={cm.room}
                            placeholder="Room"
                            onChange={(e) => {
                              const updated = [...classModules];
                              updated[idx].room = e.target.value;
                              setClassModules(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          />
                        </td>

                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setClassModules(classModules.filter((_, i) => i !== idx))}
                            className="p-1 text-text-muted hover:text-rose-500 rounded-xs transition-colors"
                            title="Remove class slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Scheduled Exams */}
        {activeTab === "exams" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-xs font-bold text-text-main">
                  Milestone Assessments & Exams Database
                </h3>
                <p className="text-[11px] text-text-muted">
                  These exams will be synchronized into the central database. Instructors will be able to mark attendances and upload results.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddManualExam}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-accent-subtle hover:bg-accent border border-accent rounded-sm text-xs font-semibold text-text-main transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-primary" /> Add Assessment
              </button>
            </div>

            {exams.length === 0 ? (
              <div className="py-12 text-center text-text-muted space-y-2">
                <Award className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                <p className="text-xs">No exams planned yet.</p>
                <button
                  type="button"
                  onClick={handleAutoGenerateTimeline}
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  Generate Timeline Now
                </button>
              </div>
            ) : (
              <div className="border border-accent rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-app border-b border-accent text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-16">#</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Exam Title</th>
                      <th className="py-2.5 px-3 w-36">Subject</th>
                      <th className="py-2.5 px-3 w-36">Format</th>
                      <th className="py-2.5 px-3 w-32">Exam Date</th>
                      <th className="py-2.5 px-3 w-20">Total</th>
                      <th className="py-2.5 px-3 w-20">Pass</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent">
                    {exams.map((ex, idx) => (
                      <tr key={idx} className="hover:bg-accent-subtle/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-amber-500">
                          {String(ex.examNumber || idx + 1).padStart(2, "0")}
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={ex.title}
                            placeholder="Enter exam title..."
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].title = e.target.value;
                              setExams(updated);
                            }}
                            className="w-full px-2.5 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={ex.subject}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].subject = e.target.value;
                              setExams(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          >
                            {subjects.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={ex.examType}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].examType = e.target.value as ExamType;
                              setExams(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          >
                            <option value={ExamType.WEEKLY_QUIZ}>Weekly Quiz</option>
                            <option value={ExamType.MOCK_TEST}>Mock Test</option>
                            <option value={ExamType.MONTHLY_TEST}>Monthly Test</option>
                            <option value={ExamType.TERM_FINAL}>Term Final</option>
                            <option value={ExamType.PRACTICE}>Practice Exam</option>
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={ex.examDate || ""}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].examDate = e.target.value;
                              setExams(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={ex.totalMarks}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].totalMarks = parseInt(e.target.value) || 0;
                              setExams(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main font-mono text-center focus:outline-none focus:border-brand-primary"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            value={ex.passMarks}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].passMarks = parseInt(e.target.value) || 0;
                              setExams(updated);
                            }}
                            className="w-full px-2 py-1 bg-bg-app border border-accent rounded-xs text-xs text-text-main font-mono text-center focus:outline-none focus:border-brand-primary"
                          />
                        </td>

                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExams(exams.filter((_, i) => i !== idx))}
                            className="p-1 text-text-muted hover:text-rose-500 rounded-xs transition-colors"
                            title="Remove exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Weekly Timetable Routine */}
        {activeTab === "routine" && (
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-text-main">Weekly Classroom Timetable</h3>
              <p className="text-[11px] text-text-muted">
                Rotational schedule displayed on the student portal and physical campus noticeboards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {daysOfWeek.map((day) => {
                const daySlot = routine.find((r) => r.day === day);
                return (
                  <div key={day} className="p-3 bg-bg-app border border-accent rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-brand-primary">
                        {WEEKDAY_NAMES[day] || day}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">{classTime}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-text-main">
                        <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                        <span>{daySlot?.subject || subjects[0] || "General Lecture"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                        <DoorOpen className="w-3.5 h-3.5 text-text-muted" />
                        <span>{daySlot?.room || classroom || "Main Campus Room"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save & Action Footer */}
      <div className="flex items-center justify-between p-4 bg-surface border border-accent rounded-sm shadow-xs">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <HelpCircle className="w-4 h-4 text-brand-primary" />
          <span>
            Saving will update the batch curriculum and automatically generate all assessments in the Exams database.
          </span>
        </div>

        <button
          onClick={handleSaveCurriculum}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity disabled:opacity-60 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{isSaving ? "Saving Curriculum..." : "Save & Publish Academic Plan"}</span>
        </button>
      </div>
    </div>
  );
};
