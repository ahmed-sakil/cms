import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Star,
  Search,
  ArrowLeft,
  Plus,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TestimonialItem {
  id?: string;
  name: string;
  role: string;
  phone?: string | null;
  message: string;
  rating: number;
  createdAt?: string;
}

interface TestimonialResponse {
  testimonials: TestimonialItem[];
  totalCount: number;
  averageRating: number;
  distribution: Record<number, number>;
}

export const ReviewsPage: React.FC = () => {
  const [data, setData] = useState<TestimonialResponse>({
    testimonials: [],
    totalCount: 0,
    averageRating: 5.0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    name: "",
    role: "STUDENT",
    phone: "",
    rating: 5,
    message: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/public/testimonials");
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
      }
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error("Please provide your name and review comments.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role,
          phone: formData.phone.trim() || undefined,
          rating: Number(formData.rating),
          message: formData.message.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit review");
      }

      toast.success("Thank you for your valuable advice!", {
        description: "Your review has been submitted for moderation and will appear shortly.",
      });
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter testimonials
  const filteredList = data.testimonials.filter((t) => {
    const matchQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phone && t.phone.includes(searchQuery));

    const matchRole =
      roleFilter === "ALL" ? true : t.role.toUpperCase() === roleFilter.toUpperCase();

    const matchRating =
      ratingFilter === "ALL" ? true : t.rating === Number(ratingFilter);

    return matchQuery && matchRole && matchRating;
  });

  return (
    <div className="min-h-screen bg-bg-app pb-20">
      <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top Breadcrumb & Return Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/#reviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-sm bg-surface border border-theme"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Leave Your Advice / Review
          </button>
        </div>

        {/* Hero Rating Banner */}
        <div className="bg-surface border border-theme rounded-sm p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-sm uppercase tracking-wider">
                  Verified Testimonials
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {data.totalCount} Authentic Experiences
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
                Parents & Students Comments, Reviews & Recommendations
              </h1>

              <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
                Read genuine learning stories, mentorship feedback, and board exam success journeys from parents and students across all our campuses.
              </p>
            </div>

            {/* Scorecard Box */}
            <div className="flex items-center gap-6 p-4 bg-bg-app border border-theme rounded-sm shrink-0">
              <div className="text-center space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-text-main font-mono">
                  {data.averageRating.toFixed(1)}
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= Math.round(data.averageRating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-text-muted font-semibold block">
                  Out of 5.0 Stars
                </span>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-1 min-w-[130px] border-l border-theme/60 pl-4 text-[10px] font-medium text-text-muted">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = data.distribution[rating] || 0;
                  const pct = data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="w-5 font-mono">{rating}★</span>
                      <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-theme rounded-sm shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by reviewer name, feedback text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="PARENT">Parents</option>
              <option value="ALUMNI">Alumni</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
            >
              <option value="ALL">All Star Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="p-16 text-center text-text-muted text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-primary" />
            <p>Loading community reviews...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center bg-surface border border-theme rounded-sm space-y-3">
            <MessageSquare className="w-10 h-10 text-text-muted/40 mx-auto" />
            <h3 className="text-sm font-bold text-text-main">No reviews match your filter</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with broader terms or clear your search input."
                : "Be the first to leave a review and share your learning experience."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95"
            >
              Leave Your Advice / Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((t, idx) => (
              <div
                key={t.id || idx}
                className="bg-surface border border-theme rounded-sm p-5 space-y-3.5 hover:border-brand-primary/50 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Reviewer & Stars */}
                  <div className="flex items-start justify-between gap-3 border-b border-theme/60 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {t.name ? t.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-text-main truncate flex items-center gap-2">
                          {t.name}
                          <span className="px-1.5 py-0.5 rounded-xs bg-bg-app border border-theme text-[10px] font-semibold text-brand-primary uppercase">
                            {t.role || "Student"}
                          </span>
                        </h4>
                        {t.phone && (
                          <span className="text-[11px] font-mono text-text-muted block truncate">
                            Verified Contact: {t.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Star Badge */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-app border border-theme rounded-xs shrink-0">
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
                      <span className="text-xs font-bold text-text-main">{t.rating}.0</span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <p className="text-xs sm:text-sm text-text-main/90 leading-relaxed italic pl-1">
                    "{t.message}"
                  </p>
                </div>

                {/* Footer Timestamp */}
                <div className="pt-2 border-t border-theme/60 flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Review
                  </span>
                  {t.createdAt && (
                    <span>Submitted {new Date(t.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-primary" />
                Leave Your Advice / Review
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main p-1 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Chowdhury"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Affiliation / Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PARENT">Parent / Guardian</option>
                    <option value="ALUMNI">Alumni</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Star Rating *</label>
                  <div className="flex items-center gap-1 pt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: s })}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            s <= formData.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-xs text-text-main">
                      {formData.rating}.0 / 5
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-main">Your Comments & Experience *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about the teaching quality, model exam system, discipline, or advice for new students..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-theme flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-theme text-text-main font-semibold rounded-sm hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-primary text-white font-semibold rounded-sm hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Submit Advice
                    </>
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
export default ReviewsPage;
