import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  LogOut,
  ArrowRight,
  Loader2,
  FileText,
} from "lucide-react";
import { apiClient } from "../../lib/apiClient.js";
import { UserRole } from "../../types/index.js";

export const TeacherApplicationStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>("/teacher/application-status");
      if (res.success && res.data) {
        setProfile(res.data);
        if (res.data.role === UserRole.TEACHER) {
          toast.success("Your faculty account is active!");
          navigate("/teacher");
        }
      }
    } catch {
      toast.error("Failed to load application status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_refresh_token");
    localStorage.removeItem("cms_user");
    toast.info("Signed out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Checking application status...
        </div>
      </div>
    );
  }

  const app = profile?.teacherApplication;
  const status = app?.status || "PENDING";
  const isApproved = profile?.role === UserRole.TEACHER || status === "APPROVED";
  const isRejected = status === "REJECTED";

  return (
    <div className="min-h-screen bg-bg-app py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary/10 border border-brand-primary/20 rounded-sm flex items-center justify-center text-brand-primary font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-text-main">Faculty Onboarding Desk</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-red-500 bg-surface border border-accent rounded-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-surface border border-accent rounded-sm p-6 sm:p-7 space-y-6 shadow-sm">
          {/* Status Header */}
          <div className="text-center space-y-2">
            {isApproved ? (
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : isRejected ? (
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-sm flex items-center justify-center mx-auto text-red-500">
                <XCircle className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-center justify-center mx-auto text-amber-500">
                <Clock className="w-8 h-8" />
              </div>
            )}

            <h1 className="text-xl font-black text-text-main">
              {isApproved
                ? "Faculty Application Approved!"
                : isRejected
                ? "Application Not Approved"
                : "Application Under Review"}
            </h1>

            <p className="text-xs text-text-muted max-w-md mx-auto">
              {isApproved
                ? "Your credentials have been validated by the Super Administration. Your teacher account has been activated."
                : isRejected
                ? app?.adminNotes || "We regret to inform you that your application could not be approved at this time."
                : "Thank you for applying. The coaching administration is currently reviewing your academic credentials and qualifications."}
            </p>
          </div>

          {/* Action button if approved */}
          {isApproved && (
            <div className="text-center">
              <Link
                to="/teacher"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 shadow-sm transition-opacity"
              >
                <span>Enter Faculty Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Review Steps Indicator */}
          {!isApproved && !isRejected && (
            <div className="p-4 bg-bg-app border border-accent rounded-sm space-y-3">
              <span className="text-[11px] font-bold text-text-main uppercase tracking-wider block">
                Onboarding Progress
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-text-main font-semibold">1. Account Created</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-text-main font-semibold">2. Application Form Submitted</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                  <span className="text-text-main font-semibold">3. Admin Credential Verification & Interview</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <div className="w-4 h-4 rounded-full border border-text-muted/30 flex items-center justify-center text-[10px]">4</div>
                  <span>4. Campus Assignment & Faculty Console Activation</span>
                </div>
              </div>
            </div>
          )}

          {/* Summary of submitted data */}
          {app && (
            <div className="border-t border-accent pt-4 space-y-3">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-primary" /> Submitted Application Summary
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-bg-app p-3 rounded-sm border border-accent">
                <div>
                  <span className="text-text-muted text-[11px] block">Full Name</span>
                  <span className="font-semibold text-text-main">{profile.fullName}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Email & Mobile</span>
                  <span className="font-mono text-text-main">{profile.email} • {profile.phone}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Specialization / Subject</span>
                  <span className="font-semibold text-brand-primary">{app.preferredSubject || "General Faculty"}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Preferred Campus</span>
                  <span className="font-semibold text-text-main">
                    {app.preferredBranch?.name || "Main Campus"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Submitted On</span>
                  <span className="font-mono text-text-main">
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                    isApproved
                      ? "bg-emerald-500/10 text-emerald-600"
                      : isRejected
                      ? "bg-red-500/10 text-red-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {!isApproved && (
                <div className="flex items-center justify-between pt-2">
                  <Link
                    to="/teacher/apply"
                    className="text-xs text-brand-primary hover:underline font-semibold"
                  >
                    Edit / Update Application Details →
                  </Link>

                  <button
                    onClick={fetchStatus}
                    className="text-xs text-text-muted hover:text-text-main font-medium cursor-pointer"
                  >
                    Refresh Status ↻
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherApplicationStatusPage;
