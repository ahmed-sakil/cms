import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FileUpload } from "../../components/common/FileUpload.js";

interface FacultyTipItem {
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
  isPublished: boolean;
  displayOrder: number;
  viewsCount: number;
  createdAt: string;
}

export const FacultyTipsManagement: React.FC = () => {
  const [tips, setTips] = useState<FacultyTipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [publishFilter, setPublishFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    category: "Mathematics",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    authorTitle: "",
    authorImage: "",
    coverImage: "",
    readTime: "4 min read",
    isPublished: true,
    displayOrder: 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  const token = localStorage.getItem("cms_token");

  const fetchTips = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/faculty-tips", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTips(json.data || []);
      } else {
        toast.error("Failed to load faculty tips");
      }
    } catch {
      toast.error("Network error retrieving faculty tips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FacultyTipItem) => {
    setEditingId(item.id);
    setFormData({
      category: item.category,
      title: item.title,
      slug: item.slug || "",
      excerpt: item.excerpt,
      content: item.content,
      author: item.author,
      authorTitle: item.authorTitle || "",
      authorImage: item.authorImage || "",
      coverImage: item.coverImage || "",
      readTime: item.readTime,
      isPublished: item.isPublished,
      displayOrder: item.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim() || !formData.author.trim()) {
      toast.error("Please fill in Title, Excerpt, Content body, and Author name");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/v1/admin/faculty-tips/${editingId}`
        : "/api/v1/admin/faculty-tips";
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
        throw new Error(json.message || "Failed to save faculty tip");
      }

      toast.success(editingId ? "Faculty article updated!" : "New faculty guide published!");
      setIsModalOpen(false);
      fetchTips();
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/faculty-tips/${id}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(!currentStatus ? "Faculty guide published to public site" : "Faculty guide unpublished/drafted");
        setTips((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isPublished: !currentStatus } : t))
        );
      } else {
        toast.error("Could not update publish state");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/faculty-tips/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Faculty tip deleted");
        setTips((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error("Failed to delete tip");
      }
    } catch {
      toast.error("Network error deleting tip");
    }
  };

  // Filter tips
  const filteredTips = tips.filter((t) => {
    const matchQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = categoryFilter === "ALL" ? true : t.category === categoryFilter;

    const matchPublish =
      publishFilter === "ALL"
        ? true
        : publishFilter === "PUBLISHED"
        ? t.isPublished
        : !t.isPublished;

    return matchQuery && matchCategory && matchPublish;
  });

  const uniqueCategories = Array.from(new Set(tips.map((t) => t.category))).filter(Boolean);
  const totalViews = tips.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-primary" />
            Faculty Tips, Strategies & Study Guides
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Author and publish actionable academic advice, CQ/MCQ problem shortcuts, and admission strategy articles.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Create Faculty Guide
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
            Total Articles
          </span>
          <span className="text-2xl font-black text-text-main font-mono">{tips.length}</span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Published & Live
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {tips.filter((t) => t.isPublished).length}
          </span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block flex items-center gap-1">
            <Eye className="w-3 h-3" /> Total Student Readers
          </span>
          <span className="text-2xl font-black text-text-main font-mono">{totalViews}</span>
        </div>
        <div className="p-4 bg-surface border border-theme rounded-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
            Subject Categories
          </span>
          <span className="text-2xl font-black text-text-main font-mono">
            {uniqueCategories.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-theme rounded-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, subject, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts / Hidden</option>
          </select>
        </div>
      </div>

      {/* Faculty Tips List */}
      {loading ? (
        <div className="p-12 text-center text-text-muted text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-primary" />
          <p>Loading faculty tips...</p>
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-theme rounded-sm space-y-3">
          <BookOpen className="w-10 h-10 text-text-muted/40 mx-auto" />
          <h3 className="text-sm font-bold text-text-main">No faculty guides found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchQuery
              ? "No articles match your search criteria. Try a different query."
              : "Share study tips, exam advice, and subject shortcuts with your students."}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-95"
          >
            Create Faculty Guide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-surface border border-theme rounded-sm p-4 space-y-3 relative flex flex-col justify-between hover:border-brand-primary/50 transition-all shadow-xs"
            >
              <div className="space-y-2.5">
                {/* Category & Read Time */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    {tip.category}
                  </span>
                  <span className="text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {tip.readTime}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-text-main hover:text-brand-primary transition-colors leading-snug">
                  {tip.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                  {tip.excerpt}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-2 pt-2 border-t border-theme/60 text-xs text-text-muted">
                  {tip.authorImage ? (
                    <img
                      src={tip.authorImage}
                      alt={tip.author}
                      className="w-6 h-6 rounded-full object-cover border border-theme"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent text-text-main font-bold text-[10px] flex items-center justify-center">
                      {tip.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="block font-medium text-text-main truncate text-[11px]">
                      {tip.author}
                    </span>
                    {tip.authorTitle && (
                      <span className="block text-[10px] text-text-muted truncate">
                        {tip.authorTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-theme flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(tip.id, tip.isPublished)}
                    className={`px-2 py-1 rounded-sm border text-[10px] font-semibold transition-colors ${
                      tip.isPublished
                        ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "border-theme text-text-muted bg-bg-app hover:text-text-main"
                    }`}
                  >
                    {tip.isPublished ? "Live on Portal" : "Hidden (Draft)"}
                  </button>

                  <span className="text-[10px] text-text-muted font-mono flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {tip.viewsCount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/tips/${tip.id}`}
                    target="_blank"
                    className="p-1.5 text-text-muted hover:text-brand-primary border border-theme rounded-sm hover:bg-bg-app transition-colors"
                    title="View Public Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleOpenEditModal(tip)}
                    className="p-1.5 text-text-muted hover:text-brand-primary border border-theme rounded-sm hover:bg-bg-app transition-colors"
                    title="Edit Tip"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tip.id, tip.title)}
                    className="p-1.5 text-rose-500 hover:text-rose-600 border border-theme rounded-sm hover:bg-rose-500/10 transition-colors"
                    title="Delete Tip"
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
          <div className="bg-surface border border-theme rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-primary" />
                {editingId ? "Edit Faculty Tip & Study Guide" : "Create New Faculty Tip & Study Guide"}
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
                  <label className="font-semibold text-text-main">Subject / Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Exam Strategy">Exam Strategy</option>
                    <option value="Time Management">Time Management</option>
                    <option value="Board Exam Prep">Board Exam Prep</option>
                    <option value="General Academic">General Academic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Estimated Read Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-main">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus & Vector Problem Solving Mastery for Board & Admission"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-main">Excerpt / Summary (Shown on Cards) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief 2-line summary of what students will learn from this guide..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Faculty Author Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Mahmud Hasan"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-main">Author Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Math Faculty (BUET)"
                    value={formData.authorTitle}
                    onChange={(e) => setFormData({ ...formData, authorTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-main">
                  Full Article Content & Guidance Steps *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Provide detailed, numbered or markdown-formatted academic guidance for students..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Image Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-theme/60">
                <FileUpload
                  label="Author Avatar / Photo"
                  folder="avatars"
                  value={formData.authorImage}
                  onChange={(url) => setFormData({ ...formData, authorImage: url })}
                  helperText="Faculty headshot (square image)"
                />

                <FileUpload
                  label="Article Banner / Cover (Optional)"
                  folder="posters"
                  value={formData.coverImage}
                  onChange={(url) => setFormData({ ...formData, coverImage: url })}
                  helperText="Optional wide banner photo"
                />
              </div>

              {/* Publication Status & Display Order */}
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
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-brand-primary rounded-xs border-theme focus:ring-brand-primary cursor-pointer"
                  />
                  <label htmlFor="isPublished" className="font-semibold text-text-main cursor-pointer select-none">
                    Publish Guide Live on Public Portal
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
                      <CheckCircle2 className="w-3.5 h-3.5" /> {editingId ? "Update Article" : "Publish Guide"}
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
export default FacultyTipsManagement;
