import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  UserCheck,
  Mail,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Award,
  Users,
} from "lucide-react";

export const TeacherRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Registration failed");
      }

      const { accessToken, refreshToken, user } = json.data;
      localStorage.setItem("cms_token", accessToken);
      if (refreshToken) localStorage.setItem("cms_refresh_token", refreshToken);
      localStorage.setItem("cms_user", JSON.stringify(user));

      toast.success("Account created successfully! Please complete your faculty application.");
      navigate("/teacher/apply");
    } catch (err: any) {
      toast.error(err.message || "Unable to register faculty account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-xs">
            <Sparkles className="w-3 h-3" /> Step 1 of 2
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-brand-primary/10 border border-brand-primary/20 rounded-sm flex items-center justify-center mx-auto text-brand-primary mb-2">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-main">
            Apply as Faculty / Teacher
          </h1>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Create your account to start your teacher application. Once approved by the administration, you will gain full access to the faculty portal.
          </p>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-surface border border-accent rounded-sm text-center">
          <div className="flex flex-col items-center gap-1 p-1">
            <BookOpen className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] font-semibold text-text-main">Assigned Batches</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-1">
            <Award className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] font-semibold text-text-main">Exam Grading</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-1">
            <Users className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] font-semibold text-text-main">Attendance Desk</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-surface border border-accent rounded-sm p-6 sm:p-7 space-y-4 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-muted" /> Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prof. Mahmud Hasan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary text-text-main"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-text-muted" /> Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="mahmud@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono text-text-main"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-text-muted" /> Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono text-text-main"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-text-muted" /> Create Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary text-text-main"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-text-muted" /> Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary text-text-main"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <span>Create Faculty Account & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-accent text-center text-xs">
            <span className="text-text-muted">Already have a faculty account? </span>
            <Link to="/login" className="font-bold text-brand-primary hover:underline">
              Sign In Here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegistrationPage;
