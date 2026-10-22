import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  BookOpen,
  CalendarCheck2,
  Trophy,
  CreditCard,
  Building2,
} from "lucide-react";
import { UserRole } from "../../types/index.js";
import { setDynamicFavicon } from "../../utils/dynamicFavicon.js";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);

  // Live organization branding (no hardcoded fallback values)
  const [orgData, setOrgData] = useState<{
    name?: string | null;
    logo?: string | null;
    tagline?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.organization) {
          const org = json.data.organization;
          const mainBranch = json.data.branches?.find((b: any) => b.isMain) || json.data.branches?.[0];
          setOrgData({
            name: org.name || null,
            logo: org.logoUrl || org.logo || null,
            tagline: org.tagline || null,
            address: mainBranch?.address || org.address || null,
            phone: org.phone || mainBranch?.phone || null,
          });
          setDynamicFavicon(org.faviconUrl || org.logoUrl || org.logo, org.name, org.logoUrl || org.logo);
        }
      })
      .catch(() => {})
      .finally(() => {
        setOrgLoading(false);
      });
  }, []);

  const handleRoleSwitch = (selectedRole: UserRole) => {
    setRole(selectedRole);
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

  const featureHighlights = [
    {
      icon: BookOpen,
      title: "Classroom Batches & Syllabus",
      desc: "Structured lesson planning, weekly routine, and guaranteed seat limits.",
    },
    {
      icon: CalendarCheck2,
      title: "Biometrics & Physical Attendance",
      desc: "Instant SMS check-in alerts to guardians with zero manual delays.",
    },
    {
      icon: Trophy,
      title: "Model Tests & Evaluated Exams",
      desc: "Merit leaderboards, subject breakdowns, and published answer keys.",
    },
    {
      icon: CreditCard,
      title: "Transparent Tuition Accounts",
      desc: "Campus desk cash invoices and verified bKash / Nagad receipts.",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex flex-col lg:grid lg:grid-cols-12">
      {/* ============================================================ */}
      {/* LEFT COLUMN: BRANDING & PLATFORM SHOWCASE (Desktop) */}
      {/* ============================================================ */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between p-8 xl:p-12 bg-surface border-r border-accent relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Return to Homepage & Institution Header */}
        <div className="relative z-10 space-y-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-sm bg-accent/40 border border-accent hover:border-brand-primary/40 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              {orgLoading ? (
                <>
                  <div className="w-14 h-14 bg-accent animate-pulse rounded-sm shrink-0" />
                  <div className="space-y-2">
                    <div className="w-20 h-3 bg-accent animate-pulse rounded-sm" />
                    <div className="w-48 h-6 bg-accent animate-pulse rounded-sm" />
                  </div>
                </>
              ) : (
                <>
                  {orgData?.logo ? (
                    <img
                      src={orgData.logo}
                      alt={orgData?.name || "Logo"}
                      className="w-14 h-14 object-contain rounded-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-brand-primary text-white flex items-center justify-center rounded-sm font-extrabold text-2xl shadow-sm">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-brand-primary tracking-widest uppercase">
                      Institutional Portal
                    </span>
                    <h2 className="text-xl font-black text-text-main tracking-tight leading-tight">
                      {orgData?.name}
                    </h2>
                  </div>
                </>
              )}
            </div>

            {orgLoading ? (
              <div className="w-64 h-4 bg-accent animate-pulse rounded-sm" />
            ) : orgData?.tagline ? (
              <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                {orgData.tagline}
              </p>
            ) : null}
          </div>
        </div>

        {/* Middle: Feature Matrix */}
        <div className="relative z-10 py-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
            Centralized Academic Management
          </h3>

          <div className="space-y-3.5">
            {featureHighlights.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-bg-app border border-accent rounded-sm">
                  <div className="w-8 h-8 rounded-sm bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-text-main">{feat.title}</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: Campus Location / Footer Note */}
        <div className="relative z-10 pt-4 border-t border-accent text-[11px] text-text-muted space-y-1">
          {orgLoading ? (
            <div className="w-44 h-3.5 bg-accent animate-pulse rounded-sm" />
          ) : orgData?.address ? (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span className="truncate">{orgData.address}</span>
            </div>
          ) : null}
          <p className="text-[10px] text-text-muted/80">
            Secure multi-tenant coaching management console. All rights reserved.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: AUTHENTICATION FORM */}
      {/* ============================================================ */}
      <div className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile Header: Logo on Left, Return to Homepage on Right */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-accent gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {orgLoading ? (
                <>
                  <div className="w-7 h-7 bg-accent animate-pulse rounded-sm shrink-0" />
                  <div className="w-24 h-4 bg-accent animate-pulse rounded-sm" />
                </>
              ) : (
                <>
                  {orgData?.logo ? (
                    <img src={orgData.logo} alt={orgData?.name || "Logo"} className="h-7 max-w-[90px] object-contain shrink-0" />
                  ) : (
                    <div className="w-7 h-7 bg-brand-primary text-white flex items-center justify-center rounded-sm shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                  {orgData?.name && (
                    <span className="text-xs font-bold text-text-main truncate max-w-[130px]">
                      {orgData.name}
                    </span>
                  )}
                </>
              )}
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Homepage</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-main">
              Portal Sign In
            </h1>
            <p className="text-xs text-text-muted">
              Select your role and authenticate with your registered credentials.
            </p>
          </div>

          {/* Card Box */}
          <div className="bg-surface border border-accent rounded-sm p-6 sm:p-7 space-y-5 shadow-sm">
            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-bg-app border border-accent rounded-sm text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleRoleSwitch(UserRole.SUPER_ADMIN)}
                className={`py-2 rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                  role === UserRole.SUPER_ADMIN
                    ? "bg-surface text-brand-primary shadow-xs border border-accent font-bold"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / Staff</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch(UserRole.STUDENT)}
                className={`py-2 rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                  role === UserRole.STUDENT
                    ? "bg-surface text-brand-primary shadow-xs border border-accent font-bold"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-text-muted" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder={role === UserRole.STUDENT ? "student@apexcoaching.com" : "admin@apexcoaching.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono text-text-main placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-text-muted" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary text-text-main"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        role === UserRole.SUPER_ADMIN
                          ? "Default password for admin is 'password123'"
                          : "For admitted students, your default password is your registered email. You can change it once logged in."
                      )
                    }
                    className="text-[11px] text-brand-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating Session...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In to {role === UserRole.STUDENT ? "Student" : "Admin"} Console
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-accent text-center text-xs">
              <span className="text-text-muted">Don't have an account yet? </span>
              <Link
                to="/register"
                className="font-bold text-brand-primary hover:underline inline-block"
              >
                Register as New Student →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
