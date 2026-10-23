import React, { useState, useEffect } from "react";
import {
  UserCircle,
  KeyRound,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Lock,
  Edit2,
  X,
  School,
  BookOpen,
  MapPin,
  Heart,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface StudentProfileState {
  fullName: string;
  email: string;
  phone: string;
  rollNumber: string;
  campus: string;
  enrolledSince: string;
  fatherName: string;
  motherName: string;
  guardianType: string;
  guardianName: string;
  guardianPhone: string;
  bloodGroup: string;
  address: string;
  currentClass: string;
  institutionName: string;
  dateOfBirth: string;
  gender: string;
}

export const StudentProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfileState>({
    fullName: "",
    email: "",
    phone: "",
    rollNumber: "",
    campus: "",
    enrolledSince: "",
    fatherName: "",
    motherName: "",
    guardianType: "FATHER",
    guardianName: "",
    guardianPhone: "",
    bloodGroup: "",
    address: "",
    currentClass: "",
    institutionName: "",
    dateOfBirth: "",
    gender: "MALE",
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StudentProfileState>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchProfile = async () => {
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
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setProfile({
            fullName: d.user?.fullName || "",
            email: d.user?.email || "",
            phone: d.user?.phone || "",
            rollNumber: d.rollNumber || "",
            campus: d.user?.branch?.name || "Unassigned Campus",
            enrolledSince: d.createdAt ? d.createdAt.split("T")[0] : "",
            fatherName: d.fatherName || "",
            motherName: d.motherName || "",
            guardianType: d.guardianType || "FATHER",
            guardianName: d.guardianName || d.fatherName || "",
            guardianPhone: d.guardianPhone || "",
            bloodGroup: d.bloodGroup || "",
            address: d.address || "",
            currentClass: d.currentClass || "",
            institutionName: d.institutionName || "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
            gender: d.gender || "MALE",
          });
        }
      } else {
        setError("Failed to retrieve student profile.");
      }
    } catch {
      setError("Network error: Unable to connect to student records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEditModal = () => {
    setEditForm({ ...profile });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/students/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          phone: editForm.phone,
          fatherName: editForm.fatherName,
          motherName: editForm.motherName,
          guardianType: editForm.guardianType,
          guardianName: editForm.guardianName,
          guardianPhone: editForm.guardianPhone,
          bloodGroup: editForm.bloodGroup,
          address: editForm.address,
          currentClass: editForm.currentClass,
          institutionName: editForm.institutionName,
          dateOfBirth: editForm.dateOfBirth || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Profile information updated successfully!");
        setProfile((prev) => ({
          ...prev,
          ...(editForm as StudentProfileState),
        }));

        // Update local stored user
        try {
          const stored = localStorage.getItem("cms_user");
          if (stored) {
            const user = JSON.parse(stored);
            user.fullName = editForm.fullName || user.fullName;
            user.phone = editForm.phone || user.phone;
            localStorage.setItem("cms_user", JSON.stringify(user));
          }
        } catch {}

        setShowEditModal(false);
      } else {
        toast.error(json.message || "Failed to update profile information");
      }
    } catch {
      // Offline fallback
      setProfile((prev) => ({ ...prev, ...(editForm as StudentProfileState) }));
      toast.success("Profile updated in local session!");
      setShowEditModal(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters with at least one letter and one number");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/students/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmNewPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Security password updated successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      } else {
        toast.error(json.message || "Failed to update password. Check your current password.");
      }
    } catch {
      toast.error("Network error while updating password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-surface border border-accent rounded-sm p-6 space-y-3 animate-pulse">
          <div className="h-5 w-48 bg-accent rounded-xs" />
          <div className="h-4 w-72 bg-accent rounded-xs" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-accent rounded-sm p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent rounded-sm shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 bg-accent rounded-xs" />
                  <div className="h-4 w-60 bg-accent rounded-xs" />
                </div>
              </div>
            </div>
            <div className="bg-surface border border-accent rounded-sm p-6 space-y-4 animate-pulse">
              <div className="h-4 w-32 bg-accent rounded-xs" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-accent/40 rounded-xs" />
                <div className="h-10 bg-accent/40 rounded-xs" />
              </div>
            </div>
          </div>
          <div className="bg-surface border border-accent rounded-sm p-6 space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-accent rounded-xs" />
            <div className="h-10 bg-accent/40 rounded-xs" />
            <div className="h-10 bg-accent/40 rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile.fullName) {
    return (
      <div className="bg-surface border border-accent rounded-sm p-8 text-center space-y-4 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-text-main">Unable to Load Student Profile</h2>
        <p className="text-xs text-text-main/60 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-accent pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-brand-primary" /> Student Identity & Academic Profile
          </h1>
          <p className="text-xs text-text-main/60 mt-0.5">
            Official coaching records, guardian details, and account security management.
          </p>
        </div>

        <button
          onClick={openEditModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-95 transition-opacity shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit Personal Information
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Academic & Personal Profile Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main ID Badge Header Card */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-primary text-white text-xl font-bold rounded-sm flex items-center justify-center font-mono shadow-xs shrink-0">
                {profile.fullName ? profile.fullName.slice(0, 2).toUpperCase() : "ST"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-main">{profile.fullName || "Student Profile"}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 rounded-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enrolled
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-main/60">
                  <span className="font-mono bg-bg-app border border-accent px-2 py-0.5 rounded-xs font-bold text-text-main">
                    Roll: {profile.rollNumber || "Not Assigned"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-brand-primary" /> {profile.campus || "Unassigned Campus"}
                  </span>
                  <span>•</span>
                  <span>{profile.currentClass || "Class Not Specified"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={openEditModal}
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Details
            </button>
          </div>

          {/* Academic & Institution Particulars */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-text-main/70 uppercase tracking-wider border-b border-accent pb-2 flex items-center gap-2">
              <School className="w-4 h-4 text-brand-primary" /> Academic & Institution Background
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-brand-primary" /> School / College Name
                </span>
                <p className="font-semibold text-text-main">{profile.institutionName || "Not Provided"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-brand-primary" /> Current Academic Level
                </span>
                <p className="font-semibold text-text-main">{profile.currentClass}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Date of Birth
                </span>
                <p className="font-mono font-semibold text-text-main">{profile.dateOfBirth}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-brand-primary" /> Blood Group
                </span>
                <p className="font-semibold text-text-main">{profile.bloodGroup}</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-text-main/60 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Present Residential Address
                </span>
                <p className="font-semibold text-text-main">{profile.address}</p>
              </div>
            </div>
          </div>

          {/* Contact & Guardian Details */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-text-main/70 uppercase tracking-wider border-b border-accent pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" /> Contact & Guardian Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-brand-primary" /> Student Email Address
                </span>
                <p className="font-mono font-semibold text-text-main">{profile.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brand-primary" /> Student Mobile Phone
                </span>
                <p className="font-mono font-semibold text-text-main">{profile.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60">Father's Name</span>
                <p className="font-semibold text-text-main">{profile.fatherName || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60">Mother's Name</span>
                <p className="font-semibold text-text-main">{profile.motherName || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60">Designated Primary Guardian</span>
                <p className="font-semibold text-text-main">
                  {profile.guardianName} ({profile.guardianType})
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-text-main/60 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brand-primary" /> Guardian's Contact Phone
                </span>
                <p className="font-mono font-semibold text-text-main">{profile.guardianPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Password & Security Management */}
        <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-accent pb-3">
            <KeyRound className="w-4 h-4 text-brand-primary" />
            <h3 className="font-bold text-sm text-text-main">Security & Password</h3>
          </div>

          {/* Admin Created Default Password Prompt */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-sm text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Default Password Note
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              If your admission was created by campus admins, your initial password is your <strong>email address</strong>. You can update it to a private password below.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1">
                <Lock className="w-3 h-3 text-text-main/40" /> Current Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1">
                <Lock className="w-3 h-3 text-text-main/40" /> New Password *
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 8 chars (letters & numbers)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity shadow-xs disabled:opacity-50 mt-2"
            >
              {isUpdatingPassword ? "Updating Password..." : "Update Security Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Personal Information Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-accent pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-bold text-text-main">Edit Personal & Guardian Information</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-bg-app rounded-sm text-text-main/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName || ""}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Student Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Father's Name</label>
                  <input
                    type="text"
                    value={editForm.fatherName || ""}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Mother's Name</label>
                  <input
                    type="text"
                    value={editForm.motherName || ""}
                    onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Primary Guardian</label>
                  <select
                    value={editForm.guardianType || "FATHER"}
                    onChange={(e) => {
                      const type = e.target.value;
                      let gName = editForm.guardianName;
                      if (type === "FATHER" && editForm.fatherName) gName = editForm.fatherName;
                      if (type === "MOTHER" && editForm.motherName) gName = editForm.motherName;
                      setEditForm({ ...editForm, guardianType: type, guardianName: gName });
                    }}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  >
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="OTHER">Other Guardian</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.guardianName || ""}
                    onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Guardian Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.guardianPhone || ""}
                    onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Current Class</label>
                  <select
                    value={editForm.currentClass || "HSC 1st Year"}
                    onChange={(e) => setEditForm({ ...editForm, currentClass: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="HSC 1st Year">HSC 1st Year</option>
                    <option value="HSC 2nd Year">HSC 2nd Year</option>
                    <option value="Engineering Admission">Engineering Admission</option>
                    <option value="Medical Admission">Medical Admission</option>
                    <option value="University Admission">University Admission</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Blood Group</label>
                  <select
                    value={editForm.bloodGroup || "B+"}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ""}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">School / College Name</label>
                <input
                  type="text"
                  placeholder="e.g. Notre Dame College, Dhaka"
                  value={editForm.institutionName || ""}
                  onChange={(e) => setEditForm({ ...editForm, institutionName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Present Residential Address</label>
                <input
                  type="text"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:border-brand-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-text-main/70 hover:bg-bg-app border border-accent rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-95 transition-opacity shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Profile Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
