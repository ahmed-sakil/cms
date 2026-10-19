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
  Loader2,
} from "lucide-react";
import { Gender } from "../../types/index.js";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralFromUrl = searchParams.get("ref") || "";

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [orgName, setOrgName] = useState("");
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
    guardianType: "FATHER",
    guardianName: "",
    guardianPhone: "",
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
          if (json.data.organization?.name) {
            setOrgName(json.data.organization.name);
          }
          if (json.data.branches?.length) {
            setBranches(json.data.branches);
            setFormData((prev) => ({ ...prev, branchId: prev.branchId || json.data.branches[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update referredByCode if URL param updates
  useEffect(() => {
    if (referralFromUrl) {
      setFormData((prev) => ({ ...prev, referredByCode: referralFromUrl }));
      toast.info(`Referral code '${referralFromUrl}' applied automatically!`, { duration: 4000 });
    }
  }, [referralFromUrl]);

  const validatePasswordStrength = (pwd: string) => {
    return pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
  };

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
    if (!validatePasswordStrength(formData.password)) {
      toast.error("Password must be at least 8 characters with at least one letter and one number");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    // Auto-sync guardian name if blank
    if (!formData.guardianName) {
      setFormData((prev) => ({
        ...prev,
        guardianName: prev.fatherName || prev.fullName + "'s Guardian",
      }));
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGuardianTypeChange = (type: string) => {
    let name = formData.guardianName;
    if (type === "FATHER" && formData.fatherName) {
      name = formData.fatherName;
    } else if (type === "MOTHER" && formData.motherName) {
      name = formData.motherName;
    }
    setFormData({
      ...formData,
      guardianType: type,
      guardianName: name,
    });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guardianPhone) {
      toast.error("Please enter guardian's contact phone number");
      return;
    }

    // Ensure guardianName is set
    const effectiveGuardianName =
      formData.guardianName ||
      (formData.guardianType === "FATHER" ? formData.fatherName : formData.motherName) ||
      formData.fullName + "'s Guardian";

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
      navigate("/student");
    } catch (err: any) {
      toast.error(err.message || "Registration could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg text-brand-primary">
            <div className="w-8 h-8 bg-brand-primary text-white flex items-center justify-center rounded-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-text-main font-bold">{orgName || "Academic Portal"}</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-text-main">
            Student Admission Registration
          </h1>
          <p className="text-xs text-text-main/60">
            Complete the 2-step enrollment form to get your student ID, access study materials, and track exam progress.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-2 gap-2 bg-surface border border-theme p-2 rounded-sm text-xs font-semibold">
          <div
            className={`flex items-center gap-2 p-2 rounded-sm transition-colors ${
              step === 1
                ? "bg-brand-primary text-white"
                : "bg-bg-app text-text-main/70 border border-theme"
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
                : "bg-bg-app text-text-main/70 border border-theme"
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
        <div className="bg-surface border border-theme rounded-sm p-6 sm:p-7 shadow-xs">
          {step === 1 ? (
            /* STEP 1: Account Credentials */
            <form onSubmit={handleStepOneNext} className="space-y-4">
              <div className="border-b border-theme pb-2 flex items-center justify-between">
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
                  placeholder="e.g. Tanvir Ahmed Chowdhury"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
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
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
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
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
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
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-text-main/40" /> Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
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

              {/* Password Rule Hint */}
              <div className="p-2.5 bg-bg-app border border-theme rounded-sm text-[11px] text-text-main/70 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span>Password must be at least 8 characters and contain at least one letter and one number.</span>
              </div>

              {/* Navigation button */}
              <div className="pt-2 flex justify-between items-center">
                <Link to="/login" className="text-xs text-text-main/60 hover:text-brand-primary">
                  Already have an account? Sign In
                </Link>
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
              <div className="border-b border-theme pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Step 2: Personal, Guardian & Academic Details
                </span>
                <span className="text-[11px] text-brand-primary font-medium">Final step before admission</span>
              </div>

              {/* Father's & Mother's Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Father's Name</label>
                  <input
                    type="text"
                    placeholder="Father's full name"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Mother's Name</label>
                  <input
                    type="text"
                    placeholder="Mother's full name"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Guardian Selector & Guardian Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Primary Guardian *</label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-bg-app border border-theme rounded-sm text-xs font-semibold">
                    {["FATHER", "MOTHER", "OTHER"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleGuardianTypeChange(type)}
                        className={`py-1.5 rounded-sm transition-colors text-[11px] ${
                          formData.guardianType === type
                            ? "bg-surface text-brand-primary shadow-xs border border-theme font-bold"
                            : "text-text-main/60 hover:text-text-main"
                        }`}
                      >
                        {type === "FATHER" ? "Father" : type === "MOTHER" ? "Mother" : "Other"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-text-main/40" /> Guardian's Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="018XXXXXXXX"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Gender & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-main/40" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Class & School/College Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-text-main/40" /> Current Class / Academic Level
                  </label>
                  <select
                    value={formData.currentClass}
                    onChange={(e) => setFormData({ ...formData, currentClass: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-text-main/40" /> School / College Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Notre Dame College, Dhaka"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Campus Branch & Referral Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-main/40" /> Campus / Branch *
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-brand-primary" /> Referred By Student Code / Roll
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
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>
              </div>

              {/* Present Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-main/40" /> Present Residential Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. House 42, Road 7/A, Dhanmondi, Dhaka"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-between items-center border-t border-theme">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-theme text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app transition-colors flex items-center gap-1.5"
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
        </div>
      </div>
    </div>
  );
};
