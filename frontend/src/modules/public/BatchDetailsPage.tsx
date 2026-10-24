import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Award,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
  Copy,
  DoorOpen,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod, BatchFeeType } from "../../types/index.js";
import { setDynamicPageTitle, setDynamicFavicon } from "../../utils/dynamicFavicon.js";

interface FacultyMember {
  name?: string;
  fullName?: string;
  subject?: string;
  qualification?: string;
  avatarUrl?: string;
}

interface ClassModule {
  classNumber?: number;
  weekOrClass?: string;
  title?: string;
  topic?: string;
  date?: string;
  subject?: string;
  teacherId?: string | null;
  room?: string | null;
  topics?: string[];
}

interface ScheduledExamItem {
  id: string;
  title: string;
  subject: string;
  examType: string;
  examDate: string;
  totalMarks: number;
  passMarks?: number | null;
  instructions?: string | null;
}

interface RoutineItem {
  day: string;
  time: string;
  subject: string;
  room?: string;
}

interface BatchDetail {
  id: string;
  name: string;
  title: string;
  coverImage?: string | null;
  classroom?: string | null;
  classTime?: string | null;
  scheduleTime?: string | null;
  startDate: string;
  endDate?: string | null;
  seatLimit: number;
  enrolledCount: number;
  availableSeats: number;
  isHouseFull: boolean;
  totalClasses: number;
  totalExams: number;
  classesPerWeek: number;
  daysOfWeek: string[];
  feeAmount: number;
  feeType: BatchFeeType;
  subjects: string[];
  subjectTeachers: FacultyMember[];
  classModules: ClassModule[];
  routine: RoutineItem[];
  exams?: ScheduledExamItem[];
  academicClass?: {
    id: string;
    name: string;
    code: string;
    academicYear?: string;
    category?: string;
  } | null;
  branch: {
    id: string;
    name: string;
    code: string;
    address: string;
    phone?: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
    feeAmount: number;
  } | null;
}

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"modules" | "routine" | "exams" | "faculty" | "admission">("modules");

  // Payment channels from institution settings
  const [paymentChannels, setPaymentChannels] = useState<any[]>([]);

  // Self-enrollment modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrollSuccessData, setEnrollSuccessData] = useState<any | null>(null);

  const [enrollForm, setEnrollForm] = useState({
    paymentMethod: PaymentMethod.BKASH,
    transactionId: "",
    senderPhone: "",
    paidAmount: 0,
    studentNotes: "",
  });

  // Current logged in user
  const currentUserStr = localStorage.getItem("cms_user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (!id) return;
    fetchBatchDetail();
    fetchOrgDetails();
  }, [id]);

  const fetchBatchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/batches/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load batch details");
      }
      setBatch(json.data);
      setDynamicPageTitle(window.location.pathname, json.data.name || json.data.title);
      setEnrollForm((prev) => ({
        ...prev,
        paidAmount: Number(json.data.feeAmount || 0),
      }));
    } catch (err: any) {
      setError(err.message || "Error retrieving batch details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgDetails = async () => {
    try {
      const res = await fetch("/api/v1/public/landing");
      const json = await res.json();
      if (res.ok && json.success && json.data?.organization) {
        const org = json.data.organization;
        setDynamicFavicon(org.faviconUrl || org.logoUrl, org.name, org.logoUrl);
        if (org.paymentChannels) {
          setPaymentChannels(
            org.paymentChannels.filter((c: any) => c.isActive)
          );
        }
      }
    } catch (err) {
      console.warn("Could not fetch institution payment channels:", err);
    }
  };

  const handleOpenEnrollModal = () => {
    const liveToken = localStorage.getItem("cms_token");
    const liveUserStr = localStorage.getItem("cms_user");
    let liveUser = null;
    try {
      liveUser = liveUserStr ? JSON.parse(liveUserStr) : null;
    } catch {
      liveUser = null;
    }

    if (!liveToken || !liveUser) {
      toast.info("Please log in or register as a student to apply for admission.", {
        action: {
          label: "Log In",
          onClick: () => navigate(`/login?redirect=/batches/${id}`),
        },
      });
      return;
    }
    setIsEnrollModalOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleSelfEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const liveToken = localStorage.getItem("cms_token");
    if (!liveToken) {
      toast.error("Authentication required. Please log in first.");
      navigate(`/login?redirect=/batches/${id}`);
      return;
    }

    if (!enrollForm.transactionId.trim()) {
      toast.error("Please enter the Transaction ID / Reference Number.");
      return;
    }
    if (!enrollForm.senderPhone.trim()) {
      toast.error("Please enter the sender phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/academics/batches/${id}/self-enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${liveToken}`,
        },
        body: JSON.stringify({
          paymentMethod: enrollForm.paymentMethod,
          transactionId: enrollForm.transactionId.trim(),
          senderPhone: enrollForm.senderPhone.trim(),
          paidAmount: Number(enrollForm.paidAmount),
          studentNotes: enrollForm.studentNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Enrollment request could not be completed");
      }

      setEnrollSuccessData(json.data);
      toast.success("Admission application submitted!", {
        description: "Your seat request has been placed in pending verification.",
      });
      // Refresh batch data to show updated seat numbers
      fetchBatchDetail();
    } catch (err: any) {
      toast.error("Admission Request Failed", {
        description: err.message || "Failed to process enrollment request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[95vw] mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-48 bg-accent animate-pulse rounded-sm" />
        <div className="h-64 bg-accent animate-pulse rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-accent animate-pulse rounded-sm" />
          <div className="h-28 bg-accent animate-pulse rounded-sm" />
          <div className="h-28 bg-accent animate-pulse rounded-sm" />
          <div className="h-28 bg-accent animate-pulse rounded-sm" />
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-text-main">Offline Batch Not Found</h2>
        <p className="text-sm text-text-muted">{error || "The requested batch does not exist or has been archived."}</p>
        <Link
          to="/"
          className="inline-block mt-4 px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-90"
        >
          Return to Homepage
        </Link>
      </div>
    );
  }

  const seatPercent = Math.min(100, Math.round((batch.enrolledCount / batch.seatLimit) * 100));

  return (
    <div className="min-h-screen bg-bg-app pb-20">
      <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Hero Banner Section */}
        <div className="bg-surface border border-accent rounded-sm overflow-hidden shadow-sm">
          {batch.coverImage ? (
            <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
              <img
                src={batch.coverImage}
                alt={batch.title}
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 space-y-2 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  {batch.academicClass && (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-brand-primary text-white rounded-sm tracking-wider uppercase">
                      {batch.academicClass.name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-white/20 backdrop-blur rounded-sm">
                    {batch.branch.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-sm ${
                      batch.isHouseFull
                        ? "bg-rose-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {batch.isHouseFull ? "Housefull" : "Admissions Open"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                  {batch.title || batch.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  Offline in-person classroom coaching program with physical attendance tracking, weekly model exams, and dedicated faculty mentors.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-gradient-to-r from-brand-primary/10 via-surface to-accent/20 border-b border-accent space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {batch.academicClass && (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-brand-primary text-white rounded-sm tracking-wider uppercase">
                    {batch.academicClass.name}
                  </span>
                )}
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-accent rounded-sm text-text-main">
                  {batch.branch.name}
                </span>
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-sm ${
                    batch.isHouseFull ? "bg-rose-500 text-white" : "bg-emerald-600 text-white"
                  }`}
                >
                  {batch.isHouseFull ? "Housefull" : "Admissions Open"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
                {batch.title || batch.name}
              </h1>
              <p className="text-xs sm:text-sm text-text-muted max-w-2xl">
                Offline in-person classroom coaching program at {batch.branch.name} ({batch.branch.address}).
              </p>
            </div>
          )}

          {/* Seat Capacity Progress & Alert Banner */}
          <div className="p-5 sm:p-6 bg-accent-subtle/30 border-t border-accent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-text-main">
                    <Users className="w-4 h-4 text-brand-primary" />
                    Physical Classroom Seat Occupancy:
                  </span>
                  <span className="text-text-main">
                    <strong className="text-brand-primary">{batch.enrolledCount}</strong> of {batch.seatLimit} Confirmed Seats
                    ({batch.availableSeats} remaining)
                  </span>
                </div>
                <div className="w-full bg-accent h-2.5 rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      seatPercent >= 90
                        ? "bg-rose-500"
                        : seatPercent >= 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${seatPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Program Fee</div>
                  <div className="text-xl font-bold text-text-main">
                    ৳{batch.feeAmount.toLocaleString()}
                    <span className="text-xs font-normal text-text-muted ml-1">
                      ({batch.feeType.replace("_", " ")})
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleOpenEnrollModal}
                  disabled={batch.isHouseFull}
                  className={`px-5 py-2.5 text-xs font-bold rounded-sm shadow-sm transition-all flex items-center gap-1.5 ${
                    batch.isHouseFull
                      ? "bg-accent text-text-muted cursor-not-allowed"
                      : "bg-brand-primary text-white hover:bg-brand-hover"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {batch.isHouseFull ? "Housefull" : "Enroll & Reserve Seat"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Card Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-accent p-4 rounded-sm flex items-start gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">Classroom Classes</div>
              <div className="text-sm font-bold text-text-main mt-0.5">{batch.totalClasses} Lectures</div>
              <div className="text-[11px] text-text-muted">{batch.classesPerWeek} classes per week</div>
            </div>
          </div>

          <div className="bg-surface border border-accent p-4 rounded-sm flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">Physical Exams</div>
              <div className="text-sm font-bold text-text-main mt-0.5">{batch.totalExams} Model Tests</div>
              <div className="text-[11px] text-text-muted">Weekly evaluations & ranklists</div>
            </div>
          </div>

          <div className="bg-surface border border-accent p-4 rounded-sm flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">Schedule & Room</div>
              <div className="text-sm font-bold text-text-main mt-0.5">
                {batch.classTime || batch.scheduleTime || "TBD"}
              </div>
              <div className="text-[11px] text-text-muted">
                {batch.classroom ? `Classroom: ${batch.classroom}` : "Main Campus Hall"}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-accent p-4 rounded-sm flex items-start gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">Campus Location</div>
              <div className="text-sm font-bold text-text-main mt-0.5">{batch.branch.name}</div>
              <div className="text-[11px] text-text-muted truncate max-w-[170px]">{batch.branch.address}</div>
            </div>
          </div>
        </div>

        {/* Days of Week Badges */}
        {batch.daysOfWeek && batch.daysOfWeek.length > 0 && (
          <div className="bg-surface border border-accent p-4 rounded-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-semibold text-text-main">Weekly Physical Session Days:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {batch.daysOfWeek.map((day, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-bold rounded-sm"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Tabs Section */}
        <div className="bg-surface border border-accent rounded-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-accent bg-accent-subtle/20 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab("modules")}
              className={`px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "modules"
                  ? "border-brand-primary text-brand-primary bg-surface"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Syllabus & Modules Plan ({batch.classModules?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("exams")}
              className={`px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "exams"
                  ? "border-brand-primary text-brand-primary bg-surface"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Exams & Model Tests ({batch.exams?.length || batch.totalExams || 0})
            </button>

            <button
              onClick={() => setActiveTab("routine")}
              className={`px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "routine"
                  ? "border-brand-primary text-brand-primary bg-surface"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Class Timetable & Routine ({batch.routine?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("faculty")}
              className={`px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "faculty"
                  ? "border-brand-primary text-brand-primary bg-surface"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Assigned Faculty Mentors ({batch.subjectTeachers?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("admission")}
              className={`px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "admission"
                  ? "border-brand-primary text-brand-primary bg-surface"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Admission & Payment Instructions
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6">
            {/* Tab 1: Class Modules / Syllabus */}
            {activeTab === "modules" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-accent">
                  <h3 className="text-sm font-bold text-text-main">
                    Week-by-Week & Lecture Syllabus Breakdown
                  </h3>
                  <span className="text-xs text-text-muted">
                    Total {batch.classModules?.length || batch.totalClasses || 0} physical lectures planned
                  </span>
                </div>

                {batch.classModules && batch.classModules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {batch.classModules.map((mod, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-bg-app border border-accent rounded-sm space-y-2 hover:border-brand-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-sm uppercase tracking-wider shrink-0">
                            {mod.classNumber ? `Lecture ${mod.classNumber}` : (mod.weekOrClass || `Lecture 0${idx + 1}`)}
                          </span>
                          {mod.subject && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-sm">
                              {mod.subject}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-text-main">
                          {mod.topic || mod.title || `Scheduled Lecture ${idx + 1}`}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted pt-1">
                          {mod.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                              <span>{new Date(mod.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                            </div>
                          )}
                          {(mod.room || batch.classroom) && (
                            <div className="flex items-center gap-1">
                              <DoorOpen className="w-3.5 h-3.5 text-brand-primary" />
                              <span>{mod.room || batch.classroom}</span>
                            </div>
                          )}
                        </div>
                        {mod.topics && mod.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-accent/40">
                            {mod.topics.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[11px] px-2 py-0.5 bg-accent rounded-sm text-text-muted"
                              >
                                • {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-muted text-xs space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto opacity-40" />
                    <p>Syllabus modules for this batch will be distributed during class orientation.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Scheduled Exams */}
            {activeTab === "exams" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-accent">
                  <h3 className="text-sm font-bold text-text-main">
                    Scheduled Model Tests & Regular Evaluation Exams
                  </h3>
                  <span className="text-xs text-text-muted">
                    Total {batch.exams?.length || batch.totalExams || 0} exams scheduled
                  </span>
                </div>

                {batch.exams && batch.exams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {batch.exams.map((exam, idx) => (
                      <div
                        key={exam.id || idx}
                        className="p-4 bg-bg-app border border-accent rounded-sm space-y-3 hover:border-brand-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-sm uppercase tracking-wider">
                            {exam.examType || "EXAM"}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-sm">
                            {exam.subject}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-main">{exam.title}</h4>
                          {exam.instructions && (
                            <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                              {exam.instructions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-accent/60">
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                            <span>
                              {exam.examDate
                                ? new Date(exam.examDate).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Date TBA"}
                            </span>
                          </div>
                          <div className="font-semibold text-text-main">
                            Total: <span className="text-brand-primary font-bold">{exam.totalMarks}</span> Marks
                            {exam.passMarks ? ` (Pass: ${exam.passMarks})` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-muted text-xs space-y-2">
                    <Trophy className="w-8 h-8 mx-auto opacity-40" />
                    <p>Model test schedules and evaluation exams will be uploaded as the term progresses.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Weekly Routine */}
            {activeTab === "routine" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-accent">
                  <h3 className="text-sm font-bold text-text-main">Weekly Classroom Timetable</h3>
                  <span className="text-xs text-text-muted">
                    {batch.classroom ? `Classroom: ${batch.classroom}` : `Campus: ${batch.branch.name}`}
                  </span>
                </div>

                {batch.routine && batch.routine.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {batch.routine.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-bg-app border border-accent rounded-sm space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-brand-primary">{item.day}</span>
                          <span className="text-[11px] px-2 py-0.5 bg-accent text-text-muted rounded-sm">
                            {item.room || batch.classroom || "Room 101"}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-text-main">{item.subject}</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Clock className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-muted text-xs space-y-2">
                    <Calendar className="w-8 h-8 mx-auto opacity-40" />
                    <p>Standard schedule: {batch.classTime || batch.scheduleTime || "Schedule announced upon batch launch."}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Faculty Mentors */}
            {activeTab === "faculty" && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-accent">
                  <h3 className="text-sm font-bold text-text-main">Batch Faculty & Subject Mentors</h3>
                  <p className="text-xs text-text-muted">
                    Experienced instructors assigned specifically to mentor this offline classroom batch.
                  </p>
                </div>

                {batch.subjectTeachers && batch.subjectTeachers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {batch.subjectTeachers.map((fac: FacultyMember, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-bg-app border border-accent rounded-sm flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-sm bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {fac.name ? fac.name.charAt(0) : "T"}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-text-main">{fac.name}</div>
                          <div className="text-xs font-semibold text-brand-primary">{fac.subject}</div>
                          {fac.qualification && (
                            <div className="text-[11px] text-text-muted">{fac.qualification}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-muted text-xs space-y-2">
                    <GraduationCap className="w-8 h-8 mx-auto opacity-40" />
                    <p>Faculty panel for this batch includes certified campus mentors.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Admission & Payment Instructions */}
            {activeTab === "admission" && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-accent">
                  <h3 className="text-sm font-bold text-text-main">
                    Admission Procedure & Fee Payment Channels
                  </h3>
                  <p className="text-xs text-text-muted">
                    Learn how to secure your physical classroom seat before capacity is reached.
                  </p>
                </div>

                {/* Important Disclaimer Alert */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-start gap-3 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold">Offline Seat Confirmation Policy</div>
                    <p>
                      Submitting an admission request places your application in{" "}
                      <span className="font-semibold underline">Pending Verification</span>.
                      Seats are officially confirmed in order of verified payment. If physical batch capacity is
                      filled before your transaction is verified, your admission will be canceled and your fees
                      will be refunded immediately.
                    </p>
                  </div>
                </div>

                {/* Payment Channels Grid */}
                {paymentChannels && paymentChannels.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                      Official Coaching Accounts
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {paymentChannels.map((ch, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-bg-app border border-accent rounded-sm space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold px-1.5 py-0.5 bg-brand-primary text-white rounded-sm">
                              {ch.provider}
                            </span>
                            <span className="text-[10px] text-text-muted uppercase font-semibold">
                              {ch.accountType}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-text-main">
                              {ch.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ch.accountNumber, `${ch.provider} number`)}
                              className="p-1 hover:bg-accent rounded-sm text-text-muted"
                              title="Copy number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {ch.instructions && (
                            <p className="text-[10px] text-text-muted">{ch.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-bg-app border border-accent rounded-sm text-xs text-text-muted space-y-2">
                    <div className="font-semibold text-text-main">Cash or Card at Campus</div>
                    <p>
                      You can also visit {batch.branch.name} at {batch.branch.address} to pay directly at the admissions desk.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleOpenEnrollModal}
                    disabled={batch.isHouseFull}
                    className="px-6 py-2.5 text-xs font-bold bg-brand-primary text-white rounded-sm hover:bg-brand-hover shadow-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Proceed to Admission Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SELF-ADMISSION MODAL (STUDENT CHECKOUT) */}
      {/* ============================================================ */}
      {isEnrollModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-accent w-full max-w-lg rounded-sm shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-accent flex justify-between items-center bg-accent-subtle/30">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-brand-primary" />
                  Admission Checkout: {batch.name}
                </h3>
                <p className="text-[11px] text-text-muted">
                  Campus: {batch.branch.name} • Fee: ৳{batch.feeAmount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setEnrollSuccessData(null);
                }}
                className="p-1 text-text-muted hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {enrollSuccessData ? (
                /* Success View */
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-text-main">
                      Application Submitted Successfully!
                    </h4>
                    <p className="text-xs text-text-muted max-w-sm mx-auto">
                      Your admission request has been logged and is currently in{" "}
                      <strong className="text-brand-primary">Pending Verification</strong>.
                    </p>
                  </div>

                  <div className="bg-bg-app p-4 border border-accent rounded-sm text-xs text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Student:</span>
                      <span className="font-semibold text-text-main">{currentUser?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Batch:</span>
                      <span className="font-semibold text-text-main">{batch.title || batch.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Transaction ID:</span>
                      <span className="font-mono font-bold text-brand-primary">{enrollForm.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Amount:</span>
                      <span className="font-bold text-text-main">৳{enrollForm.paidAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm text-[11px] text-amber-900 dark:text-amber-200 text-left">
                    <strong>Next Steps:</strong> An administrator at {batch.branch.name} will verify your payment details shortly. Once approved, your seat will be permanently locked and an invoice will be generated in your Student Portal.
                  </div>

                  <div className="pt-2 flex gap-3 justify-center">
                    <Link
                      to="/student"
                      className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-90"
                    >
                      Go to Student Portal
                    </Link>
                    <button
                      onClick={() => {
                        setIsEnrollModalOpen(false);
                        setEnrollSuccessData(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold border border-accent rounded-sm hover:bg-accent"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Application Form */
                <form onSubmit={handleSelfEnroll} className="space-y-4">
                  {/* Anti-Abuse Seat Warning Banner */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold">Important Notice on Seat Reservation</div>
                      <p className="text-[11px] leading-relaxed">
                        Online enrollment requests are verified by campus administrators. If batch seat capacity
                        is reached before your payment is verified, your admission will be canceled and your fees
                        will be refunded in full.
                      </p>
                    </div>
                  </div>

                  {/* Student details display */}
                  <div className="bg-bg-app p-3 border border-accent rounded-sm text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Applicant Name:</span>
                      <span className="font-semibold text-text-main">{currentUser?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Email:</span>
                      <span className="text-text-main">{currentUser?.email}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Payment Method</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { method: PaymentMethod.BKASH, label: "bKash" },
                        { method: PaymentMethod.NAGAD, label: "Nagad" },
                        { method: PaymentMethod.ROCKET, label: "Rocket" },
                        { method: PaymentMethod.CASH, label: "Cash @ Campus" },
                      ].map((item) => (
                        <button
                          key={item.method}
                          type="button"
                          onClick={() => setEnrollForm({ ...enrollForm, paymentMethod: item.method })}
                          className={`py-2 px-1 text-xs font-bold rounded-sm border text-center transition-all ${
                            enrollForm.paymentMethod === item.method
                              ? "bg-brand-primary text-white border-brand-primary"
                              : "bg-surface border-accent text-text-muted hover:border-text-main"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Matching Payment Channel Number Display */}
                  {paymentChannels.length > 0 &&
                    enrollForm.paymentMethod !== PaymentMethod.CASH && (
                      <div className="p-3 bg-accent-subtle/40 border border-accent rounded-sm text-xs space-y-1">
                        <span className="text-[10px] text-text-muted uppercase font-bold">
                          Send Money / Payment to Official Account:
                        </span>
                        {paymentChannels
                          .filter((c) => c.provider === enrollForm.paymentMethod)
                          .map((ch, idx) => (
                            <div key={idx} className="flex items-center justify-between font-mono font-bold text-brand-primary pt-0.5">
                              <span>{ch.accountNumber} ({ch.accountType})</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(ch.accountNumber, "Account number")}
                                className="text-text-muted hover:text-text-main p-1"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                  {/* Transaction ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">
                      {enrollForm.paymentMethod === PaymentMethod.CASH
                        ? "Deposit Slip / Campus Receipt Number *"
                        : "TrxID / Transaction Reference ID *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        enrollForm.paymentMethod === PaymentMethod.CASH
                          ? "e.g. RCPT-2026-001"
                          : "e.g. BKA8739482X"
                      }
                      value={enrollForm.transactionId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, transactionId: e.target.value })}
                      className="w-full text-xs p-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>

                  {/* Sender Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">
                      Sender Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01712345678"
                      value={enrollForm.senderPhone}
                      onChange={(e) => setEnrollForm({ ...enrollForm, senderPhone: e.target.value })}
                      className="w-full text-xs p-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>

                  {/* Paid Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">
                      Paid Amount (BDT) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={enrollForm.paidAmount}
                      onChange={(e) => setEnrollForm({ ...enrollForm, paidAmount: Number(e.target.value) })}
                      className="w-full text-xs p-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-bold"
                    />
                    <div className="text-[11px] text-text-muted">
                      Batch Fee: ৳{batch.feeAmount.toLocaleString()} ({batch.feeType.replace("_", " ")})
                    </div>
                  </div>

                  {/* Student Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main">
                      Notes for Campus Administration (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes or remarks regarding your payment or guardian info..."
                      value={enrollForm.studentNotes}
                      onChange={(e) => setEnrollForm({ ...enrollForm, studentNotes: e.target.value })}
                      className="w-full text-xs p-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end gap-2 border-t border-accent">
                    <button
                      type="button"
                      onClick={() => setIsEnrollModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold border border-accent rounded-sm hover:bg-accent text-text-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 text-xs font-bold bg-brand-primary text-white rounded-sm hover:bg-brand-hover shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? "Submitting Application..." : "Submit Admission Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default BatchDetailsPage;
