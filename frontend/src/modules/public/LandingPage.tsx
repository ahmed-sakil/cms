import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Send,
  BellRing,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Star,
  Trophy,
  MessageSquare,
  ArrowUp,
  Phone,
  BookOpen,
  Building2,
  Search,
  Download,
  Briefcase,
} from "lucide-react";
import type { PosterSlide, PaymentChannel } from "../../types/index.js";

interface TeacherItem {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  branchName?: string | null;
  specialization: string;
  qualification: string;
  bio?: string | null;
}

interface StandingsRecord {
  standing: number;
  studentName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  avatarUrl?: string | null;
}

interface EvaluatedExam {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  totalMarks: number;
  passMarks: number;
  batchId: string;
  batchName: string;
  batchTitle: string;
  academicClass: string;
  branchName: string;
  standings: StandingsRecord[];
}

interface StudentAchievementItem {
  id: string;
  studentName: string;
  avatarUrl?: string | null;
  batchName: string;
  achievement: string;
  college?: string | null;
  year: string;
  posterUrl?: string | null;
}

interface TestimonialItem {
  id?: string;
  name: string;
  role: string;
  phone?: string | null;
  message: string;
  rating: number;
}

interface StudyTipItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  author: string;
  content: string;
}

export const LandingPage: React.FC = () => {
  // Inquiry form
  const [inquiry, setInquiry] = useState({
    studentName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Review modal & submission
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    phone: "",
    role: "STUDENT",
    rating: 5,
    message: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Modals
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [isAllNoticesOpen, setIsAllNoticesOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<StudyTipItem | null>(null);
  const [selectedExamModal, setSelectedExamModal] = useState<EvaluatedExam | null>(null);
  const [examSearchFilter, setExamSearchFilter] = useState<string>("");

  // Exam Results Filter (by Batch)
  const [selectedExamBatch, setSelectedExamBatch] = useState<string>("ALL");

  // Organization info
  const [organization, setOrganization] = useState<{
    name?: string;
    tagline?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    establishedYear?: string;
    whatsappNumber?: string;
    paymentChannels?: PaymentChannel[];
    posters?: PosterSlide[];
  }>({});

  // Core Data Lists
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [evaluatedExams, setEvaluatedExams] = useState<EvaluatedExam[]>([]);
  const [achievements, setAchievements] = useState<StudentAchievementItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [studyTips, setStudyTips] = useState<StudyTipItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const teacherScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTeachers = (direction: "left" | "right") => {
    if (teacherScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      teacherScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Read parent context from PublicLayout to avoid duplicate network queries
  const outletContext = useOutletContext<{ landingData?: any; isLoading?: boolean }>() || {};
  const [loading, setLoading] = useState<boolean>(!outletContext.landingData);

  const activeSlides =
    organization.posters && organization.posters.filter((p) => p.isActive && p.imageUrl).length > 0
      ? organization.posters
          .filter((p) => p.isActive && p.imageUrl)
          .sort((a, b) => (a.order || 1) - (b.order || 1))
      : [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto slide loop (5.5s) if multiple real slides exist
  useEffect(() => {
    if (!isPlaying || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, activeSlides.length]);

  const handlePrevSlide = () => {
    if (activeSlides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNextSlide = () => {
    if (activeSlides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  // Sync data from PublicLayout or direct fetch
  const applyLandingPayload = (d: any) => {
    if (d.organization) setOrganization(d.organization);
    if (d.availableBatches) setAvailableBatches(d.availableBatches);
    if (d.notices) setNotices(d.notices);
    if (d.branches) setBranches(d.branches);
    if (d.evaluatedExams) setEvaluatedExams(d.evaluatedExams);
    if (d.achievements) setAchievements(d.achievements);
    if (d.testimonials) setTestimonials(d.testimonials);
    if (d.studyTips) setStudyTips(d.studyTips);
    if (d.teachers) setTeachers(d.teachers);
  };

  useEffect(() => {
    if (outletContext.landingData) {
      applyLandingPayload(outletContext.landingData);
      setLoading(false);
    } else if (outletContext.isLoading === false) {
      setLoading(false);
    }
  }, [outletContext.landingData, outletContext.isLoading]);

  // Fallback direct fetch if accessed directly
  useEffect(() => {
    if (outletContext.landingData) return;
    let isMounted = true;
    const fetchLanding = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/public/landing");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data && isMounted) {
          applyLandingPayload(json.data);
        }
      } catch (err) {
        console.warn("Could not fetch complete public landing data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLanding();
    return () => {
      isMounted = false;
    };
  }, [outletContext.landingData]);

  // Filter exam results by selected batch
  const filteredExams = evaluatedExams.filter((e) => {
    return selectedExamBatch === "ALL" || e.batchId === selectedExamBatch;
  });

  const handleExamBatchChange = (batchId: string) => {
    setSelectedExamBatch(batchId);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.studentName || !inquiry.phone) {
      toast.error("Please provide student name and phone number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to submit inquiry");
      toast.success("Inquiry submitted successfully!", {
        description: "Our admission counselor will contact you shortly.",
      });
      setInquiry({ studentName: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.message) {
      toast.error("Please enter your name and message/advice");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/v1/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Submission failed");
      toast.success("Thank you for your feedback & advice!", {
        description: "Your review has been recorded.",
      });
      setIsReviewModalOpen(false);
      setReviewForm({ name: "", phone: "", role: "STUDENT", rating: 5, message: "" });
      // Append to list locally
      if (json.data) {
        setTestimonials((prev) => [json.data, ...prev]);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not save review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const slide = activeSlides[currentSlide] || null;

  return (
    <div className="space-y-16 pb-12 bg-bg-app text-text-main">
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. HERO POSTER & LATEST NOTICES (2:1 RATIO ON WIDE SCREENS) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 pt-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          {/* Hero Poster / Banner (2 Columns on Wide Screens) */}
          <div className="xl:col-span-2 flex flex-col justify-between">
            {loading ? (
              <div className="relative w-full rounded-sm overflow-hidden border border-theme bg-surface shadow-xs h-[240px] xs:h-[300px] sm:h-[400px] md:h-[440px] xl:h-[480px] p-6 sm:p-12 flex flex-col justify-end space-y-3 animate-pulse">
                <div className="h-4 w-28 bg-accent rounded-xs" />
                <div className="h-8 w-3/4 max-w-lg bg-accent rounded-xs" />
                <div className="h-4 w-1/2 max-w-md bg-accent/60 rounded-xs" />
                <div className="flex gap-2.5 pt-2">
                  <div className="h-9 w-32 bg-accent rounded-sm" />
                  <div className="h-9 w-32 bg-accent/50 rounded-sm" />
                </div>
              </div>
            ) : activeSlides.length > 0 && slide ? (
              <div
                className="relative w-full rounded-sm overflow-hidden border border-theme bg-slate-950 shadow-md group h-[220px] xs:h-[280px] sm:h-[380px] md:h-[440px] xl:h-[480px]"
                onMouseEnter={() => setIsPlaying(false)}
                onMouseLeave={() => setIsPlaying(true)}
              >
                {/* Real Uploaded Poster Image */}
                <img
                  key={slide.imageUrl}
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                />

                {/* Sleek bottom gradient overlay only where caption text sits */}
                {(slide.title || slide.subtitle) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 sm:pt-16 pb-4 sm:pb-6 px-4 sm:px-8 flex flex-col justify-end">
                    <div className="max-w-3xl space-y-1.5 sm:space-y-2">
                      <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md line-clamp-2">
                        {slide.title}
                      </h1>
                      {slide.subtitle && (
                        <p className="text-[11px] sm:text-xs md:text-sm text-slate-200 line-clamp-1 sm:line-clamp-2 max-w-2xl drop-shadow-sm font-normal">
                          {slide.subtitle}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1 sm:pt-2">
                        <a
                          href={slide.actionUrl || "#batches"}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-primary text-white font-semibold text-xs rounded-sm hover:opacity-90 shadow-sm flex items-center gap-1.5"
                        >
                          {slide.actionText || "Explore Batches"} <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href="#inquiry"
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 text-white border border-white/30 backdrop-blur-xs font-semibold text-xs rounded-sm hover:bg-white/30"
                        >
                          Admission Inquiry
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Arrows */}
                {activeSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      aria-label="Previous Slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-sm bg-black/40 hover:bg-black/70 border border-white/20 text-white backdrop-blur-xs transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      aria-label="Next Slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-sm bg-black/40 hover:bg-black/70 border border-white/20 text-white backdrop-blur-xs transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Slide Indicators */}
                {activeSlides.length > 1 && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 border border-white/20 rounded-sm backdrop-blur-xs">
                    {activeSlides.map((s, idx) => (
                      <button
                        key={s.id || idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`transition-all rounded-xs ${
                          currentSlide === idx ? "w-5 h-1.5 bg-brand-primary" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                        }`}
                        title={s.title}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Institutional Branded Hero (Clean, Professional, Zero Fake Photos) */
              <div className="relative w-full rounded-sm overflow-hidden border border-theme bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-md p-6 sm:p-10 md:p-12 xl:h-[480px] flex flex-col justify-center">
                <div className="max-w-2xl space-y-3.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-brand-primary/20 border border-brand-primary/40 text-brand-primary text-xs font-bold tracking-wide">
                    <Award className="w-3.5 h-3.5" />
                    <span>{organization.name ? `${organization.name} Official Portal` : "Academic Excellence"}</span>
                    {organization.establishedYear && <span>• Est. {organization.establishedYear}</span>}
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {organization.name ? `Welcome to ${organization.name}` : "Comprehensive Coaching & Academic Programs"}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {organization.tagline ||
                      "Providing disciplined classroom coaching, model test series, and dedicated faculty mentorship to prepare students for academic excellence."}
                  </p>

                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <a
                      href="#batches"
                      className="px-4 py-2 bg-brand-primary text-white font-semibold text-xs sm:text-sm rounded-sm hover:opacity-90 shadow-sm flex items-center gap-1.5 transition-opacity"
                    >
                      <span>Explore Available Batches</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                      href="#inquiry"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm rounded-sm backdrop-blur-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Admission Inquiry Desk</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Latest Notices Section (1 Column on Wide Screens) */}
          <section
            id="notices"
            className="xl:col-span-1 bg-surface border border-theme rounded-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 scroll-mt-20 shadow-xs h-full"
          >
            <div className="flex items-center justify-between gap-3 border-b border-theme pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-text-main">
                  Latest Notices
                </h2>
              </div>

              <button
                onClick={() => setIsAllNoticesOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-bg-app border border-theme rounded-sm hover:border-brand-primary hover:text-brand-primary transition-all text-text-main shadow-2xs"
              >
                <span>All ({loading ? "..." : notices.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* List of 3 Latest Notices */}
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              {loading ? (
                [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-3 bg-bg-app border border-theme rounded-sm space-y-2 animate-pulse"
                  >
                    <div className="h-3 w-20 bg-accent rounded-xs" />
                    <div className="h-4 w-3/4 bg-accent rounded-xs" />
                    <div className="h-3 w-1/2 bg-accent/60 rounded-xs" />
                  </div>
                ))
              ) : notices.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted bg-bg-app border border-theme rounded-sm my-auto">
                  No active announcements currently posted.
                </div>
              ) : (
                notices.slice(0, 3).map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => setSelectedNotice(notice)}
                    className="p-3 bg-bg-app hover:bg-surface border border-theme hover:border-brand-primary/60 rounded-sm cursor-pointer transition-all space-y-1.5 group shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="font-mono text-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-primary" />
                        {new Date(notice.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-1">
                        {notice.pinned && (
                          <span className="px-1.5 py-0.2 bg-brand-primary/10 text-brand-primary font-bold rounded-xs text-[9px] uppercase tracking-wider">
                            Pinned
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-accent-subtle text-text-muted font-semibold rounded-xs text-[10px]">
                          {notice.branch?.name || "Official"}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-text-main group-hover:text-brand-primary transition-colors line-clamp-1">
                      {notice.title}
                    </h4>
                    {notice.content && (
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                        {notice.content}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AVAILABLE BATCHES */}
      {/* ========================================================================= */}
      <section id="batches" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                Available Batches
              </h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-sm self-start sm:self-auto shadow-2xs">
            {loading ? "..." : availableBatches.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface border border-theme rounded-sm overflow-hidden flex flex-col justify-between shadow-xs animate-pulse"
              >
                <div className="h-36 w-full bg-accent/40" />
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-accent rounded-xs" />
                    <div className="h-5 w-44 bg-accent rounded-xs" />
                    <div className="space-y-2 pt-2">
                      <div className="h-3 w-32 bg-accent/60 rounded-xs" />
                      <div className="h-3 w-40 bg-accent/60 rounded-xs" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-theme flex items-center justify-between">
                    <div className="h-3 w-20 bg-accent/50 rounded-xs" />
                    <div className="h-7 w-28 bg-accent rounded-sm" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {availableBatches.length === 0 && (
                <div className="col-span-full text-center py-12 bg-surface border border-theme rounded-sm text-xs text-text-muted">
                  No active batches listed at this moment.
                </div>
              )}
              {availableBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-surface border border-theme rounded-sm overflow-hidden flex flex-col justify-between hover:border-brand-primary/50 transition-all shadow-xs group"
                >
                  {batch.coverImage ? (
                    <div className="h-40 w-full bg-slate-900 overflow-hidden relative">
                      <img
                        src={batch.coverImage}
                        alt={batch.title || batch.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      {batch.academicClass && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs uppercase shadow-xs">
                            {batch.academicClass.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex justify-start items-start">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block bg-brand-primary/10 px-2 py-0.5 rounded-xs">
                        {batch.academicClass?.name || batch.course?.name || "Academic Program"}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-base text-text-main group-hover:text-brand-primary transition-colors line-clamp-1">
                        {batch.title || batch.name}
                      </h4>

                      <div className="space-y-2 text-xs text-text-muted pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>Starts: <strong className="text-text-main">{new Date(batch.startDate).toLocaleDateString()}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>Campus: <strong className="text-text-main">{batch.branch?.name || "Main Campus"}</strong></span>
                        </div>
                        {((batch.totalClasses ?? 0) > 0 || (batch.totalExams ?? 0) > 0) && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span>{batch.totalClasses || 0} Lectures • {batch.totalExams || 0} Model Exams</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-theme flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Fee</div>
                        <div className="text-base font-bold text-text-main">
                          ৳{Number(batch.feeAmount || 0).toLocaleString()}
                          {batch.feeType && (
                            <span className="text-[10px] text-text-muted font-normal ml-1">
                              ({batch.feeType.replace("_", " ")})
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/batches/${batch.id}`}
                        className="py-1.5 px-3.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:bg-brand-hover transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Details & Routine</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EXAM STANDINGS (CLEAN SNAPSHOT WITH FULL SCORES MODAL) */}
      {/* ========================================================================= */}
      <section id="results" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-sm shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                Exam Standings
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                Top performers and published scores from recent batch examinations.
              </p>
            </div>
          </div>

          {/* Clean Batch Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-text-muted whitespace-nowrap">Filter Batch:</span>
            <select
              value={selectedExamBatch}
              onChange={(e) => handleExamBatchChange(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-medium shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batchesListUnique(evaluatedExams).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title || b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exam Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs animate-pulse"
              >
                <div className="h-4 w-28 bg-accent rounded-xs" />
                <div className="h-5 w-44 bg-accent rounded-xs" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full bg-accent/60 rounded-xs" />
                  <div className="h-3 w-full bg-accent/60 rounded-xs" />
                </div>
              </div>
            ))
          ) : filteredExams.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-text-muted space-y-2 bg-surface border border-theme rounded-sm">
              <Award className="w-8 h-8 mx-auto opacity-40 text-brand-primary" />
              <p>No evaluated exams recorded for this batch yet.</p>
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-surface border border-theme hover:border-brand-primary/60 rounded-sm p-5 shadow-xs flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* Subject Badge & Exam Date */}
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase tracking-wider text-[10px]">
                      {exam.academicClass} • {exam.subject}
                    </span>
                    <span className="text-text-muted font-mono flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-brand-primary" />
                      {new Date(exam.examDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Batch Info */}
                  <div>
                    <h3 className="font-bold text-sm text-text-main group-hover:text-brand-primary transition-colors line-clamp-1">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                      {exam.batchTitle} • {exam.branchName}
                    </p>
                  </div>

                  {/* Test Specs Bar */}
                  <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-bg-app border border-theme rounded-sm text-text-muted">
                    <span>Total: <strong className="text-text-main font-mono">{exam.totalMarks} Marks</strong></span>
                    <span><strong className="text-brand-primary font-mono">{exam.standings.length}</strong> Evaluated</span>
                  </div>

                  {/* Top Performers Snapshot */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Top Standings
                    </div>
                    {exam.standings.slice(0, 3).map((st) => (
                      <div
                        key={st.standing}
                        className="flex items-center justify-between py-1.5 px-2 bg-bg-app/70 hover:bg-bg-app rounded-xs text-xs border border-theme/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-xs font-bold text-[10px] shrink-0 ${
                              st.standing === 1
                                ? "bg-amber-400 text-slate-900 shadow-2xs"
                                : st.standing === 2
                                ? "bg-slate-300 text-slate-900"
                                : "bg-amber-600/30 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            #{st.standing}
                          </span>
                          <span className="font-semibold text-text-main truncate text-xs">
                            {st.studentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                          <span className="font-bold text-text-main">{st.marksObtained}/{exam.totalMarks}</span>
                          <span className="px-1 py-0.2 rounded-xs bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                            {st.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                    {exam.standings.length === 0 && (
                      <div className="text-xs text-text-muted py-2 text-center">Standings awaiting grading.</div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-2 border-t border-theme/60">
                  <button
                    onClick={() => {
                      setExamSearchFilter("");
                      setSelectedExamModal(exam);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-surface border border-accent hover:border-brand-primary text-text-main rounded-sm text-xs font-semibold hover:bg-brand-primary hover:text-white transition-all shadow-2xs"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>View Full Results ({exam.standings.length})</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ACHIEVEMENTS OF OUR BRIGHT STUDENTS (COMPACT POSTERS / HALL OF FAME) */}
      {/* ========================================================================= */}
      {(loading || achievements.length > 0) && (
        <section id="achievements" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                  Achievements of Our Bright Students
                </h2>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                  Celebrating the rank holders in BUET, Dhaka University, Medical Colleges, and National Board Examinations.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-sm self-start sm:self-auto shadow-2xs">
              Hall of Fame
            </span>
          </div>

          {/* Compact Posters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-surface border border-theme rounded-sm overflow-hidden flex flex-col justify-between shadow-xs animate-pulse"
                >
                  <div className="h-44 w-full bg-accent/40" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-32 bg-accent rounded-xs" />
                    <div className="h-3 w-24 bg-accent/60 rounded-xs" />
                    <div className="h-3 w-28 bg-accent/60 rounded-xs" />
                  </div>
                </div>
              ))
            ) : (
              achievements.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-theme rounded-sm overflow-hidden flex flex-col justify-between hover:border-brand-primary/60 transition-all shadow-xs group"
                >
                  {/* Compact Photo Banner */}
                  <div className="h-44 w-full bg-slate-900 overflow-hidden relative">
                    {item.posterUrl || item.avatarUrl ? (
                      <img
                        src={(item.posterUrl || item.avatarUrl) ?? undefined}
                        alt={item.studentName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-brand-primary/20 flex flex-col items-center justify-center p-4">
                        <Trophy className="w-10 h-10 text-amber-400 mb-1" />
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Top Performer</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <div className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs inline-block uppercase tracking-wider mb-1">
                        {item.year}
                      </div>
                      <div className="font-bold text-sm leading-tight text-white">{item.studentName}</div>
                    </div>
                  </div>

                  {/* Achievement Body */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-xs text-brand-primary leading-snug">
                        {item.achievement}
                      </div>
                      <p className="text-[11px] text-text-muted">
                        Batch: <span className="text-text-main font-medium">{item.batchName}</span>
                      </p>
                      {item.college && (
                        <p className="text-[11px] text-text-muted">
                          College: <span className="text-text-main">{item.college}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-theme/60 flex items-center justify-between text-[10px] text-text-muted">
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Alumni
                      </span>
                      {organization.name && <span>{organization.name}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6.5. OUR TEACHER PANEL (HORIZONTALLY FLOATING CARDS & JOIN ACTION) */}
      {/* ========================================================================= */}
      <section id="faculty" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                Our Teacher Panel
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                Meet our dedicated faculty mentors and subject specialists guiding academic excellence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scrollTeachers("left")}
              className="p-1.5 border border-accent rounded-sm hover:border-brand-primary text-text-muted hover:text-text-main transition-colors bg-surface shadow-2xs"
              aria-label="Scroll Left"
              title="Previous Teachers"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTeachers("right")}
              className="p-1.5 border border-accent rounded-sm hover:border-brand-primary text-text-muted hover:text-text-main transition-colors bg-surface shadow-2xs"
              aria-label="Scroll Right"
              title="Next Teachers"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontally Floating / Scrollable Cards */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden py-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-[280px] sm:w-[320px] shrink-0 bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs animate-pulse"
              >
                <div className="w-14 h-14 rounded-full bg-accent/50" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-accent/60 rounded-xs" />
                  <div className="h-3 w-24 bg-accent/40 rounded-xs" />
                  <div className="h-3 w-40 bg-accent/40 rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-surface border border-dashed border-accent p-8 text-center rounded-sm">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs text-text-muted">Faculty directory is being updated for the upcoming academic session.</p>
          </div>
        ) : (
          <div
            ref={teacherScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {teachers.map((t) => (
              <div
                key={t.id}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-surface border border-theme hover:border-brand-primary/60 rounded-sm p-5 shadow-xs flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    {t.avatarUrl ? (
                      <img
                        src={t.avatarUrl}
                        alt={t.fullName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-brand-primary/20 group-hover:border-brand-primary transition-colors shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-primary/20 to-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-lg shrink-0">
                        {t.fullName?.[0]?.toUpperCase() || "T"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/faculty/${t.id}`}
                        className="font-bold text-sm text-text-main group-hover:text-brand-primary transition-colors line-clamp-1 hover:underline"
                      >
                        {t.fullName}
                      </Link>
                      <div className="text-xs font-semibold text-brand-primary line-clamp-1 mt-0.5">
                        {t.specialization}
                      </div>
                      <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                        {t.qualification}
                      </div>
                    </div>
                  </div>

                  {t.branchName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted pt-2 border-t border-accent/60">
                      <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">{t.branchName}</span>
                    </div>
                  )}

                  {t.bio && (
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {t.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-2">
                  <Link
                    to={`/faculty/${t.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-surface border border-accent hover:border-brand-primary text-text-main rounded-sm text-xs font-semibold hover:bg-brand-primary hover:text-white transition-all shadow-2xs"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join Our Teacher Panel CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/teacher/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold bg-brand-primary text-white rounded-sm hover:bg-brand-hover shadow-sm transition-all"
          >
            <Briefcase className="w-4 h-4" />
            <span>Join Our Teacher Panel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ACADEMIC TIPS & BLOGS (STUDY STRATEGIES & PROBLEM SOLVING) */}
      {/* ========================================================================= */}
      <section id="tips" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                Faculty Tips, Strategies & Study Guides
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                Actionable advice on board exam writing, problem shortcuts, and admission time management.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-sm self-start sm:self-auto shadow-2xs">
            Academic Insights
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studyTips.map((tip) => (
            <Link
              key={tip.id}
              to={`/tips/${tip.id}`}
              className="bg-surface border border-theme rounded-sm p-5 space-y-3 hover:border-brand-primary/60 transition-all flex flex-col justify-between group shadow-xs block"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-brand-primary uppercase tracking-wider">
                    {tip.category}
                  </span>
                  <span className="text-text-muted">{tip.readTime}</span>
                </div>

                <h4 className="font-bold text-sm text-text-main group-hover:text-brand-primary transition-colors line-clamp-2">
                  {tip.title}
                </h4>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                  {tip.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-theme flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-muted italic">{tip.author}</span>
                <span className="font-semibold text-brand-primary flex items-center gap-1">
                  Read Full Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PARENTS & STUDENTS COMMENTS / REVIEWS (WITH 5-STAR RATING & PHONE) */}
      {/* ========================================================================= */}
      <section id="reviews" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                Parents & Students Comments & Advice
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                Transparent reviews, learning experiences, and valuable recommendations from parents and enrolled learners.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <Link
              to="/reviews"
              className="px-3 py-1.5 text-xs font-bold bg-surface border border-theme hover:border-brand-primary hover:text-brand-primary text-text-main rounded-sm shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
              <span>View All Reviews</span>
            </Link>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-brand-primary text-white rounded-sm hover:bg-brand-hover shadow-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Leave Your Advice / Review</span>
            </button>
          </div>
        </div>

        {/* Testimonial Cards - Single Column View */}
        <div className="flex flex-col gap-3.5 max-w-4xl mx-auto">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface border border-theme rounded-sm p-4 sm:p-5 space-y-3 animate-pulse shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 bg-accent rounded-xs" />
                    <div className="h-3 w-24 bg-accent/60 rounded-xs" />
                  </div>
                  <div className="h-6 w-20 bg-accent rounded-xs shrink-0" />
                </div>
                <div className="h-8 w-full bg-accent/40 rounded-xs" />
              </div>
            ))
          ) : (
            <>
              {testimonials.slice(0, 3).map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="bg-surface border border-theme rounded-sm p-4 sm:p-5 space-y-3 hover:border-brand-primary/50 transition-colors shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme/60 pb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {t.name ? t.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-main flex items-center gap-2">
                          {t.name}
                          <span className="px-1.5 py-0.5 rounded-xs bg-bg-app border border-theme text-[10px] font-semibold text-brand-primary uppercase">
                            {t.role || "Student"}
                          </span>
                        </h4>
                        {t.phone && (
                          <span className="text-[11px] font-mono text-text-muted">
                            Verified Contact: {t.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 bg-bg-app border border-theme rounded-xs">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= t.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-text-main">{t.rating}.0 / 5</span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <p className="text-xs sm:text-sm text-text-main/90 leading-relaxed italic pl-1">
                    "{t.message}"
                  </p>
                </div>
              ))}

              <div className="flex justify-center pt-2">
                <Link
                  to="/reviews"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-surface border border-theme hover:border-brand-primary hover:text-brand-primary text-text-main rounded-sm transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
                  <span>View All Reviews & Advice ({testimonials.length > 0 ? `${testimonials.length}` : "All"}) →</span>
                </Link>
              </div>

              {testimonials.length === 0 && (
                <div className="p-8 text-center text-xs text-text-muted bg-surface border border-theme rounded-sm">
                  No reviews recorded yet. Be the first to share your learning experience!
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. ADMISSION INQUIRY DESK */}
      {/* ========================================================================= */}
      <section id="inquiry" className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
                Direct Admission Inquiry & Campus Counseling
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                Have questions regarding batch timings, fee structures, or curriculum? Send us a quick note and our counselor will call you back.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-theme rounded-sm p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={inquiry.studentName}
                  onChange={(e) => setInquiry({ ...inquiry, studentName: e.target.value })}
                  className="w-full text-xs p-2.5 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-text-main"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01712345678"
                  value={inquiry.phone}
                  onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors font-mono text-text-main"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. student@gmail.com"
                  value={inquiry.email}
                  onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })}
                  className="w-full text-xs p-2.5 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-text-main"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main">Your Question / Preferred Batch</label>
              <textarea
                rows={3}
                placeholder="Mention the class level, preferred batch, or question..."
                value={inquiry.message}
                onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                className="w-full text-xs p-2.5 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-text-main"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover active:scale-[0.99] shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Submitting Inquiry..." : "Submit Admission Inquiry"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. COMPREHENSIVE FOOTER WITH CAMPUSES, WHATSAPP, CONTACT & BACK TO TOP */}
      {/* ========================================================================= */}
      <footer className="border-t border-theme bg-surface pt-12 pb-6 text-xs text-text-muted">
        <div className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Institute Brand & Bio */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-sm bg-brand-primary text-white flex items-center justify-center font-bold overflow-hidden">
                  {organization.logoUrl ? (
                    <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </div>
                {organization.name && (
                  <span className="font-extrabold text-sm text-text-main tracking-tight">
                    {organization.name}
                  </span>
                )}
              </div>

              {organization.tagline && (
                <p className="text-xs text-text-muted leading-relaxed">
                  {organization.tagline}
                </p>
              )}

              {organization.establishedYear && (
                <div className="pt-1 text-[11px] font-semibold text-text-main flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Established in {organization.establishedYear} • Official Institution</span>
                </div>
              )}
            </div>

            {/* Column 2: Our Campus Branches */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-main">
                Our Campus Branches
              </h4>
              <div className="space-y-3">
                {branches.length > 0 ? (
                  branches.map((b, idx) => (
                    <div key={b.id || idx} className="space-y-0.5 text-xs">
                      <div className="font-bold text-text-main flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-brand-primary shrink-0" />
                        <span>{b.name}</span>
                        {b.isMainBranch && (
                          <span className="text-[9px] px-1.5 bg-brand-primary/10 text-brand-primary font-bold rounded-xs">
                            Main Branch
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted pl-4 leading-tight">{b.address}</p>
                      {b.phone && (
                        <p className="text-[11px] text-text-muted font-mono pl-4">📞 {b.phone}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted">Branch locations will be updated shortly.</p>
                )}
              </div>
            </div>

            {/* Column 3: Quick Navigation */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-main">
                Quick Navigation
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <a href="#batches" className="hover:text-brand-primary transition-colors">
                    • Available Batches & Schedules
                  </a>
                </li>
                <li>
                  <a href="#notices" className="hover:text-brand-primary transition-colors">
                    • Public Notice Board
                  </a>
                </li>
                <li>
                  <a href="#results" className="hover:text-brand-primary transition-colors">
                    • Evaluated Exam Standings
                  </a>
                </li>
                <li>
                  <a href="#achievements" className="hover:text-brand-primary transition-colors">
                    • Hall of Fame & Achievements
                  </a>
                </li>
                <li>
                  <a href="#tips" className="hover:text-brand-primary transition-colors">
                    • Faculty Study Guides & Tips
                  </a>
                </li>
                <li>
                  <a href="#reviews" className="hover:text-brand-primary transition-colors">
                    • Parent & Student Reviews
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Helplines & Portals */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-main">
                Portals & Helplines
              </h4>
              <div className="space-y-2">
                <Link
                  to="/student"
                  className="block p-2 bg-bg-app border border-theme rounded-sm hover:border-brand-primary text-xs font-semibold text-text-main text-center transition-colors"
                >
                  Student Portal Login
                </Link>
                <Link
                  to="/login"
                  className="block p-2 bg-bg-app border border-theme rounded-sm hover:border-brand-primary text-xs font-semibold text-text-main text-center transition-colors"
                >
                  Faculty & Admin Desk
                </Link>

                {/* WhatsApp Helpline Button (Purely dynamic from database) */}
                {(() => {
                  const whatsappNum =
                    organization.whatsappNumber ||
                    organization.phone ||
                    branches.find((b) => b.isMainBranch)?.phone ||
                    branches[0]?.phone;
                  if (!whatsappNum) return null;
                  const cleanPhone = whatsappNum.replace(/[^0-9]/g, "");
                  return (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hello${organization.name ? ` ${organization.name}` : ""}, I would like to inquire about academic admission.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Admission Helpline</span>
                    </a>
                  );
                })()}
              </div>

              {(organization.phone || organization.email) && (
                <div className="pt-2 text-[11px] space-y-0.5 text-text-muted">
                  {organization.phone && (
                    <div>
                      Central Hotline: <strong className="text-text-main font-mono">{organization.phone}</strong>
                    </div>
                  )}
                  {organization.email && (
                    <div>
                      Official Email: <strong className="text-text-main">{organization.email}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar: Copyright & Go to Top */}
          <div className="pt-6 border-t border-theme flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>
              © {new Date().getFullYear()} {organization.name || "Coaching Management System"}. All rights reserved.
            </p>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-app border border-theme rounded-sm hover:border-brand-primary hover:text-brand-primary font-semibold text-text-main transition-colors shadow-xs"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: SINGLE NOTICE DETAIL VIEW (ENLARGED & VIEWPORT SAFE) */}
      {/* ========================================================================= */}
      {selectedNotice &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-surface border border-theme max-w-2xl sm:max-w-3xl w-full rounded-sm p-6 sm:p-8 space-y-5 shadow-2xl my-auto animate-page-enter">
              <div className="flex justify-between items-start border-b border-theme pb-4">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedNotice.pinned && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase tracking-wide">
                        Pinned
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-brand-primary text-white rounded-xs uppercase tracking-wide">
                      {selectedNotice.branch?.name || "Official Notice"}
                    </span>
                    {selectedNotice.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-bg-app border border-theme rounded-xs text-text-muted">
                        {selectedNotice.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-text-main mt-1 leading-snug">
                    {selectedNotice.title}
                  </h3>
                  <p className="text-xs text-text-muted flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                    Published on {new Date(selectedNotice.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-text-muted hover:text-text-main p-1.5 rounded-sm hover:bg-bg-app transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-text-main leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto whitespace-pre-line pr-1">
                <p>{selectedNotice.content}</p>
                {selectedNotice.attachmentUrl && (
                  <div className="pt-3 border-t border-theme">
                    <a
                      href={selectedNotice.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-sm text-xs font-bold hover:bg-brand-hover shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official Attachment / Circular Document</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-theme flex justify-end">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-5 py-2 text-xs font-semibold bg-bg-app border border-theme rounded-sm hover:bg-accent text-text-main transition-colors cursor-pointer"
                >
                  Close Notice
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL: ALL NOTICES ARCHIVE */}
      {/* ========================================================================= */}
      {isAllNoticesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-surface border border-theme max-w-3xl sm:max-w-4xl w-full rounded-sm p-6 sm:p-8 space-y-4 shadow-2xl max-h-[88vh] flex flex-col justify-between my-auto animate-page-enter">
              <div className="flex justify-between items-center border-b border-theme pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-sm">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text-main">All Official Notices & Bulletins</h3>
                    <p className="text-xs text-text-muted">Archives of circulars and administrative updates</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAllNoticesOpen(false)}
                  className="text-text-muted hover:text-text-main p-1.5 rounded-sm hover:bg-bg-app transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setIsAllNoticesOpen(false);
                      setSelectedNotice(n);
                    }}
                    className="p-4 bg-bg-app border border-theme rounded-sm space-y-1.5 cursor-pointer hover:border-brand-primary/70 transition-all shadow-2xs group"
                  >
                    <div className="flex justify-between items-center text-[11px] text-text-muted font-mono">
                      <span className="text-brand-primary font-bold">
                        {new Date(n.publishedAt).toLocaleDateString()}
                      </span>
                      <span>{n.branch?.name || "All Campuses"}</span>
                    </div>
                    <h4 className="font-bold text-sm text-text-main group-hover:text-brand-primary transition-colors">
                      {n.title}
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{n.content}</p>
                  </div>
                ))}
                {notices.length === 0 && (
                  <div className="p-8 text-center text-xs text-text-muted">
                    No notices found in archive.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-theme flex justify-end">
                <button
                  onClick={() => setIsAllNoticesOpen(false)}
                  className="px-5 py-2 text-xs font-semibold bg-bg-app border border-theme rounded-sm hover:bg-accent text-text-main cursor-pointer"
                >
                  Close Notice Archive
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL: FULL STUDY GUIDE / TIP DETAIL */}
      {/* ========================================================================= */}
      {selectedTip &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface border border-theme max-w-lg w-full rounded-sm p-6 space-y-4 shadow-2xl my-auto animate-page-enter">
              <div className="flex justify-between items-start border-b border-theme pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs uppercase">
                    {selectedTip.category}
                  </span>
                  <h3 className="font-bold text-sm text-text-main mt-1">{selectedTip.title}</h3>
                  <p className="text-[11px] text-text-muted">By {selectedTip.author}</p>
                </div>
                <button onClick={() => setSelectedTip(null)} className="text-text-muted hover:text-text-main p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-text-main leading-relaxed space-y-3 max-h-72 overflow-y-auto whitespace-pre-line">
                <p>{selectedTip.content}</p>
              </div>

              <div className="pt-3 border-t border-theme flex justify-end">
                <button
                  onClick={() => setSelectedTip(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-bg-app border border-theme rounded-sm hover:bg-accent"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT PARENT / STUDENT REVIEW */}
      {/* ========================================================================= */}
      {isReviewModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface border border-theme max-w-md w-full rounded-sm p-6 space-y-4 shadow-2xl my-auto animate-page-enter">
              <div className="flex justify-between items-center border-b border-theme pb-3">
                <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Leave Parent / Student Advice
                </h3>
                <button onClick={() => setIsReviewModalOpen(false)} className="text-text-muted hover:text-text-main p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kazi Mokhlesur Rahman"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    className="w-full p-2 bg-bg-app border border-theme rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-text-main">You are a *</label>
                    <select
                      value={reviewForm.role}
                      onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                      className="w-full p-2 bg-bg-app border border-theme rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                    >
                      <option value="PARENT">Parent</option>
                      <option value="STUDENT">Enrolled Student</option>
                      <option value="ALUMNI">Alumni / Past Student</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-text-main">Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 01712345678"
                      value={reviewForm.phone}
                      onChange={(e) => setReviewForm({ ...reviewForm, phone: e.target.value })}
                      className="w-full p-2 bg-bg-app border border-theme rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Rating (out of 5 Stars)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= reviewForm.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-bold text-text-main ml-2">{reviewForm.rating} / 5 Stars</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Message / Advice for New Learners *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Share your advice or learning experience with the coaching..."
                    value={reviewForm.message}
                    onChange={(e) => setReviewForm({ ...reviewForm, message: e.target.value })}
                    className="w-full p-2 bg-bg-app border border-theme rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-theme">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-3 py-1.5 border border-theme rounded-sm hover:bg-accent text-text-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-1.5 bg-brand-primary text-white font-bold rounded-sm hover:bg-brand-hover shadow-xs"
                  >
                    {submittingReview ? "Submitting..." : "Submit Advice"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL: FULL EXAM RESULTS & LEADERBOARD SHEET (TOP-ALIGNED & VIEWPORT SAFE) */}
      {/* ========================================================================= */}
      {selectedExamModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-6 sm:pt-10 md:pt-12 overflow-y-auto">
            <div className="bg-surface border border-theme max-w-3xl sm:max-w-4xl w-full rounded-sm p-6 sm:p-8 space-y-4 shadow-2xl my-auto sm:my-0 animate-page-enter">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-theme pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-xs uppercase tracking-wider">
                      {selectedExamModal.academicClass} • {selectedExamModal.subject}
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      Exam Date: {new Date(selectedExamModal.examDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-text-main mt-1">
                    {selectedExamModal.title} — Official Standings
                  </h3>
                  <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                    <span>Batch: <strong className="text-text-main">{selectedExamModal.batchTitle}</strong></span>
                    <span>•</span>
                    <span>Campus: {selectedExamModal.branchName}</span>
                    <span>•</span>
                    <span>Total Marks: <strong className="text-text-main font-mono">{selectedExamModal.totalMarks}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExamModal(null)}
                  className="text-text-muted hover:text-text-main p-1.5 rounded-sm hover:bg-bg-app transition-colors shrink-0"
                  aria-label="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Search inside modal */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student by name..."
                    value={examSearchFilter}
                    onChange={(e) => setExamSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-theme rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <span className="text-xs text-text-muted font-mono">
                  {selectedExamModal.standings.filter((s) => s.studentName.toLowerCase().includes(examSearchFilter.toLowerCase())).length} of {selectedExamModal.standings.length} Students
                </span>
              </div>

              {/* Standings Table */}
              <div className="overflow-y-auto max-h-[55vh] border border-theme rounded-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-app text-text-muted border-b border-theme text-[10px] uppercase font-bold sticky top-0 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-16">Standing</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                      <th className="py-2.5 px-3 text-center">Percentage</th>
                      <th className="py-2.5 px-3 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {selectedExamModal.standings
                      .filter((s) => s.studentName.toLowerCase().includes(examSearchFilter.toLowerCase()))
                      .map((st) => (
                        <tr key={st.standing} className="hover:bg-bg-app/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-xs font-bold text-xs ${
                                st.standing === 1
                                  ? "bg-amber-400 text-slate-900 shadow-xs"
                                  : st.standing === 2
                                  ? "bg-slate-300 text-slate-900"
                                  : st.standing === 3
                                  ? "bg-amber-600/30 text-amber-800 dark:text-amber-300"
                                  : "bg-bg-app border border-theme text-text-muted"
                              }`}
                            >
                              {st.standing}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-text-main flex items-center gap-2">
                            {st.avatarUrl ? (
                              <img
                                src={st.avatarUrl}
                                alt={st.studentName}
                                className="w-6 h-6 rounded-full object-cover border border-theme"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-[10px] flex items-center justify-center">
                                {st.studentName.charAt(0)}
                              </div>
                            )}
                            <span>{st.studentName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-text-main">
                            {st.marksObtained} / {st.totalMarks}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-text-muted">
                            {st.percentage}%
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-xs ${
                                st.grade === "A+"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-brand-primary/10 text-brand-primary"
                              }`}
                            >
                              {st.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-theme flex justify-end">
                <button
                  onClick={() => setSelectedExamModal(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-bg-app border border-theme rounded-sm hover:bg-accent text-text-main cursor-pointer"
                >
                  Close Results Sheet
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// Helper: Extract unique batches from evaluated exams list
function batchesListUnique(exams: EvaluatedExam[]) {
  const map = new Map<string, { id: string; name: string; title: string }>();
  exams.forEach((e) => {
    if (!map.has(e.batchId)) {
      map.set(e.batchId, { id: e.batchId, name: e.batchName, title: e.batchTitle });
    }
  });
  return Array.from(map.values());
}

export default LandingPage;
