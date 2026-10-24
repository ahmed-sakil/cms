import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  School,
  BookOpen,
  Share2,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Users,
  Loader2,
} from "lucide-react";
import { Gender } from "../../types/index.js";
import { setDynamicFavicon } from "../../utils/dynamicFavicon.js";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralFromUrl = searchParams.get("ref") || "";
  const redirect = searchParams.get("redirect");

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Live database branding (no hardcoded values)
  const [orgData, setOrgData] = useState<{
    name?: string | null;
    logo?: string | null;
    tagline?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null>(null);

  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const [formData, setFormData] = useState({
    // Step 1: Account Credentials
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Step 2: Personal & Academic Information
    fatherName: "",
    motherName: "",
    guardianType: "FATHER", // "FATHER" | "MOTHER" | "OTHER"
    guardianPhone: "",
    otherGuardianName: "",
    otherRelation: "",
    gender: Gender.MALE,
    dateOfBirth: "",
    address: "",
    currentClass: "HSC 1st Year",
    institutionName: "",
    branchId: "",
    referredByCode: referralFromUrl,
  });

  // Fetch live organization and branches
  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const org = json.data.organization;
          const mainBranch = json.data.branches?.find((b: any) => b.isMain) || json.data.branches?.[0];
          if (org) {
            setOrgData({
              name: org.name || null,
              logo: org.logoUrl || org.logo || null,
              tagline: org.tagline || null,
              address: mainBranch?.address || org.address || null,
              phone: org.phone || mainBranch?.phone || null,
            });
            setDynamicFavicon(org.faviconUrl || org.logoUrl || org.logo, org.name, org.logoUrl || org.logo);
          }
          if (json.data.branches?.length) {
            setBranches(json.data.branches);
            setFormData((prev) => ({ ...prev, branchId: prev.branchId || json.data.branches[0].id }));
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setOrgLoading(false);
      });
  }, []);

  // Update referredByCode if URL param updates
  useEffect(() => {
    if (referralFromUrl) {
      setFormData((prev) => ({ ...prev, referredByCode: referralFromUrl }));
      toast.info(`Referral code '${referralFromUrl}' applied automatically!`, { duration: 4000 });
    }
  }, [referralFromUrl]);

  // Dynamic 4-condition password validation
  const hasMinLength = formData.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasMatch = !!formData.password && formData.password === formData.confirmPassword;

  const handleStepOneNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      toast.error("Please enter your full name (at least 2 characters)");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits)");
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber) {
      toast.error("Please fulfill all password requirements (at least 8 chars, 1 letter, 1 number)");
      return;
    }
    if (!hasMatch) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.guardianType === "OTHER") {
      if (!formData.otherGuardianName.trim()) {
        toast.error("Please enter guardian's full name");
        return;
      }
      if (!formData.otherRelation.trim()) {
        toast.error("Please specify relation with student (e.g. Uncle, Aunt, Brother)");
        return;
      }
    }

    if (!formData.guardianPhone.trim()) {
      toast.error("Please enter guardian's contact phone number");
      return;
    }

    // Determine formatted guardian name according to selection:
    // "Father's Name (Father)" | "Mother's Name (Mother)" | "Person's Name (Relation)"
    let effectiveGuardianName = "";
    if (formData.guardianType === "FATHER") {
      const base = formData.fatherName?.trim() || `${formData.fullName}'s Father`;
      effectiveGuardianName = `${base} (Father)`;
    } else if (formData.guardianType === "MOTHER") {
      const base = formData.motherName?.trim() || `${formData.fullName}'s Mother`;
      effectiveGuardianName = `${base} (Mother)`;
    } else {
      const base = formData.otherGuardianName?.trim() || "Legal Guardian";
      const rel = formData.otherRelation?.trim() || "Guardian";
      effectiveGuardianName = `${base} (${rel})`;
    }

    setLoading(true);
    try {
      const selectedBranchId = formData.branchId || (branches[0] ? branches[0].id : undefined);

      const res = await fetch("/api/v1/auth/register-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          branchId: selectedBranchId,
          gender: formData.gender,
          guardianName: effectiveGuardianName,
          guardianPhone: formData.guardianPhone,
          guardianType: formData.guardianType,
          fatherName: formData.fatherName || undefined,
          motherName: formData.motherName || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          address: formData.address || undefined,
          currentClass: formData.currentClass || undefined,
          institutionName: formData.institutionName || undefined,
          referredByCode: formData.referredByCode?.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Registration failed");
      }

      const { accessToken, refreshToken, user } = json.data;
      if (accessToken) {
        localStorage.setItem("cms_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("cms_refresh_token", refreshToken);
        }
        localStorage.setItem("cms_user", JSON.stringify(user));
      }


      toast.success("Registration successful! Welcome to your student portal.");
      if (redirect) {
        navigate(redirect);
      } else {
        navigate("/student");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const registrationRoadmap = [
    {
      stepNum: 1,
      title: "Account Credentials",
      desc: "Register login email, student mobile, and a secure password.",
    },
    {
      stepNum: 2,
      title: "Personal & Guardian Bio",
      desc: "Emergency guardian phone for instant SMS alerts and previous school info.",
    },
    {
      stepNum: 3,
      title: "Classroom Batches & Seats",
      desc: "Choose your physical branch, explore subject mentors, and secure seats.",
    },
    {
      stepNum: 4,
      title: "Student Portal Access",
      desc: "Access daily biometric attendance logs, model test leaderboards, and invoices.",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex flex-col lg:grid lg:grid-cols-12">
      {/* ============================================================ */}
      {/* LEFT COLUMN: BRANDING & REGISTRATION SHOWCASE (Desktop) */}
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
                    <div className="w-44 h-6 bg-accent animate-pulse rounded-sm" />
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
                      Admissions Open
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

        {/* Middle: 4-Step Registration Guide */}
        <div className="relative z-10 py-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
            Student Admission Roadmap
          </h3>

          <div className="space-y-3">
            {registrationRoadmap.map((s) => (
              <div
                key={s.stepNum}
                className={`flex items-start gap-3 p-3 rounded-sm border transition-all ${
                  step === s.stepNum
                    ? "bg-brand-primary/5 border-brand-primary/30"
                    : "bg-bg-app border-accent"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    step === s.stepNum
                      ? "bg-brand-primary text-white"
                      : "bg-accent text-text-muted"
                  }`}
                >
                  {s.stepNum}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-text-main">{s.title}</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Campus Location / Contact Note */}
        <div className="relative z-10 pt-4 border-t border-accent text-[11px] text-text-muted space-y-1">
          {orgLoading ? (
            <div className="w-44 h-3.5 bg-accent animate-pulse rounded-sm" />
          ) : (
            <>
              {orgData?.address && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span className="truncate">{orgData.address}</span>
                </div>
              )}
              {orgData?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>Admissions Desk: {orgData.phone}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: REGISTRATION FORM */}
      {/* ============================================================ */}
      <div className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-5">
          {/* Mobile Header: Logo on Left, Return to Homepage on Right */}
          <div className="lg:hidden flex items-center justify-between pb-3.5 mb-2 border-b border-accent gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {orgLoading ? (
                <>
                  <div className="w-8 h-8 bg-accent animate-pulse rounded-sm shrink-0" />
                  <div className="w-24 h-4 bg-accent animate-pulse rounded-sm" />
                </>
              ) : (
                <>
                  {orgData?.logo ? (
                    <img
                      src={orgData.logo}
                      alt={orgData?.name || "Logo"}
                      className="h-8 max-w-[100px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-brand-primary text-white flex items-center justify-center rounded-sm shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                  {orgData?.name && (
                    <span className="text-xs font-bold text-text-main truncate max-w-[140px]">
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
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              Student Admission Registration
            </h1>
            <p className="text-xs text-text-muted">
              Complete the enrollment form to get your student ID, admit on a course, access study materials, and track exam progress
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="grid grid-cols-2 gap-2 bg-surface border border-accent p-2 rounded-sm text-xs font-semibold">
            <div
              className={`flex items-center gap-2 p-2 rounded-sm transition-colors ${
                step === 1
                  ? "bg-brand-primary text-white"
                  : "bg-bg-app text-text-muted border border-accent"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-bold">Step 1: Account Essentials</p>
                <p className="text-[9px] opacity-80">Login credentials & contact</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded-sm transition-colors ${
                step === 2
                  ? "bg-brand-primary text-white"
                  : "bg-bg-app text-text-muted border border-accent"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-bold">Step 2: Personal & Academic</p>
                <p className="text-[9px] opacity-80">Guardian, class & campus</p>
              </div>
            </div>
          </div>

          {/* Main Form Container */}
          <div className="bg-surface border border-accent rounded-sm p-6 sm:p-8 shadow-xs space-y-5">
          {step === 1 ? (
            /* STEP 1: Account Credentials */
            <form onSubmit={handleStepOneNext} className="space-y-4">
              <div className="border-b border-accent pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Step 1: Account Information
                </span>
                <span className="text-[11px] text-text-main/50">Fields with * are mandatory</span>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-text-main/40" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tanvir Ahmed Chowdhury"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-text-main/40" /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-text-main/40" /> Student Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-text-main/40" /> Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
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
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-text-main/40" /> Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="********"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-main/40 hover:text-text-main transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-Condition Password Checklist */}
              <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Password Requirements
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-text-muted"
                    }`}
                  >
                    {hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
                    )}
                    <span>At least 8 characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasLetter ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-text-muted"
                    }`}
                  >
                    {hasLetter ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
                    )}
                    <span>Contains a letter</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-text-muted"
                    }`}
                  >
                    {hasNumber ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
                    )}
                    <span>Contains a number</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasMatch ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-text-muted"
                    }`}
                  >
                    {hasMatch ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
                    )}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Navigation button */}
              <div className="pt-2 flex justify-end items-center">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs"
                >
                  Continue to Step 2 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Personal & Academic Details */
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="border-b border-accent pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Step 2: Personal, Guardian & Academic Details
                </span>
                <span className="text-[11px] text-brand-primary font-medium">Final step before admission</span>
              </div>

              {/* Row 1: Father's & Mother's Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <User className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Father's Name
                  </label>
                  <input
                    type="text"
                    placeholder="Father's full name"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <User className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Mother's Name
                  </label>
                  <input
                    type="text"
                    placeholder="Mother's full name"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Row 2: Guardian Selector & Guardian Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <Users className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Primary Guardian *
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 h-10 bg-bg-app border border-accent rounded-sm items-center">
                    {(["FATHER", "MOTHER", "OTHER"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, guardianType: type })}
                        className={`h-full flex items-center justify-center rounded-sm transition-colors text-xs font-semibold ${
                          formData.guardianType === type
                            ? "bg-surface text-brand-primary shadow-xs border border-accent font-bold"
                            : "text-text-main/60 hover:text-text-main"
                        }`}
                      >
                        {type === "FATHER" ? "Father" : type === "MOTHER" ? "Mother" : "Other"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <Phone className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Guardian's Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="018XXXXXXXX"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Row 2.5: Other Guardian Fields or Formatted Preview */}
              {formData.guardianType === "OTHER" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-bg-app/70 border border-brand-primary/30 rounded-sm">
                  <div className="space-y-1.5">
                    <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                      <User className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Guardian Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohammad Rafiq"
                      value={formData.otherGuardianName}
                      onChange={(e) => setFormData({ ...formData, otherGuardianName: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-surface border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                      <Users className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Relation with Student *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Uncle, Aunt, Elder Brother"
                      value={formData.otherRelation}
                      onChange={(e) => setFormData({ ...formData, otherRelation: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-surface border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-bg-app/60 border border-accent rounded-sm flex items-center justify-between text-xs">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    Stored Guardian Format:
                  </span>
                  <span className="font-mono font-semibold text-brand-primary">
                    {formData.guardianType === "FATHER"
                      ? (formData.fatherName?.trim() ? `${formData.fatherName} (Father)` : "Father's Name (Father)")
                      : (formData.motherName?.trim() ? `${formData.motherName} (Mother)` : "Mother's Name (Mother)")
                    }
                  </span>
                </div>
              )}

              {/* Row 3: Gender & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <User className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <Calendar className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Row 4: Class & School/College Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <BookOpen className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Current Academic Level
                  </label>
                  <select
                    value={formData.currentClass}
                    onChange={(e) => setFormData({ ...formData, currentClass: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10 (SSC Candidate)</option>
                    <option value="HSC 1st Year">HSC 1st Year</option>
                    <option value="HSC 2nd Year">HSC 2nd Year</option>
                    <option value="Engineering Admission">Engineering Admission</option>
                    <option value="Medical Admission">Medical Admission</option>
                    <option value="University General Admission">University General Admission</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <School className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> School / College Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Notre Dame College, Dhaka"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Row 5: Campus Branch & Referral Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                    <Building2 className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Campus / Branch *
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="h-5 flex items-center justify-between text-xs font-semibold text-text-main">
                    <span className="flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Referral Code
                    </span>
                    {formData.referredByCode && (
                      <span className="text-[10px] text-brand-primary font-bold">Auto-Linked</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REF-2026-DH-0001 (Optional)"
                    value={formData.referredByCode}
                    onChange={(e) => setFormData({ ...formData, referredByCode: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>
              </div>

              {/* Row 6: Present Address */}
              <div className="space-y-1.5">
                <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-text-main">
                  <MapPin className="w-3.5 h-3.5 text-text-main/40 shrink-0" /> Present Residential Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. House 42, Road 7/A, Dhanmondi, Dhaka"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-between items-center border-t border-accent">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Step 1
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Admission...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Complete Registration & Enter Portal
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Bottom prompt matching Login */}
          <div className="pt-3.5 border-t border-accent text-center text-xs">
            <span className="text-text-muted">Already registered with us? </span>
            <Link
              to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
              className="font-bold text-brand-primary hover:underline inline-block ml-1"
            >
              Sign In to Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
export default RegisterPage;
