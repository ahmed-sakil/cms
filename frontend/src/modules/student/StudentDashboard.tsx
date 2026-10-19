import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  AlertTriangle,
  X,
  ChevronRight,
  Filter,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { StudentIdCardModal } from "../../components/StudentIdCardModal.js";

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  pinned: boolean;
  publishedAt: string;
  attachmentUrl?: string | null;
}

interface BatchInfo {
  id: string;
  name: string;
  courseName: string;
  teacherName: string;
  room: string;
  schedule: string;
  progress: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  batchId: string;
  batchName: string;
  remarks?: string | null;
}

export const StudentDashboard: React.FC = () => {
  const [showIdCard, setShowIdCard] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  // Filter state for attendance
  const [attendanceBatchFilter, setAttendanceBatchFilter] = useState<string>("ALL");

  // User profile & enrolled data
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("cms_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/v1/students/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setStudentProfile(json.data);
        if (json.data.notices?.length) {
          setNotices(json.data.notices);
        }
        if (json.data.enrollments?.length) {
          const mappedBatches: BatchInfo[] = json.data.enrollments.map((e: any) => ({
            id: e.batch.id,
            name: e.batch.name,
            courseName: e.batch.course?.name || "Academic Program",
            teacherName: e.batch.teacher?.user?.fullName || "Assigned Faculty",
            room: e.batch.room || "Campus Classroom",
            schedule: e.batch.schedule || "Scheduled Classes",
            progress: "100%",
          }));
          setBatches(mappedBatches);
        } else {
          setBatches([]);
        }
        if (json.data.attendances?.length) {
          const mappedAtt: AttendanceRecord[] = json.data.attendances.map((a: any) => ({
            id: a.id,
            date: a.date.split("T")[0],
            status: a.status,
            batchId: a.batchId,
            batchName: a.batch?.name || "Enrolled Batch",
            remarks: a.remarks,
          }));
          setAttendances(mappedAtt);
        } else {
          setAttendances([]);
        }
      } else {
        setError(json.message || "Failed to retrieve student dashboard data.");
      }
    } catch {
      setError("Network error: Unable to connect to student records server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filtered attendances based on selected batch
  const filteredAttendances =
    attendanceBatchFilter === "ALL"
      ? attendances
      : attendances.filter((a) => a.batchId === attendanceBatchFilter);

  // Compute attendance stats
  const totalClasses = filteredAttendances.length;
  const attendedCount = filteredAttendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendancePercentage =
    totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 100;

  const urgentNotice = notices.find((n) => n.priority === "URGENT" || n.priority === "HIGH");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-surface border border-theme rounded-sm p-6 space-y-3 animate-pulse">
          <div className="h-3 w-32 bg-accent rounded-xs" />
          <div className="h-6 w-72 bg-accent rounded-xs" />
          <div className="h-4 w-96 bg-accent rounded-xs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 animate-pulse">
            <div className="h-4 w-40 bg-accent rounded-xs" />
            <div className="h-5 w-60 bg-accent rounded-xs" />
            <div className="h-10 bg-accent/40 rounded-xs" />
          </div>
          <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 animate-pulse">
            <div className="h-4 w-40 bg-accent rounded-xs" />
            <div className="h-5 w-60 bg-accent rounded-xs" />
            <div className="h-10 bg-accent/40 rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !studentProfile) {
    return (
      <div className="bg-surface border border-theme rounded-sm p-8 text-center space-y-4 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-text-main">Unable to Load Academic Records</h2>
        <p className="text-xs text-text-main/60 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Urgent Notice Alert Banner */}
      {urgentNotice && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 rounded-sm p-3.5 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-red-600 text-white rounded-xs">
                  {urgentNotice.priority} Notice
                </span>
                <span className="text-xs font-bold text-red-900 dark:text-red-200">
                  {urgentNotice.title}
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 line-clamp-1">
                {urgentNotice.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedNotice(urgentNotice)}
            className="text-xs font-semibold text-red-700 dark:text-red-300 underline hover:text-red-900 shrink-0"
          >
            Read Notice
          </button>
        </div>
      )}

      {/* Meaningful Academic Status Bar (Replaces generic Welcome banner) */}
      <div className="bg-surface border border-theme rounded-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary">
            Academic Status Overview
          </span>
          <h1 className="text-lg font-bold text-text-main">
            Enrolled Batches & Classroom Attendance
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-main/60 pt-0.5">
            <span className="font-mono bg-bg-app border border-theme px-2 py-0.5 rounded-xs font-bold text-text-main">
              Roll: {studentProfile?.rollNumber || "Not Assigned"}
            </span>
            <span>•</span>
            <span>Campus: <strong>{studentProfile?.user?.branch?.name || "Unassigned Campus"}</strong></span>
            <span>•</span>
            <span>Class: <strong>{studentProfile?.currentClass || "Not Specified"}</strong></span>
            <span>•</span>
            <span>Active Batches: <strong className="text-brand-primary">{batches.length}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowIdCard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white hover:opacity-90 rounded-sm transition-opacity shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" /> View Digital ID Card
          </button>
          <button
            onClick={() => toast.success("Downloading Exam Routine & Syllabus PDF")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-bg-app hover:bg-surface border border-theme rounded-sm text-text-main transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-brand-primary" /> Class Routine
          </button>
        </div>
      </div>

      {/* Enrolled Batches Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-primary" /> Active Enrolled Batches ({batches.length})
          </h2>
          <span className="text-[11px] text-text-main/50">Current Academic Term</span>
        </div>

        {batches.length === 0 ? (
          <div className="bg-surface border border-theme rounded-sm p-8 text-center space-y-2">
            <BookOpen className="w-7 h-7 text-text-main/30 mx-auto" />
            <p className="text-sm font-bold text-text-main">No Active Enrolled Batches</p>
            <p className="text-xs text-text-main/50 max-w-sm mx-auto">
              You are currently not assigned to any batches. Please contact the campus administration or register for your academic courses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs hover:border-brand-primary transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                      {batch.courseName}
                    </span>
                    <h3 className="text-sm font-bold text-text-main mt-0.5">{batch.name}</h3>
                    <p className="text-xs text-text-main/60 mt-0.5">Faculty: <strong>{batch.teacherName}</strong></p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs">
                    Active
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-text-main/70 pt-2 border-t border-theme">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{batch.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{batch.room}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs border-t border-theme">
                  <span className="text-text-main/60">
                    Syllabus Covered: <strong className="text-text-main font-bold">{batch.progress}</strong>
                  </span>
                  <Link
                    to="/student/materials"
                    className="px-2.5 py-1 bg-bg-app hover:bg-brand-primary hover:text-white border border-theme rounded-sm font-semibold transition-colors flex items-center gap-1"
                  >
                    Lecture Notes <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch Attendance Tracker */}
      <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-theme pb-4">
          <div>
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-brand-primary" /> Batch Attendance Tracker
            </h2>
            <p className="text-xs text-text-main/60 mt-0.5">
              Select an enrolled batch to audit your physical classroom presence.
            </p>
          </div>

          {/* Batch Selector Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-text-main/40 shrink-0" />
            <select
              value={attendanceBatchFilter}
              onChange={(e) => setAttendanceBatchFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:border-brand-primary outline-none font-semibold text-text-main"
            >
              <option value="ALL">All Batches (Consolidated)</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-bg-app border border-theme rounded-sm space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-text-main/50">Total Classes</span>
            <p className="text-xl font-black text-text-main">{totalClasses}</p>
          </div>
          <div className="p-3 bg-bg-app border border-theme rounded-sm space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-text-main/50">Attended</span>
            <p className="text-xl font-black text-green-600">{attendedCount}</p>
          </div>
          <div className="p-3 bg-bg-app border border-theme rounded-sm space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-text-main/50">Missed / Absent</span>
            <p className="text-xl font-black text-red-600">{totalClasses - attendedCount}</p>
          </div>
          <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-sm space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-brand-primary">Attendance Ratio</span>
            <p className="text-xl font-black text-brand-primary font-mono">{attendancePercentage}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-text-main/60">
            <span>Minimum Requirement: 75% for Board Exam Clearance</span>
            <span className="font-bold text-text-main">{attendancePercentage}% Attained</span>
          </div>
          <div className="w-full h-2 bg-bg-app rounded-xs overflow-hidden border border-theme">
            <div
              className={`h-full transition-all duration-500 ${
                attendancePercentage >= 75 ? "bg-green-600" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Attendance Log Table */}
        {filteredAttendances.length === 0 ? (
          <div className="border border-theme rounded-sm p-8 text-center space-y-2 bg-bg-app/30">
            <CalendarCheck className="w-7 h-7 text-text-main/30 mx-auto" />
            <p className="text-sm font-bold text-text-main">No Attendance Records Found</p>
            <p className="text-xs text-text-main/50 max-w-sm mx-auto">
              Physical classroom attendance logs will appear here as your lectures and workshops commence.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-theme rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-bg-app border-b border-theme text-[10px] uppercase font-bold text-text-main/60">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Batch</th>
                  <th className="p-2.5">Attendance Status</th>
                  <th className="p-2.5">Remarks / Topic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-bg-app/50 transition-colors">
                    <td className="p-2.5 font-mono text-[11px] text-text-main/70">{att.date}</td>
                    <td className="p-2.5 font-semibold text-text-main">{att.batchName}</td>
                    <td className="p-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                          att.status === "PRESENT"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                            : att.status === "LATE"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-text-main/60">{att.remarks || "Regular session"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Shortcut Banner to Exam Scores */}
        <div className="pt-2 flex justify-between items-center text-xs">
          <span className="text-text-main/60">
            Looking for your past exam results and percentage analytics?
          </span>
          <Link
            to="/student/exams"
            className="font-semibold text-brand-primary hover:underline flex items-center gap-1"
          >
            <Award className="w-3.5 h-3.5" /> View Exam Scores & Performance Chart →
          </Link>
        </div>
      </div>

      {/* Official ID Card Modal */}
      {showIdCard && (
        <StudentIdCardModal
          isOpen={showIdCard}
          onClose={() => setShowIdCard(false)}
          student={{
            id: studentProfile?.id || "std-me",
            fullName: studentProfile?.user?.fullName || currentUser?.fullName || "Student",
            rollNumber: studentProfile?.rollNumber || "Not Assigned",
            email: studentProfile?.user?.email || currentUser?.email || "",
            phone: studentProfile?.user?.phone || "",
            branchName: studentProfile?.user?.branch?.name || "",
            courseName: batches[0]?.courseName || "Academic Curriculum",
            batchName: batches[0]?.name || "General Batch",
            academicYear: "2026-2027",
            bloodGroup: studentProfile?.bloodGroup || "",
            guardianName: studentProfile?.guardianName || studentProfile?.fatherName || "",
            guardianPhone: studentProfile?.guardianPhone || "",
          }}
          institutionName={studentProfile?.user?.institution?.name || currentUser?.institution?.name || ""}
          institutionTagline=""
          institutionPhone={studentProfile?.user?.branch?.phone || ""}
          institutionAddress={studentProfile?.user?.branch?.address || ""}
        />
      )}

      {/* Read Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${
                      selectedNotice.priority === "URGENT"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                        : "bg-bg-app text-text-main/60 border border-theme"
                    }`}
                  >
                    {selectedNotice.priority}
                  </span>
                  <span className="text-[11px] text-text-main/50 font-mono">
                    {new Date(selectedNotice.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-main">{selectedNotice.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 hover:bg-bg-app rounded-sm text-text-main/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-text-main/90 leading-relaxed whitespace-pre-wrap bg-bg-app p-4 rounded-sm border border-theme">
              {selectedNotice.content}
            </div>

            {selectedNotice.attachmentUrl && (
              <div className="flex justify-end pt-1">
                <a
                  href={selectedNotice.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-90 transition-opacity"
                >
                  Download Circular Attachment
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
