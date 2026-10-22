import React, { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Search,
  Star,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  School,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../components/common/FileUpload.js";

interface AchievementItem {
  id: string;
  studentName: string;
  avatarUrl?: string | null;
  batchName: string;
  achievement: string;
  college?: string | null;
  year: string;
  posterUrl?: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

export const AchievementsManagement: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    studentName: "",
    avatarUrl: "",
    batchName: "",
    achievement: "",
    college: "",
    year: "2025",
    posterUrl: "",
    isFeatured: true,
    displayOrder: 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  const token = localStorage.getItem("cms_token");

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/achievements", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAchievements(json.data || []);
      } else {
        toast.error("Failed to load student achievements");
      }
    } catch {
      toast.error("Network error retrieving achievements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AchievementItem) => {
    setEditingId(item.id);
    setFormData({
      studentName: item.studentName,
      avatarUrl: item.avatarUrl || "",
      batchName: item.batchName,
      achievement: item.achievement,
      college: item.college || "",
      year: item.year || "2025",
      posterUrl: item.posterUrl || "",
      isFeatured: item.isFeatured,
      displayOrder: item.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.achievement.trim() || !formData.batchName.trim()) {
      toast.error("Please fill in Student Name, Achievement Headline, and Batch Name");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/v1/admin/achievements/${editingId}`
        : "/api/v1/admin/achievements";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          displayOrder: Number(formData.displayOrder || 0),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save achievement");
      }

      toast.success(editingId ? "Achievement updated!" : "Student achievement added to Hall of Fame!");
      setIsModalOpen(false);
      fetchAchievements();
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/achievements/${id}/featured`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(!currentStatus ? "Marked as Featured in Hero" : "Removed from Featured");
        setAchievements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isFeatured: !currentStatus } : a))
        );
      } else {
        toast.error("Could not update featured status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete the achievement record for ${studentName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/achievements/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Achievement record deleted");
        setAchievements((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error("Failed to delete record");
      }
    } catch {
      toast.error("Network error deleting achievement");
    }
  };

  // Filtered achievements
  const filteredAchievements = achievements.filter((a) => {
    const matchQuery =
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.achievement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.college && a.college.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.batchName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchFeatured =
      featuredFilter === "ALL"
        ? true
        : featuredFilter === "FEATURED"
        ? a.isFeatured
        : !a.isFeatured;

    const matchYear = yearFilter === "ALL" ? true : a.year === yearFilter;

    return matchQuery && matchFeatured && matchYear;
  });

  const uniqueYears = Array.from(new Set(achievements.map((a) => a.year))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Bright Student Achievements & Hall of Fame
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Showcase top rankers, university admission highlights, and board exam toppers on the public portal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Student Achievement
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
            Total Achievements
          </span>
          <span className="text-2xl font-black text-text-main font-mono">{achievements.length}</span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Featured in Hero
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {achievements.filter((a) => a.isFeatured).length}
          </span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
            Colleges Represented
          </span>
          <span className="text-2xl font-black text-text-main font-mono">
            {new Set(achievements.map((a) => a.college).filter(Boolean)).size}
          </span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
            Latest Batch Year
          </span>
          <span className="text-2xl font-black text-text-main font-mono">
            {uniqueYears[0] || "2025"}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-theme rounded-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, achievement, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
          >
            <option value="ALL">All Visibility</option>
            <option value="FEATURED">Featured Only</option>
            <option value="UNFEATURED">Archived / Hidden</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
          >
            <option value="ALL">All Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Achievements List */}
      {loading ? (
        <div className="p-12 text-center text-text-muted text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-primary" />
          <p>Loading achievements...</p>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-theme rounded-sm space-y-3">
          <Trophy className="w-10 h-10 text-text-muted/40 mx-auto" />
          <h3 className="text-sm font-bold text-text-main">No achievements found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchQuery
              ? "No records match your search criteria. Try a different query."
              : "Get started by adding your first student success story or university admission highlight."}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95"
          >
            Add Student Achievement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((item) => (
            <div
              key={item.id}
              className={`bg-surface border rounded-sm p-4 space-y-3.5 relative flex flex-col justify-between transition-all shadow-xs ${
                item.isFeatured ? "border-amber-400/60 dark:border-amber-500/40" : "border-theme"
              }`}
            >
              <div className="space-y-3">
                {/* Header: Student Info & Featured Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.studentName}
                        className="w-11 h-11 rounded-full object-cover border border-theme shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {item.studentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-text-main truncate">
                        {item.studentName}
                      </h4>
                      {item.college && (
                        <p className="text-[11px] text-text-muted truncate flex items-center gap-1">
                          <School className="w-3 h-3 text-text-muted/70 shrink-0" /> {item.college}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      item.isFeatured
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30"
                        : "bg-accent text-text-muted"
                    }`}
                  >
                    {item.isFeatured ? "Featured" : "Regular"}
                  </span>
                </div>

                {/* Achievement Highlight */}
                <div className="p-2.5 bg-bg-app border border-theme rounded-sm space-y-1">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Admission / Exam Rank
                  </span>
                  <p className="text-xs font-bold text-text-main leading-snug">
                    {item.achievement}
                  </p>
                </div>

                {/* Batch & Year Tags */}
                <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-theme/60 pt-2">
                  <span className="font-medium truncate max-w-[180px]">Batch: {item.batchName}</span>
                  <span className="font-mono font-semibold">Year {item.year}</span>
                </div>

                {/* Poster Thumbnail if present */}
                {item.posterUrl && (
                  <div className="relative rounded-sm overflow-hidden border border-theme h-28 bg-slate-900 group">
                    <img
                      src={item.posterUrl}
                      alt="Achievement Poster"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={item.posterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white text-slate-900 text-xs font-bold rounded-sm flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Full Poster
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="pt-2.5 border-t border-theme flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(item.id, item.isFeatured)}
                  className={`px-2 py-1 rounded-sm border text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    item.isFeatured
                      ? "border-amber-400/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                      : "border-theme text-text-muted hover:text-text-main bg-bg-app"
                  }`}
                >
                  <Star className={`w-3 h-3 ${item.isFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
                  {item.isFeatured ? "Featured" : "Feature"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-text-muted hover:text-brand-primary border border-theme rounded-sm hover:bg-bg-app transition-colors"
                    title="Edit Achievement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.studentName)}
                    className="p-1.5 text-rose-500 hover:text-rose-600 border border-theme rounded-sm hover:bg-rose-500/10 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-theme rounded-sm max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {editingId ? "Edit Student Achievement" : "Add Student Achievement to Hall of Fame"}
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
                  <label className="font-semibold text-text-main">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abrar Fahim"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Admission / Exam Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-main">Achievement Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st in Dhaka University ('Ka' Unit) / BUET 14th Rank"
                  value={formData.achievement}
                  onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Batch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DU Ka Unit Special Batch"
                    value={formData.batchName}
                    onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">College / School</label>
                  <input
                    type="text"
                    placeholder="e.g. Notre Dame College, Dhaka"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Photo & Poster Uploads */}
              <div className="space-y-3 pt-1 border-t border-theme/60">
                <FileUpload
                  label="Student Avatar / Photo"
                  folder="avatars"
                  value={formData.avatarUrl}
                  onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
                  helperText="Recommended square photo (e.g. 400x400 JPG or PNG)"
                />

                <FileUpload
                  label="Achievement Poster / Banner (Optional)"
                  folder="posters"
                  value={formData.posterUrl}
                  onChange={(url) => setFormData({ ...formData, posterUrl: url })}
                  helperText="Full promotional banner or admission congratulatory poster"
                />
              </div>

              {/* Display Order & Featured Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-theme/60 items-center">
                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Display Order Priority</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                    placeholder="0 = default"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-brand-primary rounded-xs border-theme focus:ring-brand-primary cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="font-semibold text-text-main cursor-pointer select-none">
                    Feature on Portal Hero / Hall of Fame
                  </label>
                </div>
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {editingId ? "Update Record" : "Save Record"}
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
export default AchievementsManagement;
