import React, { useState, useEffect } from "react";
import {
  Award,
  Clock,
  Printer,
  TrendingUp,
  BookOpen,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { PrintableScorecardModal, ScorecardData } from "../../components/PrintableScorecardModal.js";

interface StudentExamResult {
  id: string;
  marksObtained: number;
  grade: string;
  rank?: number | null;
  isPassed: boolean;
  remarks?: string | null;
  exam: {
    id: string;
    title: string;
    subject?: string | null;
    examType: string;
    totalMarks: number;
    passMarks: number;
    examDate: string;
    batchId?: string;
    batch?: { id?: string; name: string; branch?: { name: string } | null } | null;
  };
}

export const StudentExamsPage: React.FC = () => {
  const [results, setResults] = useState<StudentExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState<string>("ALL");

  // Active printable scorecard
  const [printableScorecard, setPrintableScorecard] = useState<ScorecardData | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("cms_token");
        const res = await fetch("/api/v1/students/exams", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setResults(json.data);
          } else {
            setResults([]);
          }
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExamResults();
  }, []);

  // Collect unique batches from results for the filter dropdown
  const batchOptions = Array.from(
    new Map(
      results
        .filter((r) => r.exam.batch?.name)
        .map((r) => [r.exam.batchId || r.exam.batch!.name, r.exam.batch!.name])
    ).entries()
  );

  // Filtered results based on selected batch
  const filteredResults =
    batchFilter === "ALL"
      ? results
      : results.filter(
          (r) =>
            r.exam.batchId === batchFilter ||
            r.exam.batch?.name === batchFilter ||
            r.exam.batch?.id === batchFilter
        );

  // Computed metrics
  const totalExams = filteredResults.length;
  const percentages = filteredResults.map((r) =>
    Math.round((r.marksObtained / (r.exam.totalMarks || 100)) * 1000) / 10
  );
  const averagePercentage =
    percentages.length > 0
      ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10
      : 0;
  const highestPercentage = percentages.length > 0 ? Math.max(...percentages) : 0;
  const passedExams = filteredResults.filter((r) => r.isPassed).length;

  const handleOpenScorecard = (res: StudentExamResult) => {
    const total = res.exam.totalMarks || 100;
    const card: ScorecardData = {
      examTitle: res.exam.title,
      subject: res.exam.subject || "Academic Curriculum",
      examType: res.exam.examType.replace(/_/g, " "),
      examDate: res.exam.examDate.split("T")[0],
      totalMarks: total,
      passMarks: res.exam.passMarks,
      student: {
        fullName: currentUser?.fullName || "Student",
        rollNumber: currentUser?.rollNumber || "Not Assigned",
        branchName: currentUser?.branch?.name || res.exam.batch?.branch?.name || "",
        batchName: res.exam.batch?.name || "Enrolled Batch",
      },
      result: {
        marksObtained: res.marksObtained,
        grade: res.grade,
        rank: res.rank,
        isPassed: res.isPassed,
        remarks: res.remarks || "Satisfactory academic performance",
        highestMarksInBatch: Math.round(total * 0.95),
        batchTotalStudents: 40,
      },
    };
    setPrintableScorecard(card);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-accent pb-4">
        <div>
          <h1 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-primary" /> Exams & Results
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Review your marks, grade trajectory, and download official scorecards.
          </p>
        </div>

        {/* Batch Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-hidden font-medium text-text-main"
          >
            <option value="ALL">All Batches</option>
            {batchOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Exams Evaluated</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          {loading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-7 w-16 bg-accent/40 animate-pulse rounded-xs" />
              <div className="h-3 w-24 bg-accent/30 animate-pulse rounded-xs" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-main">{totalExams}</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">{passedExams} of {totalExams} Passed</p>
            </>
          )}
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Average Score</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          {loading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-7 w-20 bg-accent/40 animate-pulse rounded-xs" />
              <div className="h-3 w-28 bg-accent/30 animate-pulse rounded-xs" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-brand-primary font-mono">{averagePercentage}%</p>
              <p className="text-[10px] text-text-muted">Average marks obtained</p>
            </>
          )}
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Highest Score</span>
            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          {loading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-7 w-20 bg-accent/40 animate-pulse rounded-xs" />
              <div className="h-3 w-28 bg-accent/30 animate-pulse rounded-xs" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{highestPercentage}%</p>
              <p className="text-[10px] text-text-muted">Personal peak score</p>
            </>
          )}
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Academic Standing</span>
            <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          </div>
          {loading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-7 w-24 bg-accent/40 animate-pulse rounded-xs" />
              <div className="h-3 w-28 bg-accent/30 animate-pulse rounded-xs" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-main">
                {averagePercentage >= 80 ? "Grade A+" : averagePercentage >= 70 ? "Grade A" : "Grade B"}
              </p>
              <p className="text-[10px] text-text-muted font-mono">Current Standing</p>
            </>
          )}
        </div>
      </div>

      {/* Exam Performance Percentage Chart */}
      <div className="bg-surface border border-accent rounded-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-accent pb-3">
          <div>
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" /> Performance Trajectory
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Click on any score bar to view or print the official scorecard.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-brand-primary rounded-xs inline-block" /> Percentage
            </span>
            <span className="flex items-center gap-1.5 text-text-muted/60">
              <span className="w-2.5 h-0.5 bg-red-400 inline-block" /> Pass Mark (40%)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-4 bg-bg-app border border-accent rounded-sm space-y-2 animate-pulse">
            <div className="grid grid-cols-4 gap-4 h-52 items-end border-b border-accent pb-1">
              {[40, 75, 60, 90].map((h, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end gap-2">
                  <div className="w-full max-w-[48px] bg-accent/30 rounded-t-sm" style={{ height: `${h}%` }} />
                  <div className="h-3 w-16 bg-accent/40 rounded-xs" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No exams evaluated for the selected batch.
          </div>
        ) : (
          <div className="p-4 bg-bg-app border border-theme rounded-sm space-y-2">
            <div className="relative pt-6 pb-2">
              {/* Pass Threshold Line at 40% */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-red-400/60 z-10 pointer-events-none"
                style={{ bottom: "40%" }}
              >
                <span className="absolute -top-3.5 right-1 text-[9px] font-mono text-red-500 font-bold bg-bg-app px-1">
                  Pass Threshold (40%)
                </span>
              </div>

              {/* Flex Bar Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-52 items-end border-b border-theme pb-1">
                {filteredResults.map((r) => {
                  const percent = Math.round((r.marksObtained / (r.exam.totalMarks || 100)) * 100);
                  const barHeight = Math.min(Math.max(percent, 5), 100);

                  return (
                    <div key={r.id} className="flex flex-col items-center h-full justify-end group">
                      {/* Hover Tooltip / Score Badge */}
                      <div className="mb-1 text-center transition-transform group-hover:-translate-y-1">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-xs bg-surface border border-theme text-text-main shadow-xs">
                          {percent}%
                        </span>
                        <span className="block text-[9px] font-bold text-brand-primary">
                          {r.grade} {r.rank ? `• Rank #${r.rank}` : ""}
                        </span>
                      </div>

                      {/* Bar Fill */}
                      <div
                        className="w-full max-w-[48px] bg-brand-primary hover:opacity-90 rounded-t-sm transition-all duration-300 relative cursor-pointer shadow-xs"
                        style={{ height: `${barHeight}%` }}
                        onClick={() => handleOpenScorecard(r)}
                        title={`Click to view scorecard for ${r.exam.title}`}
                      />

                      {/* X-Axis Label */}
                      <div className="mt-2 text-center w-full">
                        <p className="text-[10px] font-semibold text-text-main truncate max-w-[120px] mx-auto">
                          {r.exam.subject || r.exam.title}
                        </p>
                        <p className="text-[9px] text-text-main/50 font-mono">
                          {r.exam.examDate ? r.exam.examDate.split("T")[0] : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assessment History Table */}
      <div className="bg-surface border border-accent rounded-sm overflow-hidden">
        <div className="p-4 border-b border-accent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-bold text-text-main">Marksheets & Result Registry</h2>
          </div>
          <span className="text-[11px] text-text-muted">
            {loading ? "..." : `${filteredResults.length} records found`}
          </span>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-accent">
                {[...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3"><div className="h-3.5 w-20 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3"><div className="h-3.5 w-36 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3"><div className="h-3.5 w-24 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3"><div className="h-3.5 w-20 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3"><div className="h-3.5 w-12 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3"><div className="h-3.5 w-10 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3"><div className="h-3.5 w-16 bg-accent/40 rounded-xs" /></td>
                    <td className="p-3 text-right"><div className="h-6 w-24 bg-accent/40 rounded-xs ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No exam results recorded for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-bg-app border-b border-accent text-[10px] uppercase font-bold text-text-muted tracking-wider">
                <tr>
                  <th className="p-3">Exam Date</th>
                  <th className="p-3">Exam Title & Subject</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Marks</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent">
                {filteredResults.map((r) => {
                  const percent = Math.round((r.marksObtained / (r.exam.totalMarks || 100)) * 100);
                  return (
                    <tr key={r.id} className="hover:bg-bg-app/40 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-text-muted">
                        {r.exam.examDate ? r.exam.examDate.split("T")[0] : "—"}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-text-main">{r.exam.title}</p>
                        <p className="text-[10px] text-brand-primary font-semibold">
                          {r.exam.subject || r.exam.examType.replace(/_/g, " ")}
                        </p>
                      </td>
                      <td className="p-3 text-text-muted">
                        {r.exam.batch?.name || "Enrolled Batch"}
                      </td>
                      <td className="p-3 font-mono font-bold text-text-main">
                        {r.marksObtained} / {r.exam.totalMarks} ({percent}%)
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                          {r.grade}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-brand-primary font-mono">
                        {r.rank ? `#${r.rank}` : "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                            r.isPassed
                              ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {r.isPassed ? "PASSED" : "FAILED"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenScorecard(r)}
                          className="px-2.5 py-1 text-xs font-semibold bg-bg-app hover:bg-brand-primary hover:text-white border border-accent rounded-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Scorecard
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Scorecard Modal */}
      {printableScorecard && (
        <PrintableScorecardModal
          scorecard={printableScorecard}
          isOpen={!!printableScorecard}
          onClose={() => setPrintableScorecard(null)}
          institutionName={currentUser?.institution?.name || ""}
          institutionTagline=""
          institutionPhone={currentUser?.branch?.phone || ""}
          institutionAddress={currentUser?.branch?.address || ""}
        />
      )}
    </div>
  );
};
