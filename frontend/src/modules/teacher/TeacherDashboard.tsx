import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  Award,
  BookOpen,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Bell,
  Loader2,
} from "lucide-react";
import { apiClient } from "../../lib/apiClient.js";

export const TeacherDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>("/teacher/dashboard");
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      toast.error("Failed to load faculty dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading faculty dashboard...
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalBatches: 0,
    totalStudents: 0,
    todayClassesCount: 0,
    pendingExamsCount: 0,
  };

  const todayClasses = data?.todayClasses || [];
  const pendingExams = data?.pendingExams || [];
  const recentNotices = data?.recentNotices || [];
  const teacher = data?.teacher;

  return (
    <div className="space-y-5">
      {/* Top Quick Actions Bar (Mobile & Desktop optimized) */}
      <div className="bg-surface border border-accent rounded-sm p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-accent">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Quick Actions
          </span>
          <span className="text-xs text-text-muted font-medium">
            Welcome, <strong className="text-text-main font-bold">{teacher?.fullName || "Faculty"}</strong>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <Link
            to="/teacher/attendance"
            className="p-2.5 sm:p-3 bg-bg-app border border-accent rounded-sm hover:border-brand-primary hover:bg-surface transition-all flex flex-col items-center gap-1.5 text-center group"
          >
            <div className="p-2 bg-brand-primary/10 rounded-sm text-brand-primary group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-text-main text-xs">Attendance</span>
          </Link>

          <Link
            to="/teacher/exams"
            className="p-2.5 sm:p-3 bg-bg-app border border-accent rounded-sm hover:border-brand-primary hover:bg-surface transition-all flex flex-col items-center gap-1.5 text-center group"
          >
            <div className="p-2 bg-emerald-500/10 rounded-sm text-emerald-600 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-text-main text-xs">Marksheets</span>
          </Link>

          <Link
            to="/teacher/batches"
            className="p-2.5 sm:p-3 bg-bg-app border border-accent rounded-sm hover:border-brand-primary hover:bg-surface transition-all flex flex-col items-center gap-1.5 text-center group"
          >
            <div className="p-2 bg-indigo-500/10 rounded-sm text-indigo-600 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-text-main text-xs">Class Routine</span>
          </Link>

          <Link
            to="/teacher/materials"
            className="p-2.5 sm:p-3 bg-bg-app border border-accent rounded-sm hover:border-brand-primary hover:bg-surface transition-all flex flex-col items-center gap-1.5 text-center group"
          >
            <div className="p-2 bg-amber-500/10 rounded-sm text-amber-600 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-bold text-text-main text-xs">Study Notes</span>
          </Link>

          <Link
            to="/teacher/notices"
            className="col-span-2 sm:col-span-1 p-2.5 sm:p-3 bg-bg-app border border-accent rounded-sm hover:border-brand-primary hover:bg-surface transition-all flex flex-col items-center gap-1.5 text-center group"
          >
            <div className="p-2 bg-rose-500/10 rounded-sm text-rose-600 group-hover:scale-105 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
            <span className="font-bold text-text-main text-xs">Circulars</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Clean, concise) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-surface border border-accent rounded-sm p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Assigned Batches</span>
            <Calendar className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-text-main">{metrics.totalBatches}</div>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-text-main">{metrics.totalStudents}</div>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Classes Today</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-text-main">{metrics.todayClassesCount}</div>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Evaluation</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-text-main">{metrics.pendingExamsCount}</div>
        </div>
      </div>

      {/* Main Grid: Today's Routine & Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2 span): Today's Schedule Timetable */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-accent pb-3">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" /> Today's Class Routine & Timetable
              </h2>
              <Link
                to="/teacher/batches"
                className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
              >
                View Full Timetable <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {todayClasses.length === 0 ? (
              <div className="text-center py-8 space-y-1.5">
                <Calendar className="w-7 h-7 text-text-muted/40 mx-auto" />
                <p className="text-xs font-bold text-text-muted">No Classes Scheduled Today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-bg-app border border-accent rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-primary transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-primary/10 px-1.5 py-0.5 rounded-xs">
                          {cls.courseName}
                        </span>
                        <h3 className="text-xs font-bold text-text-main">{cls.batchName}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-brand-primary" /> {cls.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-primary" /> {cls.classroom}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-brand-primary" /> {cls.subject}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/teacher/attendance?batchId=${cls.batchId}`}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-primary text-white rounded-sm hover:opacity-90 shadow-xs shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Sheet
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Exams to Grade */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-accent pb-3">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-primary" /> Pending Exam Evaluations & Publishing
              </h2>
              <Link
                to="/teacher/exams"
                className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
              >
                All Exams <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {pendingExams.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                All submitted exams have been evaluated and published!
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingExams.map((ex: any) => (
                  <div
                    key={ex.id}
                    className="p-3 bg-bg-app border border-accent rounded-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-xs">
                          Draft / Unpublished
                        </span>
                        <span className="text-xs font-bold text-text-main">{ex.title}</span>
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        Batch: <strong>{ex.batch?.name}</strong> • Date: {new Date(ex.examDate).toLocaleDateString()}
                      </div>
                    </div>

                    <Link
                      to={`/teacher/exams?examId=${ex.id}`}
                      className="px-3 py-1 text-xs font-semibold bg-surface border border-accent text-brand-primary rounded-sm hover:bg-brand-primary hover:text-white transition-colors shrink-0"
                    >
                      Enter Grades →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Circulars & Academic Tips */}
        <div className="space-y-4">
          {/* Recent Circulars */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-accent pb-2">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-brand-primary" /> Campus & Batch Circulars
              </h2>
              <Link to="/teacher/notices" className="text-[11px] text-brand-primary hover:underline font-semibold">
                View All
              </Link>
            </div>

            {recentNotices.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-3">No active circulars.</p>
            ) : (
              <div className="space-y-2.5">
                {recentNotices.map((n: any) => (
                  <div key={n.id} className="text-xs space-y-0.5 border-b border-accent/50 pb-2 last:border-none last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-main line-clamp-1">{n.title}</span>
                      {n.priority === "URGENT" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-500/10 text-red-600 rounded-xs">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted line-clamp-2">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Resource Shortcut */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-accent pb-2">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-primary" /> Faculty Publications
              </h2>
              <Link to="/teacher/tips" className="text-[11px] text-brand-primary hover:underline font-semibold">
                Open Guide
              </Link>
            </div>
            <p className="text-xs text-text-muted">
              Publish learning frameworks, examination strategies, and batch study tips for enrolled students and the public academy portal.
            </p>
            <Link
              to="/teacher/tips"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline pt-1"
            >
              Share Strategy or Tip <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

