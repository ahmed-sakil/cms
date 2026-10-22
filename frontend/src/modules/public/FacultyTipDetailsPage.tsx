import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Share2,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { setDynamicPageTitle } from "../../utils/dynamicFavicon.js";

interface FacultyTip {
  id: string;
  category: string;
  title: string;
  slug?: string | null;
  excerpt: string;
  content: string;
  author: string;
  authorTitle?: string | null;
  authorImage?: string | null;
  coverImage?: string | null;
  readTime: string;
  viewsCount: number;
  createdAt: string;
}

export const FacultyTipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tip, setTip] = useState<FacultyTip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherTips, setOtherTips] = useState<FacultyTip[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchTipDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/public/tips/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || "Faculty study guide not found");
        }
        setTip(json.data);
        setDynamicPageTitle(window.location.pathname, json.data.title);
      } catch (err: any) {
        setError(err.message || "Failed to load faculty guide");
      } finally {
        setLoading(false);
      }
    };

    fetchTipDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Fetch sibling guides for the sidebar
  useEffect(() => {
    fetch("/api/v1/public/tips")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setOtherTips(json.data.filter((t: FacultyTip) => t.id !== id).slice(0, 3));
        }
      })
      .catch(() => {});
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Guide link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-semibold text-text-muted">Loading faculty guide & insights...</p>
      </div>
    );
  }

  if (error || !tip) {
    return (
      <div className="min-h-[70vh] bg-bg-app flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-text-main">Faculty Guide Not Found</h2>
        <p className="text-sm text-text-muted max-w-md">
          {error || "The requested academic strategy guide may have been archived or moved."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:opacity-90"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
        </Link>
      </div>
    );
  }

  // Format content paragraphs
  const contentSections = tip.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="min-h-screen bg-bg-app pb-20">
      <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top Breadcrumb & Return Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/#tips"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-sm bg-surface border border-theme"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Faculty Tips</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-sm bg-surface border border-theme"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Guide</span>
          </button>
        </div>

        {/* Hero Header Card */}
        <div className="bg-surface border border-theme rounded-sm overflow-hidden shadow-sm">
          {tip.coverImage ? (
            <div className="relative h-60 sm:h-72 w-full bg-slate-900 overflow-hidden">
              <img
                src={tip.coverImage}
                alt={tip.title}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 space-y-2 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-brand-primary text-white rounded-sm uppercase tracking-wider">
                    {tip.category}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-white/20 backdrop-blur rounded-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {tip.readTime}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-white/20 backdrop-blur rounded-sm flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {tip.viewsCount} reads
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                  {tip.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-gradient-to-r from-brand-primary/10 via-surface to-accent/20 border-b border-theme space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-brand-primary text-white rounded-sm uppercase tracking-wider">
                  {tip.category}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-accent rounded-sm text-text-main flex items-center gap-1">
                  <Clock className="w-3 h-3 text-text-muted" /> {tip.readTime}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-accent rounded-sm text-text-main flex items-center gap-1">
                  <Eye className="w-3 h-3 text-text-muted" /> {tip.viewsCount} views
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-accent rounded-sm text-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(tip.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight leading-tight">
                {tip.title}
              </h1>

              <p className="text-sm sm:text-base text-text-muted max-w-3xl leading-relaxed">
                {tip.excerpt}
              </p>
            </div>
          )}

          {/* Author Badge Bar */}
          <div className="p-4 sm:px-8 bg-bg-app/50 border-t border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {tip.authorImage ? (
                <img
                  src={tip.authorImage}
                  alt={tip.author}
                  className="w-10 h-10 rounded-full object-cover border border-theme"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {tip.author.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="block font-bold text-text-main text-sm">
                  {tip.author}
                </span>
                {tip.authorTitle && (
                  <span className="block text-text-muted text-[11px]">
                    {tip.authorTitle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">Academic Strategy & Guidance</span>
              <span className="w-1 h-1 rounded-full bg-brand-primary" />
              <span className="text-[11px] font-semibold text-brand-primary">Official Faculty Publication</span>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Takeaways Card */}
            <div className="p-5 bg-surface border border-theme rounded-sm space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Core Key Takeaways
              </div>
              <p className="text-xs sm:text-sm text-text-main leading-relaxed font-medium">
                "{tip.excerpt}"
              </p>
            </div>

            {/* Detailed Guide Body */}
            <div className="bg-surface border border-theme rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-theme pb-4">
                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-primary" />
                  Step-by-Step Strategic Action Plan
                </h2>
                <span className="text-xs text-text-muted">
                  Follow these proven recommendations during your daily study regimen and exam preparation.
                </span>
              </div>

              <div className="prose prose-sm max-w-none space-y-4 text-text-main text-xs sm:text-sm leading-relaxed">
                {contentSections.map((sec, idx) => {
                  if (sec.startsWith("###") || sec.startsWith("##")) {
                    const headingText = sec.replace(/^#+\s*/, "");
                    return (
                      <h3
                        key={idx}
                        className="text-sm sm:text-base font-bold text-text-main pt-2 border-l-2 border-brand-primary pl-3"
                      >
                        {headingText}
                      </h3>
                    );
                  }
                  return (
                    <p key={idx} className="text-text-main/90 leading-relaxed whitespace-pre-line">
                      {sec}
                    </p>
                  );
                })}
              </div>

              {/* End of article signature */}
              <div className="pt-6 border-t border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-text-muted block">Authored by</span>
                  <span className="text-xs font-bold text-text-main">{tip.author}</span>
                  {tip.authorTitle && (
                    <span className="text-[11px] text-text-muted block">{tip.authorTitle}</span>
                  )}
                </div>

                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-bg-app border border-theme hover:border-brand-primary hover:text-brand-primary text-text-main rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Guide URL
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Faculty Mentor Profile Card */}
            <div className="bg-surface border border-theme rounded-sm p-5 space-y-4 shadow-xs">
              <div className="border-b border-theme pb-3">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  About the Faculty Mentor
                </span>
              </div>

              <div className="flex items-center gap-3">
                {tip.authorImage ? (
                  <img
                    src={tip.authorImage}
                    alt={tip.author}
                    className="w-12 h-12 rounded-full object-cover border border-theme shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-base flex items-center justify-center shrink-0">
                    {tip.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-text-main">{tip.author}</h4>
                  <p className="text-xs text-text-muted">{tip.authorTitle || "Subject Specialist"}</p>
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Dedicated to mentoring students towards academic excellence, conceptual clarity, and competitive admission rank qualification.
              </p>
            </div>

            {/* Program Admission CTA */}
            <div className="bg-surface border border-theme rounded-sm p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xs">
                <GraduationCap className="w-4 h-4" /> Enrol in Offline Programs
              </div>
              <h4 className="font-bold text-sm text-text-main">
                Ready to Boost Your Academic Scores?
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Join our offline interactive batches with physical mock tests, daily attendance cards, and direct mentoring.
              </p>
              <Link
                to="/#batches"
                className="w-full py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>View Available Batches</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Related Faculty Tips */}
            {otherTips.length > 0 && (
              <div className="bg-surface border border-theme rounded-sm p-5 space-y-3 shadow-xs">
                <div className="border-b border-theme pb-2.5">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                    More Faculty Guides
                  </span>
                </div>

                <div className="space-y-3">
                  {otherTips.map((sibling) => (
                    <Link
                      key={sibling.id}
                      to={`/tips/${sibling.id}`}
                      className="block p-3 rounded-sm border border-theme/60 hover:border-brand-primary/60 bg-bg-app/40 hover:bg-bg-app transition-all space-y-1 group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-brand-primary uppercase">
                          {sibling.category}
                        </span>
                        <span className="text-text-muted">{sibling.readTime}</span>
                      </div>
                      <h5 className="font-bold text-xs text-text-main group-hover:text-brand-primary transition-colors line-clamp-2">
                        {sibling.title}
                      </h5>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FacultyTipDetailsPage;
