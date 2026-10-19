import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { UserRole } from "../../types/index.js";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [email, setEmail] = useState("admin@apexcoaching.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.organization?.name) {
          setOrgName(json.data.organization.name);
        }
      })
      .catch(() => {});
  }, []);

  const handleRoleSwitch = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === UserRole.SUPER_ADMIN) {
      setEmail("admin@apexcoaching.com");
      setPassword("password123");
    } else {
      setEmail("student@apexcoaching.com");
      setPassword("password123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Invalid credentials");
      }

      const { accessToken, refreshToken, user } = json.data;

      // Store credentials in localStorage for all API requests
      localStorage.setItem("cms_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("cms_refresh_token", refreshToken);
      }
      localStorage.setItem("cms_user", JSON.stringify(user));


      toast.success(`Welcome back, ${user.fullName}!`);

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");
      if (redirect) {
        navigate(redirect);
      } else if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.BRANCH_ADMIN) {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err: any) {
      toast.error("Authentication failed", {
        description: err.message || "Please check your email and password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg text-brand-primary">
            <div className="w-9 h-9 bg-brand-primary text-white flex items-center justify-center rounded-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-text-main">{orgName || "Academic Portal"}</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Portal Authentication</h1>
          <p className="text-xs text-text-main/60">
            Access your student attendance, exam records, or administrative controls.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-surface border border-theme rounded-sm p-6 space-y-5 shadow-xs">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-bg-app border border-theme rounded-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleSwitch(UserRole.SUPER_ADMIN)}
              className={`py-1.5 rounded-sm transition-colors ${
                role === UserRole.SUPER_ADMIN
                  ? "bg-surface text-brand-primary shadow-xs border border-theme"
                  : "text-text-main/60 hover:text-text-main"
              }`}
            >
              Admin / Staff Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch(UserRole.STUDENT)}
              className={`py-1.5 rounded-sm transition-colors ${
                role === UserRole.STUDENT
                  ? "bg-surface text-brand-primary shadow-xs border border-theme"
                  : "text-text-main/60 hover:text-text-main"
              }`}
            >
              Student Portal
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-text-main/40" /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder={role === UserRole.STUDENT ? "student@apexcoaching.com" : "admin@apexcoaching.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-text-main/40" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-main/40 hover:text-text-main transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      role === UserRole.SUPER_ADMIN
                        ? "Default password for admin is 'password123'"
                        : "For newly admitted students, your default password is your registered email. You can change it once logged in."
                    )
                  }
                  className="text-[11px] text-brand-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Info */}
            <div className="p-2.5 bg-bg-app border border-theme rounded-sm text-[11px] text-text-main/70 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-brand-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Credentials Ready</span>
              </div>
              <p className="font-mono text-[10px]">
                {role === UserRole.SUPER_ADMIN
                  ? "admin@apexcoaching.com / password123"
                  : "student@apexcoaching.com / password123"}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authenticating Session...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sign In to {role === UserRole.STUDENT ? "Student" : "Admin"} Console{" "}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-theme space-y-2">
            <div className="flex items-center justify-between text-xs text-text-main/60">
              <Link to="/" className="text-text-main/60 hover:text-brand-primary hover:underline">
                ← Return to Homepage
              </Link>
              <Link to="/register" className="font-semibold text-brand-primary hover:underline flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Register as New Student →
              </Link>
            </div>
            <p className="text-[10px] text-center text-text-main/50">
              New student? Create an account to enroll in courses, view class schedules, and track exam marks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
