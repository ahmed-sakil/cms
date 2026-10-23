import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Search,
  Calendar,
  Edit2,
  Globe,
  Lock,
  Loader2,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";

type ExamTypeEnum = "QUIZ" | "WEEKLY" | "MONTHLY" | "TERM_FINAL" | "PRACTICE";

interface ExamListItem {
  id: string;
  batchId: string;
  title: string;
  subject?: string | null;
  examType: ExamTypeEnum;
  totalMarks: number;
  passMarks: number;
  examDate: string;
  isPublished: boolean;
  publishedAt?: string | null;
  batch?: { id: string; name: string; course?: { name: string } | null } | null;
  _count?: { results: number };
}

interface StudentScoreRow {
  studentId: string;
  rollNumber: string;
  fullName: string;
  marksObtained: number | string;
  grade?: string;
  rank?: number;
  isPassed?: boolean;
}

export const TeacherExamsPage: React.FC = () => {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  // Create Exam Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [examForm, setExamForm] = useState({
    batchId: "",
    title: "",
    subject: "",
    examType: "WEEKLY" as ExamTypeEnum,
    totalMarks: 50,
    passMarks: 20,
    examDate: new Date().toISOString().split("T")[0],
    instructions: "",
  });

  // Evaluation Marksheet Drawer
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [loadingExamDetails, setLoadingExamDetails] = useState(false);
  const [scoresTable, setScoresTable] = useState<StudentScoreRow[]>([]);
  const [savingScores, setSavingScores] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);

  // Toggling publish state directly
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ExamListItem[]>("/teacher/exams");
      if (res.success && Array.isArray(res.data)) {
        setExams(res.data);
      }
    } catch {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiClient.get<any[]>("/teacher/batches");
      if (res.success && Array.isArray(res.data)) {
        const batchList = res.data;
        setBatches(batchList);
        if (batchList.length > 0 && !examForm.batchId) {
          setExamForm((prev) => ({ ...prev, batchId: batchList[0].id }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchExams();
    fetchBatches();
  }, []);

  const calculateGradePreview = (obtained: number, total: number) => {
    if (total <= 0 || obtained < 0) return "F";
    const pct = (obtained / total) * 100;
    if (pct >= 80) return "A+";
    if (pct >= 70) return "A";
    if (pct >= 60) return "A-";
    if (pct >= 50) return "B";
    if (pct >= 40) return "C";
    if (pct >= 33) return "D";
    return "F";
  };

  const handleOpenMarksheet = async (examId: string) => {
    try {
      setLoadingExamDetails(true);
      const res = await apiClient.get<any>(`/teacher/exams/${examId}`);
      if (res.success && res.data) {
        setSelectedExam(res.data);
        setPublishImmediately(!!res.data.isPublished);

        // Build score table from enrollments and existing results
        const enrollments = res.data.batch?.enrollments || [];
        const existingResults = res.data.results || [];
        const resultMap = new Map(existingResults.map((r: any) => [r.studentId, r]));

        const rows: StudentScoreRow[] = enrollments.map((item: any) => {
          const studentId = item.student?.id;
          const resItem = resultMap.get(studentId) as any;
          const marks = resItem ? resItem.marksObtained : "";
          return {
            studentId,
            rollNumber: item.student?.rollNumber || "N/A",
            fullName: item.student?.user?.fullName || "Student",
            marksObtained: marks,
            grade: resItem?.grade || (marks !== "" ? calculateGradePreview(Number(marks), res.data.totalMarks) : undefined),
            rank: resItem?.rank,
            isPassed: resItem?.isPassed,
          };
        });

        setScoresTable(rows);
      }
    } catch {
      toast.error("Failed to load exam evaluation details");
    } finally {
      setLoadingExamDetails(false);
    }
  };

  const handleScoreChange = (studentId: string, value: string) => {
    setScoresTable((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        const num = value === "" ? "" : Number(value);
        const grade =
          num !== "" && selectedExam
            ? calculateGradePreview(Number(num), Number(selectedExam.totalMarks))
            : undefined;
        const isPassed =
          num !== "" && selectedExam ? Number(num) >= Number(selectedExam.passMarks) : undefined;
        return {
          ...row,
          marksObtained: num,
          grade,
          isPassed,
        };
      })
    );
  };

  const handleSaveMarksheet = async () => {
    if (!selectedExam) return;

    // Filter filled rows
    const validScores: Array<{ studentId: string; marksObtained: number }> = [];
    const totalMarks = Number(selectedExam.totalMarks);

    for (const row of scoresTable) {
      if (row.marksObtained !== "" && !isNaN(Number(row.marksObtained))) {
        const val = Number(row.marksObtained);
        if (val < 0 || val > totalMarks) {
          toast.error(
            `Score for ${row.fullName} (${val}) exceeds exam total marks (${totalMarks})`
          );
          return;
        }
        validScores.push({ studentId: row.studentId, marksObtained: val });
      }
    }

    if (validScores.length === 0) {
      toast.error("Please enter marks for at least one student before saving");
      return;
    }

    try {
      setSavingScores(true);
      const res = await apiClient.post<any>(`/teacher/exams/${selectedExam.id}/marks`, {
        scores: validScores,
        publishImmediately,
      });

      if (res.success) {
        toast.success(
          `Evaluated ${validScores.length} students. Exam is ${publishImmediately ? "PUBLISHED" : "SAVED AS DRAFT"}`
        );
        setSelectedExam(null);
        fetchExams();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit marksheet evaluation");
    } finally {
      setSavingScores(false);
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setTogglingPublishId(examId);
      const newStatus = !currentStatus;
      const res = await apiClient.patch<any>(`/teacher/exams/${examId}/publish`, {
        isPublished: newStatus,
      });
      if (res.success) {
        toast.success(
          newStatus
            ? "Results published! Students and public portals can now view scores."
            : "Exam results unpublished and reverted to private draft."
        );
        setExams((prev) =>
          prev.map((item) => (item.id === examId ? { ...item, isPublished: newStatus } : item))
        );
        if (selectedExam && selectedExam.id === examId) {
          setSelectedExam((prev: any) => ({ ...prev, isPublished: newStatus }));
          setPublishImmediately(newStatus);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle publish status");
    } finally {
      setTogglingPublishId(null);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.batchId) {
      toast.error("Please select a target batch");
      return;
    }
    if (examForm.passMarks > examForm.totalMarks) {
      toast.error("Pass marks cannot be greater than total marks");
      return;
    }

    try {
      setCreatingExam(true);
      const res = await apiClient.post<any>("/teacher/exams", examForm);
      if (res.success) {
        toast.success("Exam created successfully! Now enter student marks.");
        setIsCreateModalOpen(false);
        setExamForm({
          batchId: batches[0]?.id || "",
          title: "",
          subject: "",
          examType: "WEEKLY",
          totalMarks: 50,
          passMarks: 20,
          examDate: new Date().toISOString().split("T")[0],
          instructions: "",
        });
        fetchExams();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create exam");
    } finally {
      setCreatingExam(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      exam.title.toLowerCase().includes(q) ||
      (exam.subject && exam.subject.toLowerCase().includes(q)) ||
      (exam.batch?.name && exam.batch.name.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && exam.isPublished) ||
      (statusFilter === "DRAFT" && !exam.isPublished);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Examination & Assessment Center
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Exams & Marksheet Grading
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Schedule quizzes and monthly tests, grade student scores with automated ranking, and toggle publishing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Schedule New Exam
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search exam title or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-text-muted font-bold">Status:</span>
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-bold rounded-sm border transition-colors ${
                statusFilter === status
                  ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                  : "bg-surface text-text-muted border-accent hover:text-text-main"
              }`}
            >
              {status === "ALL" ? "All Exams" : status === "PUBLISHED" ? "Published" : "Draft / Un-published"}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading exams...
          </div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <Award className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No examination records found</p>
          <p className="text-xs text-text-muted mt-1">
            Click "Schedule New Exam" above to create tests and grade marks for your cohorts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isToggling = togglingPublishId === exam.id;
            return (
              <div
                key={exam.id}
                className="bg-surface border border-accent rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs uppercase tracking-wider">
                      {exam.examType}
                    </span>
                    <button
                      onClick={(e) => handleTogglePublish(exam.id, exam.isPublished, e)}
                      disabled={isToggling}
                      title={exam.isPublished ? "Click to unpublish" : "Click to publish"}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 transition-colors ${
                        exam.isPublished
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : exam.isPublished ? (
                        <>
                          <Globe className="w-3 h-3" /> Published
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Draft / Private
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-main leading-tight">{exam.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Batch: {exam.batch?.name} {exam.subject ? `• ${exam.subject}` : ""}
                    </p>
                  </div>

                  <div className="bg-bg-app rounded-sm p-3 border border-accent/60 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-text-muted">Total</p>
                      <p className="font-bold text-text-main mt-0.5">{exam.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-text-muted">Pass</p>
                      <p className="font-bold text-text-main mt-0.5">{exam.passMarks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-text-muted">Evaluated</p>
                      <p className="font-bold text-brand-primary mt-0.5">
                        {exam._count?.results || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>Exam Date: {new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-accent flex items-center gap-2">
                  <button
                    onClick={() => handleOpenMarksheet(exam.id)}
                    className="flex-1 py-1.5 px-3 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Grade Marksheet
                  </button>
                  <button
                    onClick={(e) => handleTogglePublish(exam.id, exam.isPublished, e)}
                    disabled={isToggling}
                    className="py-1.5 px-3 bg-surface hover:bg-bg-app border border-accent text-text-main text-xs font-bold rounded-sm flex items-center gap-1"
                    title={exam.isPublished ? "Unpublish results" : "Publish results"}
                  >
                    {exam.isPublished ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5 text-brand-primary" />}
                    {exam.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule New Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-center justify-between bg-bg-app">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-primary" />
                <h2 className="text-sm sm:text-base font-bold text-text-main">Schedule New Examination</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Target Cohort / Batch *</label>
                <select
                  value={examForm.batchId}
                  onChange={(e) => setExamForm({ ...examForm, batchId: e.target.value })}
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-semibold"
                >
                  <option value="" disabled>Select cohort...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Exam Title *</label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="e.g. Physics Chapter 3 Assessment"
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Subject</label>
                  <input
                    type="text"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    placeholder="e.g. Physics"
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Exam Type</label>
                  <select
                    value={examForm.examType}
                    onChange={(e) => setExamForm({ ...examForm, examType: e.target.value as ExamTypeEnum })}
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  >
                    <option value="QUIZ">Quiz Test</option>
                    <option value="WEEKLY">Weekly Exam</option>
                    <option value="MONTHLY">Monthly Assessment</option>
                    <option value="TERM_FINAL">Term Final</option>
                    <option value="PRACTICE">Practice Test</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Total Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                    required
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Pass Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={examForm.passMarks}
                    onChange={(e) => setExamForm({ ...examForm, passMarks: Number(e.target.value) })}
                    required
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    required
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Instructions / Syllabus</label>
                <textarea
                  rows={2}
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  placeholder="Optional syllabus topics or guidelines for students..."
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div className="pt-3 border-t border-accent flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExam}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {creatingExam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marksheet Evaluation Drawer */}
      {(selectedExam || loadingExamDetails) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-accent flex items-start justify-between bg-bg-app shrink-0">
              {loadingExamDetails ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading marksheet...
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs uppercase tracking-wider">
                      {selectedExam?.examType}
                    </span>
                    <span className="text-xs text-text-muted">
                      Batch: {selectedExam?.batch?.name} • Total: {selectedExam?.totalMarks} Marks • Pass: {selectedExam?.passMarks} Marks
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-text-main">{selectedExam?.title}</h2>
                </div>
              )}
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingExamDetails ? (
                <div className="py-16 text-center text-xs text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-primary mb-2" />
                  Loading enrolled students...
                </div>
              ) : scoresTable.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted border border-dashed border-accent rounded-sm">
                  No active students enrolled in this batch to evaluate.
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <p className="text-xs text-text-muted">
                      Enter marks obtained for each student. Grades (A+ to F) and Pass/Fail are computed automatically.
                    </p>
                    <span className="text-xs font-bold text-text-main">
                      {scoresTable.filter((r) => r.marksObtained !== "").length} of {scoresTable.length} graded
                    </span>
                  </div>

                  <div className="border border-accent rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg-app border-b border-accent text-text-muted font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3 w-16">Roll</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3 w-40 text-center">Marks Obtained (Max: {selectedExam?.totalMarks})</th>
                          <th className="p-3 w-24 text-center">Grade</th>
                          <th className="p-3 w-28 text-center">Status</th>
                          <th className="p-3 w-20 text-center">Rank</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-accent">
                        {scoresTable.map((row) => (
                          <tr key={row.studentId} className="hover:bg-bg-app/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-text-main">
                              {row.rollNumber}
                            </td>
                            <td className="p-3 font-semibold text-text-main">
                              {row.fullName}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={selectedExam?.totalMarks}
                                value={row.marksObtained}
                                onChange={(e) => handleScoreChange(row.studentId, e.target.value)}
                                placeholder="Marks"
                                className="w-24 p-1.5 bg-bg-app border border-accent rounded-xs text-center font-bold text-xs text-text-main focus:outline-none focus:border-brand-primary"
                              />
                            </td>
                            <td className="p-3 text-center">
                              {row.grade ? (
                                <span
                                  className={`px-2 py-0.5 rounded-xs font-bold text-[11px] ${
                                    row.grade === "A+" || row.grade === "A"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : row.grade === "F"
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      : "bg-brand-primary/10 text-brand-primary"
                                  }`}
                                >
                                  {row.grade}
                                </span>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {row.isPassed !== undefined ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-xs ${
                                    row.isPassed
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  {row.isPassed ? "PASSED" : "FAILED"}
                                </span>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-text-muted">
                              {row.rank ? `#${row.rank}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-accent bg-bg-app flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-main">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="accent-brand-primary w-4 h-4 rounded-xs"
                />
                <span>Publish Immediately to Students & Public Portal</span>
              </label>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setSelectedExam(null)}
                  className="px-3.5 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMarksheet}
                  disabled={savingScores || scoresTable.length === 0}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {savingScores ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Evaluation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
