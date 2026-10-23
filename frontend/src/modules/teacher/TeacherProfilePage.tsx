import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Building2,
  Save,
  Loader2,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Calendar,
  BookOpen,
  Share2,
  Eye,
  Edit3,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Home,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { FileUpload } from "../../components/common/FileUpload.js";

interface QualificationItem {
  degree: string;
  passingYear: string;
  board: string;
  institute: string;
  result: string;
}

export const TeacherProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "public_preview">("edit");

  // Form State covering all registered & applied information
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    specialization: "",
    qualification: "",
    bio: "",
    avatarUrl: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "MALE",
    religion: "Islam",
    presentAddress: "",
    permanentAddress: "",
    educationalQualifications: [] as QualificationItem[],
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>("/teacher/profile");
      if (res.success && res.data) {
        const d = res.data;
        const app = d.teacherApplication || {};

        // Parse educational qualifications normalizing both {degree, passingYear} and {exam, year}
        let parsedEdu: QualificationItem[] = [];
        if (Array.isArray(app.educationalQualifications)) {
          parsedEdu = app.educationalQualifications.map((q: any) => ({
            degree: q.degree || q.exam || "",
            passingYear: String(q.passingYear || q.year || ""),
            board: q.board || "",
            institute: q.institute || "",
            result: q.result || q.gpa || "",
          }));
        }

        setProfile(d);
        setForm({
          fullName: d.fullName || "",
          phone: d.phone || "",
          specialization: d.teacherProfile?.specialization || app.preferredSubject || "",
          qualification: d.teacherProfile?.qualification || "",
          bio: d.teacherProfile?.bio || app.bio || "",
          avatarUrl: d.avatarUrl || app.avatarUrl || "",
          fatherName: app.fatherName || "",
          motherName: app.motherName || "",
          dateOfBirth: app.dateOfBirth ? app.dateOfBirth.split("T")[0] : "",
          gender: app.gender || "MALE",
          religion: app.religion || "Islam",
          presentAddress: app.presentAddress || "",
          permanentAddress: app.permanentAddress || "",
          educationalQualifications: parsedEdu,
        });
      }
    } catch {
      toast.error("Failed to load faculty profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddQualification = () => {
    setForm((prev) => ({
      ...prev,
      educationalQualifications: [
        ...prev.educationalQualifications,
        { degree: "", passingYear: "", board: "", institute: "", result: "" },
      ],
    }));
  };

  const handleRemoveQualification = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      educationalQualifications: prev.educationalQualifications.filter((_, i) => i !== idx),
    }));
  };

  const handleQualificationChange = (idx: number, field: keyof QualificationItem, value: string) => {
    setForm((prev) => {
      const updated = [...prev.educationalQualifications];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, educationalQualifications: updated };
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.put<any>("/teacher/profile", form);
      if (res.success) {
        toast.success("Profile credentials updated successfully");
        // Update local stored user if fullName or avatar changed
        try {
          const stored = localStorage.getItem("cms_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (form.fullName) parsed.fullName = form.fullName;
            if (form.avatarUrl) parsed.avatarUrl = form.avatarUrl;
            localStorage.setItem("cms_user", JSON.stringify(parsed));
          }
        } catch {}
        fetchProfile();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!profile?.id) return;
    const url = `${window.location.origin}/faculty/${profile.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Public profile link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading faculty profile...
        </div>
      </div>
    );
  }

  const batches = profile?.teacherProfile?.batches || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Banner & Segmented Switcher */}
      <div className="bg-surface border border-accent rounded-sm p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Faculty Identity & Credentials
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Faculty Profile & Dossier
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            View and manage all personal, family, address, and academic information submitted during your application.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-bg-app border border-accent rounded-sm shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
              activeTab === "edit"
                ? "bg-surface text-brand-primary shadow-xs border border-accent"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit My Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("public_preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
              activeTab === "public_preview"
                ? "bg-surface text-brand-primary shadow-xs border border-accent"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Public Faculty View</span>
          </button>
        </div>
      </div>

      {activeTab === "edit" ? (
        /* ======================================================== */
        /* EDIT MY PROFILE VIEW                                     */
        /* ======================================================== */
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Quick Profile Card & Photo */}
            <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs text-center space-y-4">
              <div className="relative mx-auto w-24 h-24 rounded-sm overflow-hidden border-2 border-brand-primary/40 bg-bg-app flex items-center justify-center">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-primary">
                    {profile?.fullName?.[0] || "T"}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-text-main">{profile?.fullName}</h2>
                <p className="text-xs font-semibold text-brand-primary mt-0.5">
                  {form.specialization || "Faculty Instructor"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-xs tracking-wider uppercase">
                    {profile?.role}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-xs tracking-wider uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-accent text-left space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>{form.phone || "No phone added"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>Campus: {profile?.branch?.name || "Main Campus"}</span>
                </div>
              </div>

              <div className="pt-2 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  Update Profile Photo
                </label>
                <FileUpload
                  folder="avatars"
                  accept="image/*"
                  onChange={(url: string) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
                  value={form.avatarUrl}
                  isImage={true}
                />
              </div>
            </div>

            {/* Right Column: Editable Contact & Teaching Information */}
            <div className="md:col-span-2 space-y-6">
              {/* Card 1: Identity & Contact */}
              <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" /> Identity & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="e.g. Md. Sakil Ahmed"
                      className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. +880 1712 345678"
                      className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">
                      System Login Email (Read Only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ""}
                      className="w-full p-2 bg-bg-app/50 border border-accent rounded-sm text-xs text-text-muted cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">
                      Assigned Campus (Read Only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile?.branch?.name || "Main Campus"}
                      className="w-full p-2 bg-bg-app/50 border border-accent rounded-sm text-xs text-text-muted cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Academic Specialization & Teaching Details */}
              <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2.5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-primary" /> Academic Specialization & Philosophy
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">
                      Teaching Subject / Specialization
                    </label>
                    <input
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      placeholder="e.g. Higher Mathematics & Mechanics"
                      className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">
                      Highest Degree / Qualification
                    </label>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                      placeholder="e.g. M.Sc. in Physics, BUET"
                      className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">
                    Faculty Bio & Teaching Philosophy
                  </label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Share your academic background, teaching style, achievements, and mentorship philosophy..."
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Parents & Personal Information */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2.5 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-brand-primary" /> Parents & Personal Background
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={form.fatherName}
                  onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  placeholder="Father's full name"
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={form.motherName}
                  onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                  placeholder="Mother's full name"
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">
                  Religion
                </label>
                <input
                  type="text"
                  value={form.religion}
                  onChange={(e) => setForm({ ...form, religion: e.target.value })}
                  placeholder="e.g. Islam, Hinduism"
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Address Information */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-accent pb-2.5 flex items-center gap-2">
              <Home className="w-4 h-4 text-brand-primary" /> Address & Residence Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">
                  Present / Current Address
                </label>
                <textarea
                  rows={2}
                  value={form.presentAddress}
                  onChange={(e) => setForm({ ...form, presentAddress: e.target.value })}
                  placeholder="House, Road, Area, City"
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">
                  Permanent Address
                </label>
                <textarea
                  rows={2}
                  value={form.permanentAddress}
                  onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                  placeholder="Village, Post, Thana, District"
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Academic Qualifications Table (with Year & Board) */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-accent pb-2.5">
              <h3 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-primary" /> Educational Qualifications & Degrees
              </h3>
              <button
                type="button"
                onClick={handleAddQualification}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xs hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Degree
              </button>
            </div>

            {form.educationalQualifications.length === 0 ? (
              <p className="text-xs text-text-muted py-2 text-center">
                No educational qualifications added yet. Click "+ Add Degree" to enter your credentials.
              </p>
            ) : (
              <div className="overflow-x-auto border border-accent rounded-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-app border-b border-accent text-[11px] font-bold text-text-muted">
                    <tr>
                      <th className="p-2.5">Exam / Degree *</th>
                      <th className="p-2.5">Institute *</th>
                      <th className="p-2.5">Board</th>
                      <th className="p-2.5 w-24">Year *</th>
                      <th className="p-2.5 w-24">Result *</th>
                      <th className="p-2.5 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent">
                    {form.educationalQualifications.map((item, idx) => (
                      <tr key={idx} className="hover:bg-bg-app/40">
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.degree}
                            onChange={(e) => handleQualificationChange(idx, "degree", e.target.value)}
                            placeholder="e.g. B.Sc in EEE"
                            className="w-full p-1.5 bg-bg-app border border-accent rounded-xs text-xs text-text-main"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.institute}
                            onChange={(e) => handleQualificationChange(idx, "institute", e.target.value)}
                            placeholder="e.g. BUET"
                            className="w-full p-1.5 bg-bg-app border border-accent rounded-xs text-xs text-text-main"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.board}
                            onChange={(e) => handleQualificationChange(idx, "board", e.target.value)}
                            placeholder="e.g. Dhaka (optional)"
                            className="w-full p-1.5 bg-bg-app border border-accent rounded-xs text-xs text-text-main"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.passingYear}
                            onChange={(e) => handleQualificationChange(idx, "passingYear", e.target.value)}
                            placeholder="e.g. 2024"
                            className="w-full p-1.5 bg-bg-app border border-accent rounded-xs text-xs text-text-main"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.result}
                            onChange={(e) => handleQualificationChange(idx, "result", e.target.value)}
                            placeholder="e.g. 3.90 / GPA 5.0"
                            className="w-full p-1.5 bg-bg-app border border-accent rounded-xs text-xs text-text-main"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveQualification(idx)}
                            className="p-1 text-text-muted hover:text-rose-500 rounded-xs transition-colors cursor-pointer"
                            title="Remove degree"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving All Profile Details...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save All Profile Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ======================================================== */
        /* UPGRADED PUBLIC FACULTY VIEW (PREVIEW)                   */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Preview Banner */}
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-primary shrink-0" />
              <p className="text-xs text-text-main">
                This is how your verified profile appears to enrolled students, parents, and public website visitors.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent rounded-sm text-xs font-semibold text-text-main hover:bg-bg-app transition-colors shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-brand-primary" /> Copy Public Link
              </button>
              <Link
                to={`/faculty/${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-sm text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Public Page
              </Link>
            </div>
          </div>

          {/* Main Faculty Header Card */}
          <div className="bg-surface border border-accent rounded-sm overflow-hidden shadow-xs">
            {/* Hero Cover Banner */}
            <div className="h-28 sm:h-36 bg-gradient-to-r from-brand-primary/20 via-brand-primary/10 to-indigo-500/20 border-b border-accent relative p-4 flex items-end justify-end">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface/90 backdrop-blur-xs border border-accent rounded-xs text-[11px] font-bold text-emerald-600 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified Faculty Member
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-sm bg-surface border-4 border-surface shadow-md overflow-hidden shrink-0">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-primary/10 text-brand-primary font-bold text-2xl flex items-center justify-center">
                        {profile.fullName?.[0] || "T"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
                        {profile.fullName}
                      </h2>
                      <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-brand-primary">
                      {form.specialization || "Faculty Instructor"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {form.qualification || "Academic Mentor"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-app border border-accent rounded-xs text-text-muted">
                    <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                    {profile.branch?.name || "Main Campus"}
                  </span>
                </div>
              </div>

              {/* Contact Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-accent text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {form.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>{form.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="truncate">{form.presentAddress || profile.branch?.name || "Academic Campus"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Bio & Academic Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Bio & Cohorts */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-accent pb-2">
                  <BookOpen className="w-4 h-4 text-brand-primary" /> Faculty Bio & Mentorship Philosophy
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-line">
                  {form.bio || "Dedicated faculty educator committed to student excellence, structured problem solving, and analytical mastery."}
                </p>
              </div>

              <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-accent pb-2">
                  <Calendar className="w-4 h-4 text-brand-primary" /> Active Cohorts & Batches Under Mentorship
                </h3>
                {batches.length === 0 ? (
                  <p className="text-xs text-text-muted py-2">
                    Currently preparing syllabus and schedules for upcoming academy cohorts.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {batches.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-3 bg-bg-app border border-accent rounded-sm space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                            {b.course?.name || "Course"}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 rounded-xs">
                            {b.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-text-main">{b.name}</h4>
                        {b.academicClass && (
                          <span className="text-[11px] text-text-muted block">
                            Class: {b.academicClass.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Academic Credentials */}
            <div className="space-y-6">
              <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-accent pb-2">
                  <GraduationCap className="w-4 h-4 text-brand-primary" /> Academic Degrees
                </h3>

                {form.educationalQualifications.length > 0 ? (
                  <div className="space-y-3">
                    {form.educationalQualifications.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-bg-app border border-accent rounded-sm space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-main">{edu.degree}</span>
                          <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-xs">
                            Year: {edu.passingYear}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted">{edu.institute}</p>
                        {edu.board && edu.board.trim() && edu.board.toLowerCase() !== "n/a" && edu.board.toLowerCase() !== "null" && (
                          <p className="text-[11px] text-text-muted">
                            Board: {edu.board}
                          </p>
                        )}
                        {edu.result && (
                          <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">
                            Result: {edu.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1">
                    <span className="text-xs font-bold text-text-main">
                      {form.qualification || "Higher Degree"}
                    </span>
                    <p className="text-[11px] text-text-muted">
                      Institutional faculty degree authenticated by administration.
                    </p>
                  </div>
                )}
              </div>

              {/* Institutional Seal */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-primary">
                  <ShieldCheck className="w-4 h-4" /> Official Faculty Credential
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  This educator is an officially recognized instructor for {profile.branch?.name || "Apex Academy"}. Qualifications and background checks have been verified by administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfilePage;
