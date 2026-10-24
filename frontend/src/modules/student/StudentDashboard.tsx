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
  Award,
  Receipt,
  Bell,
  ArrowRight,
  User,
} from "lucide-react";
import { StudentIdCardModal } from "../../components/StudentIdCardModal.js";

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  priority?: string;
  pinned: boolean;
  publishedAt: string;
  attachmentUrl?: string | null;
  branch?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  author?: { fullName: string } | null;
}

interface BatchInfo {
  id: string;
  name: string;
  courseName: string;
  teacherName: string;
  room: string;
  schedule: string;
}

export const StudentDashboard: React.FC = () => {
  const [showIdCard, setShowIdCard] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
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
            courseName: e.batch.course?.name || "Academic Course",
            teacherName: e.batch.teacher?.user?.fullName || "Assigned Teacher",
            room: e.batch.classroom || "Main Classroom",
            schedule: e.batch.classTime || e.batch.scheduleTime || "Scheduled Timing",
          }));
          setBatches(mappedBatches);
        }

        if (json.data.examResults?.length) {
          setRecentExams(json.data.examResults);
        }

        if (json.data.attendances?.length) {
          const total = json.data.attendances.length;
          const present = json.data.attendances.filter(
            (a: any) => a.status === "PRESENT" || a.status === "LATE"
          ).length;
          setAttendanceRate(total > 0 ? Math.round((present / total) * 100) : 100);
        }
      } else {
        setError(json.message || "Failed to load academic records");
      }
    } catch {
      setError("Unable to reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !studentProfile) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-surface border border-accent rounded-sm" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface border border-accent rounded-sm" />
          ))}
        </div>
        <div className="h-64 bg-surface border border-accent rounded-sm" />
      </div>
    );
  }

  if (error && !studentProfile) {
    return (
      <div className="bg-surface border border-accent rounded-sm p-8 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-text-main">Unable to Load Academic Records</h2>
        <p className="text-xs text-text-muted max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Bar (Mobile-friendly 1-tap shortcuts) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Link
          to="/student/attendance"
          className="flex flex-col items-center justify-center p-3 rounded-sm bg-surface border border-accent hover:border-brand-primary transition-colors text-center group cursor-pointer"
        >
          <CalendarCheck className="w-4 h-4 text-brand-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-main">Attendance</span>
        </Link>

        <Link
          to="/student/exams"
          className="flex flex-col items-center justify-center p-3 rounded-sm bg-surface border border-accent hover:border-brand-primary transition-colors text-center group cursor-pointer"
        >
          <Award className="w-4 h-4 text-brand-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-main">Exam Scores</span>
        </Link>

        <Link
          to="/student/fees"
          className="flex flex-col items-center justify-center p-3 rounded-sm bg-surface border border-accent hover:border-brand-primary transition-colors text-center group cursor-pointer"
        >
          <Receipt className="w-4 h-4 text-brand-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-main">Fee Invoices</span>
        </Link>

        <Link
          to="/student/materials"
          className="flex flex-col items-center justify-center p-3 rounded-sm bg-surface border border-accent hover:border-brand-primary transition-colors text-center group cursor-pointer"
        >
          <FileText className="w-4 h-4 text-brand-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-main">Study Notes</span>
        </Link>

        <Link
          to="/student/notices"
          className="flex flex-col items-center justify-center p-3 rounded-sm bg-surface border border-accent hover:border-brand-primary transition-colors text-center group cursor-pointer"
        >
          <Bell className="w-4 h-4 text-brand-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-main">Notices</span>
        </Link>

        <button
          onClick={() => setShowIdCard(true)}
          className="flex flex-col items-center justify-center p-3 rounded-sm bg-surface border border-accent hover:border-brand-primary transition-colors text-center group cursor-pointer"
        >
          <CreditCard className="w-4 h-4 text-brand-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-main">Digital ID</span>
        </button>
      </div>

      {/* Student Academic Status Card */}
      <div className="bg-surface border border-accent rounded-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-main truncate">
              {studentProfile?.user?.fullName || currentUser?.fullName || "Student Member"}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 rounded-xs uppercase tracking-wider">
              Enrolled
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted pt-0.5">
            <span className="font-mono bg-bg-app border border-accent px-2 py-0.5 rounded-xs font-bold text-text-main">
              Roll: {studentProfile?.rollNumber || "Not Assigned"}
            </span>
            <span>•</span>
            <span>Campus: <strong className="text-text-main">{studentProfile?.user?.branch?.name || "Main Campus"}</strong></span>
            <span>•</span>
            <span>Class: <strong className="text-text-main">{studentProfile?.currentClass || "General"}</strong></span>
          </div>
        </div>

        <button
          onClick={() => setShowIdCard(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white hover:opacity-90 rounded-sm transition-opacity shrink-0 cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" /> View Digital ID
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Batches */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Batches</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-text-main">{batches.length}</p>
          <p className="text-[10px] text-text-muted">Enrolled courses</p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
            <CalendarCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-text-main">{attendanceRate}%</p>
          <p className="text-[10px] text-text-muted">Physical presence rate</p>
        </div>

        {/* Recent Exams */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Evaluated Exams</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-text-main">{recentExams.length}</p>
          <p className="text-[10px] text-text-muted">Published scorecards</p>
        </div>

        {/* Notices */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Notices</span>
            <Bell className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-text-main">{notices.length}</p>
          <p className="text-[10px] text-text-muted">Active announcements</p>
        </div>
      </div>

      {/* Enrolled Batches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-primary" />
            My Enrolled Batches ({batches.length})
          </h2>
          <span className="text-[11px] text-text-muted">Current Academic Term</span>
        </div>

        {batches.length === 0 ? (
          <div className="bg-surface border border-accent rounded-sm p-8 text-center space-y-2">
            <BookOpen className="w-7 h-7 text-text-muted/40 mx-auto" />
            <p className="text-sm font-bold text-text-main">No Active Enrolled Batches</p>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              You are currently not assigned to any batches. Please contact your campus administration.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-surface border border-accent rounded-sm p-5 space-y-3 hover:border-brand-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-main">{batch.name}</h3>
                    <p className="text-xs text-text-muted font-medium mt-0.5">
                      {batch.courseName}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase tracking-wider shrink-0">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-accent grid grid-cols-2 gap-2 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="truncate">{batch.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="truncate">{batch.room}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="truncate">{batch.schedule}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    to="/student/attendance"
                    className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    Attendance Record <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/student/materials"
                    className="text-xs font-semibold text-text-muted hover:text-text-main flex items-center gap-1"
                  >
                    Study Materials <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campus & Batch Notices */}
      <div className="bg-surface border border-accent rounded-sm p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-accent pb-2">
          <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-brand-primary" /> Campus & Batch Notices
          </h2>
          <Link to="/student/notices" className="text-[11px] text-brand-primary hover:underline font-semibold">
            View All ({notices.length})
          </Link>
        </div>

        {notices.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">No active notices.</p>
        ) : (
          <div className="space-y-2.5">
            {notices.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotice(n)}
                className="text-xs space-y-1 border-b border-accent/50 pb-2.5 last:border-none last:pb-0 cursor-pointer hover:bg-bg-app/40 p-1.5 rounded-xs transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {n.pinned && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-primary/10 text-brand-primary rounded-xs">
                        Pinned
                      </span>
                    )}
                    <span className="font-semibold text-text-main line-clamp-1">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0 font-mono">
                    {new Date(n.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        )}
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
          <div className="bg-surface border border-accent rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedNotice.pinned && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider bg-brand-primary/10 text-brand-primary">
                      Pinned
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted">
                    {selectedNotice.batch?.name || selectedNotice.course?.name || selectedNotice.branch?.name || "Campus Notice"}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    {new Date(selectedNotice.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-main">{selectedNotice.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 hover:bg-bg-app rounded-sm text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-text-main leading-relaxed whitespace-pre-wrap bg-bg-app p-4 rounded-sm border border-accent">
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
                  Download Attachment
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
