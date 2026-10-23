import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  UserCheck,
  Building2,
  BookOpen,
  Calendar,
  GraduationCap,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  MapPin,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { FileUpload } from "../../components/common/FileUpload.js";
import { apiClient } from "../../lib/apiClient.js";

interface Qualification {
  degree: string;
  passingYear: string;
  board: string;
  institute: string;
  result: string;
}

export const TeacherApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available options from DB
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [academicClasses, setAcademicClasses] = useState<Array<{ id: string; name: string }>>([]);

  // Form Fields
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [religion, setReligion] = useState("Islam");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  const [qualifications, setQualifications] = useState<Qualification[]>([
    { degree: "B.Sc (Honours)", passingYear: "2024", board: "Dhaka", institute: "University of Dhaka", result: "3.80" },
    { degree: "HSC", passingYear: "2020", board: "Dhaka", institute: "Notre Dame College", result: "GPA 5.00" },
  ]);

  const [preferredClass, setPreferredClass] = useState("");
  const [preferredSubject, setPreferredSubject] = useState("");
  const [preferredBranchId, setPreferredBranchId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const rawUser = localStorage.getItem("cms_user");
    const token = localStorage.getItem("cms_token");

    if (!token || !rawUser) {
      toast.info("Please sign up or sign in first to submit a faculty application");
      navigate("/teacher/register");
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      setCurrentUser(parsed);
      if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
    } catch {
      navigate("/teacher/register");
      return;
    }

    // Fetch user status + options
    Promise.all([
      apiClient.get<any>("/teacher/application-status").catch(() => null),
      apiClient.get<any>("/public/landing").catch(() => null),
      apiClient.get<any>("/academics/classes").catch(() => null),
    ])
      .then(([statusRes, landingRes, classesRes]) => {
        if (statusRes && statusRes.success && statusRes.data) {
          const app = statusRes.data.teacherApplication;
          if (app) {
            // Preload existing application
            if (app.gender) setGender(app.gender);
            if (app.dateOfBirth) setDateOfBirth(app.dateOfBirth.split("T")[0]);
            if (app.fatherName) setFatherName(app.fatherName);
            if (app.motherName) setMotherName(app.motherName);
            if (app.religion) setReligion(app.religion);
            if (app.presentAddress) setPresentAddress(app.presentAddress);
            if (app.permanentAddress) setPermanentAddress(app.permanentAddress);
            if (Array.isArray(app.educationalQualifications) && app.educationalQualifications.length > 0) {
              setQualifications(app.educationalQualifications);
            }
            if (app.preferredClass) setPreferredClass(app.preferredClass);
            if (app.preferredSubject) setPreferredSubject(app.preferredSubject);
            if (app.preferredBranchId) setPreferredBranchId(app.preferredBranchId);
            if (app.avatarUrl) setAvatarUrl(app.avatarUrl);
            if (app.bio) setBio(app.bio);

            if (app.status === "PENDING" || app.status === "REJECTED") {
              navigate("/teacher/application-status");
              return;
            }
          }
        }

        if (landingRes && landingRes.success && landingRes.data?.branches) {
          setBranches(landingRes.data.branches);
          if (landingRes.data.branches.length > 0 && !preferredBranchId) {
            setPreferredBranchId(landingRes.data.branches[0].id);
          }
        }

        if (classesRes && classesRes.success && Array.isArray(classesRes.data)) {
          setAcademicClasses(classesRes.data);
          if (classesRes.data.length > 0 && !preferredClass) {
            setPreferredClass(classesRes.data[0].name);
          }
        }
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, [navigate]);

  const addQualificationRow = () => {
    setQualifications([
      ...qualifications,
      { degree: "", passingYear: "", board: "", institute: "", result: "" },
    ]);
  };

  const removeQualificationRow = (index: number) => {
    if (qualifications.length <= 1) {
      toast.error("Please provide at least one educational qualification");
      return;
    }
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, field: keyof Qualification, value: string) => {
    const updated = [...qualifications];
    updated[index][field] = value;
    setQualifications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const q of qualifications) {
      if (!q.degree.trim() || !q.institute.trim() || !q.result.trim()) {
        toast.error("Please fill in Degree, Institute, and Result for all qualifications");
        return;
      }
    }

    if (!preferredSubject.trim()) {
      toast.error("Please enter your preferred teaching subject");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        gender,
        dateOfBirth: dateOfBirth || null,
        fatherName: fatherName || null,
        motherName: motherName || null,
        religion: religion || null,
        presentAddress: presentAddress || null,
        permanentAddress: permanentAddress || null,
        educationalQualifications: qualifications,
        preferredClass: preferredClass || null,
        preferredSubject: preferredSubject.trim(),
        preferredBranchId: preferredBranchId || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
      };

      const res = await apiClient.post<any>("/teacher/apply", payload);
      if (!res.success) {
        throw new Error(res.message || "Failed to submit faculty application");
      }

      toast.success("Application submitted successfully!", {
        description: "Your profile is under review by the coaching administration.",
      });
      navigate("/teacher/application-status");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading application profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-app py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Step tracker */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-xs">
            <Sparkles className="w-3 h-3" /> Step 2 of 2: Faculty Profile Details
          </span>
        </div>

        {/* Title & Introduction */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-primary" /> Faculty Application & Credentials Form
          </h1>
          <p className="text-xs text-text-muted">
            Please fill in your academic history, background, and teaching preferences for administration review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Account & Identity (Auto-loaded) */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-accent pb-2">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> 1. Registered Identity (Auto-Loaded)
              </h2>
              <span className="text-[10px] text-text-muted">From your account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.fullName || ""}
                  className="w-full px-3 py-2 text-xs bg-bg-app/50 border border-accent rounded-sm text-text-main font-semibold cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ""}
                  className="w-full px-3 py-2 text-xs bg-bg-app/50 border border-accent rounded-sm text-text-main font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">Mobile Number</label>
                <input
                  type="tel"
                  disabled
                  value={currentUser?.phone || ""}
                  className="w-full px-3 py-2 text-xs bg-bg-app/50 border border-accent rounded-sm text-text-main font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Family Information */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-primary" /> 2. Personal & Family Background
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">Gender <span className="text-red-500">*</span></label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">Religion</label>
                <input
                  type="text"
                  placeholder="e.g. Islam, Hinduism"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">Father's Name</label>
                <input
                  type="text"
                  placeholder="Father's full name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">Mother's Name</label>
                <input
                  type="text"
                  placeholder="Mother's full name"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" /> Present Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Flat/House, Road, Area, City"
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  className="w-full p-2.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" /> Permanent Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Village/Thana, District, Division"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full p-2.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Educational Qualifications Table */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-accent pb-2">
              <div>
                <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-primary" /> 3. Educational Qualifications
                </h2>
                <p className="text-[11px] text-text-muted">List your degrees starting from highest to SSC/O-Level.</p>
              </div>
              <button
                type="button"
                onClick={addQualificationRow}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-sm hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="space-y-3">
              {qualifications.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-bg-app border border-accent rounded-sm space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-primary uppercase">
                      Qualification #{idx + 1}
                    </span>
                    {qualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQualificationRow(idx)}
                        className="text-text-muted hover:text-red-500 transition-colors p-1"
                        title="Remove qualification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[10px] text-text-muted">Degree / Exam</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. B.Sc, HSC"
                        value={q.degree}
                        onChange={(e) => updateQualification(idx, "degree", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] text-text-muted">Passing Year</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2024"
                        value={q.passingYear}
                        onChange={(e) => updateQualification(idx, "passingYear", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] text-text-muted">Board / Dept</label>
                      <input
                        type="text"
                        placeholder="e.g. Dhaka, CSE"
                        value={q.board}
                        onChange={(e) => updateQualification(idx, "board", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] text-text-muted">Institute Name</label>
                      <input
                        type="text"
                        required
                        placeholder="College/University"
                        value={q.institute}
                        onChange={(e) => updateQualification(idx, "institute", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] text-text-muted">Result / GPA</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 3.85 / 5.00"
                        value={q.result}
                        onChange={(e) => updateQualification(idx, "result", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Teaching Preferences & Campus Selection */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-primary" /> 4. Teaching Preferences & Campus
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">
                  Preferred Subject / Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Mathematics, Physics"
                  value={preferredSubject}
                  onChange={(e) => setPreferredSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main">Preferred Academic Class</label>
                <select
                  value={preferredClass}
                  onChange={(e) => setPreferredClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                >
                  <option value="">Any Available Class</option>
                  {academicClasses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="HSC (College Level)">HSC (College Level)</option>
                  <option value="SSC (School Level)">SSC (School Level)</option>
                  <option value="University Admission">University Admission</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-main flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-text-muted" /> Preferred Campus Branch
                </label>
                <select
                  value={preferredBranchId}
                  onChange={(e) => setPreferredBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Profile Photo & Short Introduction */}
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-primary" /> 5. Profile Picture & Biography
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-1">
                <FileUpload
                  label="Faculty Photo / Avatar"
                  folder="avatars"
                  accept="image/*"
                  value={avatarUrl}
                  onChange={(url) => setAvatarUrl(url)}
                  helperText="Clear passport-sized formal photo"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-text-main">
                  Short Introduction / Teaching Philosophy
                </label>
                <textarea
                  rows={4}
                  placeholder="Introduce yourself, your academic achievements, teaching experience, and passion for coaching..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 text-xs bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary resize-none"
                />
                <span className="text-[10px] text-text-muted">
                  This will be shown on your faculty profile and course brochures once approved.
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between p-4 bg-surface border border-accent rounded-sm shadow-xs">
            <div className="text-xs text-text-muted">
              By submitting, you certify that all educational credentials provided are genuine.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                </>
              ) : (
                <>
                  <span>Submit Application to Administration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherApplicationPage;
