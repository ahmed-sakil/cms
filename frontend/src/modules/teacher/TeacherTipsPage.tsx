import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Loader2,
  X,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { FileUpload } from "../../components/common/FileUpload.js";

interface FacultyTipItem {
  id: string;
  category: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle?: string | null;
  coverImage?: string | null;
  createdAt: string;
}

export const TeacherTipsPage: React.FC = () => {
  const [tips, setTips] = useState<FacultyTipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: "EXAM_PREPARATION",
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
  });

  // Reading Drawer
  const [selectedTip, setSelectedTip] = useState<FacultyTipItem | null>(null);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<FacultyTipItem[]>("/teacher/tips");
      if (res.success && Array.isArray(res.data)) {
        setTips(res.data);
      }
    } catch {
      try {
        const publicRes = await apiClient.get<FacultyTipItem[]>("/public/tips");
        if (publicRes.success && Array.isArray(publicRes.data)) {
          setTips(publicRes.data);
        }
      } catch {
        toast.error("Failed to load academic tips");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleCreateTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error("Please fill in all required article fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post<any>("/teacher/tips", {
        category: form.category,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || undefined,
      });

      if (res.success) {
        toast.success("Faculty article published to landing page & student hub!");
        setIsModalOpen(false);
        setForm({
          category: "EXAM_PREPARATION",
          title: "",
          excerpt: "",
          content: "",
          coverImage: "",
        });
        fetchTips();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish article");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = tips.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.excerpt.toLowerCase().includes(q) ||
      t.author.toLowerCase().includes(q);

    const matchesCat = categoryFilter === "ALL" || t.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Faculty Knowledge & Mentorship
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Academic Tips & Study Guides
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Author educational advice, exam preparation strategies, and subject insights featured on the public portal.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Author New Guide
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search tip title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "EXAM_PREPARATION", "STUDY_TECHNIQUES", "ACADEMIC_EXCELLENCE", "CAREER_GUIDANCE"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-xs font-bold rounded-sm border whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                  : "bg-surface text-text-muted border-accent hover:text-text-main"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading faculty guides...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No faculty guides published</p>
          <p className="text-xs text-text-muted mt-1">
            Click "Author New Guide" above to write an academic article for students and visitors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tip) => (
            <div
              key={tip.id}
              onClick={() => setSelectedTip(tip)}
              className="bg-surface border border-accent rounded-sm overflow-hidden shadow-xs flex flex-col justify-between hover:border-brand-primary/40 cursor-pointer transition-colors group"
            >
              <div>
                {tip.coverImage && (
                  <div className="h-40 w-full overflow-hidden bg-bg-app border-b border-accent">
                    <img
                      src={tip.coverImage}
                      alt={tip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs uppercase tracking-wider">
                      {tip.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(tip.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-main leading-snug group-hover:text-brand-primary transition-colors">
                    {tip.title}
                  </h3>

                  <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                    {tip.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-accent flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold text-text-main flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-primary" />
                  {tip.author}
                </span>
                <span className="text-brand-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Read Guide →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Author New Guide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-center justify-between bg-bg-app">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-primary" />
                <h2 className="text-sm sm:text-base font-bold text-text-main">Author Faculty Article</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTip} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-semibold"
                  >
                    <option value="EXAM_PREPARATION">Exam Preparation</option>
                    <option value="STUDY_TECHNIQUES">Study Techniques</option>
                    <option value="ACADEMIC_EXCELLENCE">Academic Excellence</option>
                    <option value="CAREER_GUIDANCE">Career Guidance</option>
                    <option value="MENTAL_HEALTH">Stress & Mental Wellness</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Cover Image (Optional)</label>
                  <FileUpload
                    folder="posters"
                    accept="image/*"
                    onChange={(url: string) => setForm((prev) => ({ ...prev, coverImage: url }))}
                    value={form.coverImage}
                    isImage={true}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Article Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 5 Proven Methods to Excel in Physics Higher Math"
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Brief Excerpt *</label>
                <input
                  type="text"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Short introductory summary for card previews..."
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Full Content / Article *</label>
                <textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write the full mentorship guide, steps, study hacks, and advice..."
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-accent flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publish Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Tip Detail Modal */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-start justify-between bg-bg-app shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs uppercase tracking-wider">
                  {selectedTip.category.replace(/_/g, " ")}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-text-main mt-1 leading-snug">
                  {selectedTip.title}
                </h2>
                <p className="text-xs text-text-muted">
                  By {selectedTip.author} • {new Date(selectedTip.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTip(null)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedTip.coverImage && (
                <div className="rounded-sm overflow-hidden max-h-64 border border-accent">
                  <img
                    src={selectedTip.coverImage}
                    alt={selectedTip.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-xs sm:text-sm text-text-main leading-relaxed whitespace-pre-wrap font-sans">
                {selectedTip.content}
              </div>
            </div>

            <div className="p-4 border-t border-accent bg-bg-app flex justify-end shrink-0">
              <button
                onClick={() => setSelectedTip(null)}
                className="px-4 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
