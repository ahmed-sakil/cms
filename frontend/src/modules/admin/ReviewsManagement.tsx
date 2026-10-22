import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Phone,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
  message: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
}

export const ReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    name: "",
    role: "STUDENT",
    phone: "",
    message: "",
    rating: 5,
    isApproved: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const token = localStorage.getItem("cms_token");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/testimonials", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReviews(json.data || []);
      } else {
        toast.error("Failed to load reviews");
      }
    } catch {
      toast.error("Network error retrieving reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleStatus = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/testimonials/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(!currentApproved ? "Review approved and visible on site" : "Review hidden from site");
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !currentApproved } : r))
        );
      } else {
        toast.error("Could not update review status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the review from "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/testimonials/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Review deleted");
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error("Failed to delete review");
      }
    } catch {
      toast.error("Network error deleting review");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error("Please enter Reviewer Name and Review Message");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create review");
      }

      toast.success("Verified testimonial added successfully!");
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchReviews();
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchQuery =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.phone && r.phone.includes(searchQuery));

    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "APPROVED"
        ? r.isApproved
        : !r.isApproved;

    const matchRole =
      roleFilter === "ALL" ? true : r.role.toUpperCase() === roleFilter.toUpperCase();

    const matchRating =
      ratingFilter === "ALL" ? true : r.rating === Number(ratingFilter);

    return matchQuery && matchStatus && matchRole && matchRating;
  });

  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = totalReviews - approvedCount;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            Parents & Students Reviews & Advice Moderation
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Moderate, approve, and showcase authentic feedback, ratings, and student recommendations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Official Review
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
            Total Submissions
          </span>
          <span className="text-2xl font-black text-text-main font-mono">{totalReviews}</span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved & Visible
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {approvedCount}
          </span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Pending Moderation
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {pendingCount}
          </span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Average Rating
          </span>
          <span className="text-2xl font-black text-text-main font-mono">
            {averageRating} <span className="text-xs text-text-muted font-normal">/ 5.0</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-theme rounded-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, message, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Moderation</option>
          </select>

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
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="p-12 text-center text-text-muted text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-primary" />
          <p>Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-theme rounded-sm space-y-3">
          <MessageSquare className="w-10 h-10 text-text-muted/40 mx-auto" />
          <h3 className="text-sm font-bold text-text-main">No reviews match your filters</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchQuery
              ? "No feedback matched your search terms."
              : "No reviews submitted yet in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className={`bg-surface border rounded-sm p-4 space-y-3 relative flex flex-col justify-between transition-all shadow-xs ${
                r.isApproved ? "border-theme" : "border-amber-400/60 dark:border-amber-500/40 bg-amber-500/5"
              }`}
            >
              <div className="space-y-2.5">
                {/* Header: Name, Role, Rating & Status */}
                <div className="flex items-start justify-between gap-3 border-b border-theme/60 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-text-main truncate flex items-center gap-2">
                        {r.name}
                        <span className="px-1.5 py-0.5 rounded-xs bg-bg-app border border-theme text-[10px] font-semibold text-brand-primary uppercase">
                          {r.role}
                        </span>
                      </h4>
                      {r.phone && (
                        <p className="text-[11px] font-mono text-text-muted truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 text-text-muted/70" /> {r.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= r.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider ${
                        r.isApproved
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {r.isApproved ? "Approved" : "Pending Moderation"}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-text-main/90 leading-relaxed italic pl-1">
                  "{r.message}"
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2.5 border-t border-theme flex items-center justify-between text-xs">
                <span className="text-[10px] text-text-muted">
                  Submitted: {new Date(r.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(r.id, r.isApproved)}
                    className={`px-2.5 py-1 rounded-sm border text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                      r.isApproved
                        ? "border-amber-400/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                        : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold"
                    }`}
                  >
                    {r.isApproved ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Hide from Site
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    className="p-1.5 text-rose-500 hover:text-rose-600 border border-theme rounded-sm hover:bg-rose-500/10 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                Add Official Testimonial / Review
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
                  <label className="font-semibold text-text-main">Reviewer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engr. Asaduzzaman"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Role / Affiliation *</label>
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
                  <label className="font-semibold text-text-main">Verified Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Star Rating (1 - 5) *</label>
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
                <label className="font-semibold text-text-main">Review / Recommendation Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="The coaching methodology and exam system helped my son improve significantly..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isApproved"
                  checked={formData.isApproved}
                  onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                  className="w-4 h-4 text-brand-primary rounded-xs border-theme focus:ring-brand-primary cursor-pointer"
                />
                <label htmlFor="isApproved" className="font-semibold text-text-main cursor-pointer select-none">
                  Approve immediately and publish live on public website
                </label>
              </div>

              {/* Buttons */}
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
                      <CheckCircle2 className="w-3.5 h-3.5" /> Save & Publish
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
export default ReviewsManagement;
