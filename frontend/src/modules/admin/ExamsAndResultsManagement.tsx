import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  Save,
  Printer,
  X,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { PrintableScorecardModal, ScorecardData } from "../../components/PrintableScorecardModal.js";

interface ExamItem {
  id: string;
  title: string;
  subject?: string | null;
  examType: string;
  totalMarks: number;
  passMarks: number;
  examDate: string;
  instructions?: string | null;
  batch: {
    id: string;
    name: string;
    course?: { name: string } | null;
    branch?: { name: string } | null;
    _count?: { enrollments: number };
  };
  _count?: { results: number };
}

interface ExamDetail extends ExamItem {
  batch: {
    id: string;
    name: string;
    course?: { name: string } | null;
    branch?: { name: string } | null;
    enrollments: {
      student: {
        id: string;
        rollNumber: string;
        user: { fullName: string; email: string };
      };
    }[];
  };
  results: {
    id: string;
    studentId: string;
    marksObtained: number;
    grade: string;
    rank?: number | null;
    isPassed: boolean;
    remarks?: string | null;
    student: {
      rollNumber: string;
      user: { fullName: string };
    };
  }[];
}

export const ExamsAndResultsManagement: React.FC = () => {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    batchId: "",
    title: "",
    subject: "",
    examType: "MOCK_TEST",
    totalMarks: 100,
    passMarks: 40,
    examDate: new Date().toISOString().split("T")[0],
    instructions: "",
  });

  // Marksheet Entry Drawer State
  const [activeMarksheetExam, setActiveMarksheetExam] = useState<ExamDetail | null>(null);
  const [marksheetScores, setMarksheetScores] = useState<
    Record<string, { marks: number; remarks: string }>
  >({});
  const [savingMarks, setSavingMarks] = useState(false);

  // Scorecard modal
  const [printableScorecard, setPrintableScorecard] = useState<ScorecardData | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("cms_token");
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [eRes, bRes] = await Promise.all([
        fetch("/api/v1/ops/exams", { headers }),
        fetch("/api/v1/academics/batches", { headers }),
      ]);

      const [eJson, bJson] = await Promise.all([eRes.json(), bRes.json()]);

      if (eJson.success && Array.isArray(eJson.data)) setExams(eJson.data);
      if (bJson.success && Array.isArray(bJson.data)) setBatches(bJson.data);
    } catch {
      toast.error("Failed to load exams list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.batchId) {
      toast.error("Please select a target batch");
      return;
    }
    if (!examForm.title.trim()) {
      toast.error("Exam title is required");
      return;
    }

    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/ops/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(examForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create exam");
      }

      toast.success("Exam scheduled successfully!");
      setIsCreateModalOpen(false);
      setExamForm({
        batchId: "",
        title: "",
        subject: "",
        examType: "MOCK_TEST",
        totalMarks: 100,
        passMarks: 40,
        examDate: new Date().toISOString().split("T")[0],
        instructions: "",
      });
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || "Error scheduling exam");
    }
  };

  const openMarksheet = async (examId: string) => {
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch(`/api/v1/ops/exams/${examId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (!json.success || !json.data) throw new Error("Failed to load exam details");

      const detail: ExamDetail = json.data;
      setActiveMarksheetExam(detail);

      // Initialize marks from existing results or default 0
      const initial: Record<string, { marks: number; remarks: string }> = {};
      const enrolled = detail.batch.enrollments || [];

      for (const en of enrolled) {
        const studentId = en.student.id;
        const existingResult = detail.results?.find((r) => r.studentId === studentId);
        initial[studentId] = {
          marks: existingResult ? Number(existingResult.marksObtained) : 0,
          remarks: existingResult?.remarks || "",
        };
      }

      setMarksheetScores(initial);
    } catch (err: any) {
      toast.error(err.message || "Error loading marksheet");
    }
  };

  const handleSaveMarks = async () => {
    if (!activeMarksheetExam) return;

    try {
      setSavingMarks(true);
      const token = localStorage.getItem("cms_token");

      const scores = Object.entries(marksheetScores).map(([studentId, data]) => ({
        studentId,
        marksObtained: Number(data.marks),
        remarks: data.remarks || undefined,
      }));

      const res = await fetch(`/api/v1/ops/exams/${activeMarksheetExam.id}/marks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ scores }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(json.message || "Marks calculated and merit ranks assigned!");
      openMarksheet(activeMarksheetExam.id);
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || "Failed to save marksheet");
    } finally {
      setSavingMarks(false);
    }
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to cancel exam "${title}"?`)) return;

    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch(`/api/v1/ops/exams/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Exam cancelled");
        setExams((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  const calculateLiveGrade = (marks: number, total: number) => {
    const percentage = (marks / total) * 100;
    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "A-";
    if (percentage >= 50) return "B";
    if (percentage >= 40) return "C";
    if (percentage >= 33) return "D";
    return "F";
  };

  const filteredExams = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject && e.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-primary" /> Exams, Marksheets & Merit Ranking
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Schedule mock tests, record student marks with auto-grading, and print official report cards.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Schedule New Exam
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold">Total Assessments</span>
            <Award className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{exams.length}</p>
          <p className="text-[10px] text-text-muted">Mock tests, quizzes & model exams</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-green-700">Results Evaluated</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-700">
            {exams.reduce((acc, e) => acc + (e._count?.results || 0), 0)}
          </p>
          <p className="text-[10px] text-green-600 font-medium">Graded scorecards</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-brand-primary">Active Batches Covered</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-brand-primary">{batches.length}</p>
          <p className="text-[10px] text-text-muted">Curriculum testing cycles</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search exam title, subject, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Exam Title</th>
                <th className="py-2.5 px-4">Subject / Type</th>
                <th className="py-2.5 px-4">Batch & Campus</th>
                <th className="py-2.5 px-4 text-center">Marks (Total/Pass)</th>
                <th className="py-2.5 px-4">Exam Date</th>
                <th className="py-2.5 px-4 text-center">Evaluated</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                    Loading exams...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">
                    No scheduled exams found. Create an exam to begin marks recording.
                  </td>
                </tr>
              ) : (
                filteredExams.map((e) => (
                  <tr key={e.id} className="hover:bg-accent-subtle/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-text-main">{e.title}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-main">{e.subject || "General Topic"}</p>
                      <span className="text-[10px] font-mono text-brand-primary uppercase">
                        {e.examType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-main">{e.batch.name}</p>
                      <p className="text-[11px] text-text-muted">
                        {e.batch.branch?.name || "All Branches"}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {e.totalMarks} / {e.passMarks}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {new Date(e.examDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-xs text-brand-primary">
                        {e._count?.results || 0}
                      </span>{" "}
                      <span className="text-[11px] text-text-muted">students</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openMarksheet(e.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Marksheet
                      </button>
                      <button
                        onClick={() => handleDeleteExam(e.id, e.title)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors"
                        title="Delete exam"
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

      {/* Marksheet Drawer / Modal */}
      {activeMarksheetExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-text-main flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-primary" /> Marksheet:{" "}
                  {activeMarksheetExam.title}
                </h3>
                <p className="text-xs text-text-muted">
                  Batch: {activeMarksheetExam.batch.name} • Total Marks:{" "}
                  <span className="font-bold font-mono">{activeMarksheetExam.totalMarks}</span> (Pass:{" "}
                  <span className="font-bold font-mono">{activeMarksheetExam.passMarks}</span>)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveMarks}
                  disabled={savingMarks}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {savingMarks ? "Saving..." : "Save & Rank Class"}
                </button>
                <button
                  onClick={() => setActiveMarksheetExam(null)}
                  className="p-1 text-text-muted hover:text-text-main"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Students Marks Input Table */}
            <div className="border border-accent rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Roll</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4 w-32">Marks (/{activeMarksheetExam.totalMarks})</th>
                    <th className="py-2.5 px-4 text-center">Grade</th>
                    <th className="py-2.5 px-4 text-center">Rank</th>
                    <th className="py-2.5 px-4">Remarks</th>
                    <th className="py-2.5 px-4 text-right">Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent">
                  {(!activeMarksheetExam.batch.enrollments ||
                    activeMarksheetExam.batch.enrollments.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted">
                        No active students enrolled in this batch. Enroll students to enter marks.
                      </td>
                    </tr>
                  ) : (
                    activeMarksheetExam.batch.enrollments.map((en) => {
                      const studentId = en.student.id;
                      const currentScore = marksheetScores[studentId]?.marks || 0;
                      const liveGrade = calculateLiveGrade(
                        currentScore,
                        Number(activeMarksheetExam.totalMarks)
                      );
                      const isPassing = currentScore >= Number(activeMarksheetExam.passMarks);
                      const existingResult = activeMarksheetExam.results?.find(
                        (r) => r.studentId === studentId
                      );

                      return (
                        <tr key={studentId} className="hover:bg-accent-subtle/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-text-main">
                            {en.student.rollNumber}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-text-main">
                            {en.student.user.fullName}
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="number"
                              min={0}
                              max={Number(activeMarksheetExam.totalMarks)}
                              value={marksheetScores[studentId]?.marks ?? 0}
                              onChange={(e) =>
                                setMarksheetScores({
                                  ...marksheetScores,
                                  [studentId]: {
                                    marks: Number(e.target.value),
                                    remarks: marksheetScores[studentId]?.remarks || "",
                                  },
                                })
                              }
                              className="w-24 px-2 py-1 bg-bg-app border border-accent rounded-sm text-xs font-mono font-bold text-text-main focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 font-bold rounded-xs text-[10px] ${
                                isPassing
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                              }`}
                            >
                              {liveGrade}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-brand-primary">
                            {existingResult?.rank ? `#${existingResult.rank}` : "-"}
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              placeholder="e.g. Good grasp of concepts"
                              value={marksheetScores[studentId]?.remarks || ""}
                              onChange={(e) =>
                                setMarksheetScores({
                                  ...marksheetScores,
                                  [studentId]: {
                                    marks: marksheetScores[studentId]?.marks || 0,
                                    remarks: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-2 py-1 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {existingResult && (
                              <button
                                onClick={() =>
                                  setPrintableScorecard({
                                    examTitle: activeMarksheetExam.title,
                                    subject: activeMarksheetExam.subject,
                                    examType: activeMarksheetExam.examType,
                                    examDate: activeMarksheetExam.examDate,
                                    totalMarks: Number(activeMarksheetExam.totalMarks),
                                    passMarks: Number(activeMarksheetExam.passMarks),
                                    student: {
                                      fullName: en.student.user.fullName,
                                      rollNumber: en.student.rollNumber,
                                      branchName: activeMarksheetExam.batch.branch?.name,
                                      batchName: activeMarksheetExam.batch.name,
                                    },
                                    result: {
                                      marksObtained: Number(existingResult.marksObtained),
                                      grade: existingResult.grade,
                                      rank: existingResult.rank,
                                      isPassed: existingResult.isPassed,
                                      remarks: existingResult.remarks,
                                      highestMarksInBatch: Math.max(
                                        ...activeMarksheetExam.results.map((r) =>
                                          Number(r.marksObtained)
                                        )
                                      ),
                                      batchTotalStudents:
                                        activeMarksheetExam.batch.enrollments.length,
                                    },
                                  })
                                }
                                className="p-1 hover:text-brand-primary transition-colors"
                                title="Print student report card"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-primary" /> Schedule Assessment / Mock Test
                </h3>
                <p className="text-xs text-text-muted">
                  Set up a test for your students and assign full marks.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Batch *</label>
                <select
                  required
                  value={examForm.batchId}
                  onChange={(e) => setExamForm({ ...examForm, batchId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-semibold"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vector Calculus Model Test 01"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Subject / Module</label>
                  <input
                    type="text"
                    placeholder="e.g. Higher Math 1st Paper"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Exam Format</label>
                  <select
                    value={examForm.examType}
                    onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main font-medium"
                  >
                    <option value="MOCK_TEST">Mock Test</option>
                    <option value="WEEKLY_QUIZ">Weekly Quiz</option>
                    <option value="MONTHLY_ASSESSMENT">Monthly Assessment</option>
                    <option value="TERM_FINAL">Term Final Exam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Marks *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={examForm.totalMarks}
                    onChange={(e) =>
                      setExamForm({ ...examForm, totalMarks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm font-mono font-bold text-text-main"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Pass Marks *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={examForm.passMarks}
                    onChange={(e) =>
                      setExamForm({ ...examForm, passMarks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm font-mono text-text-main"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-accent flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Scorecard Modal */}
      {printableScorecard && (
        <PrintableScorecardModal
          isOpen={!!printableScorecard}
          onClose={() => setPrintableScorecard(null)}
          scorecard={printableScorecard}
        />
      )}
    </div>
  );
};
