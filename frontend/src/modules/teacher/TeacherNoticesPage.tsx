import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Calendar,
  Paperclip,
  X,
  Send,
  Loader2,
  Users,
  Pin,
  Globe,
  Lock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { FileUpload } from "../../components/common/FileUpload.js";

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  priority?: string;
  pinned: boolean;
  isPublic?: boolean;
  publishedAt: string;
  attachmentUrl?: string | null;
  authorId?: string | null;
  branch?: { id: string; name: string; code?: string } | null;
  batch?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  author?: { id?: string; fullName: string } | null;
}

export const TeacherNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string; code: string; courseId?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "BATCH" | "CAMPUS">("ALL");
  const [batchFilter, setBatchFilter] = useState<string>("ALL");

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    batchId: "",
    title: "",
    content: "",
    attachmentUrl: "",
  });

  // Selected Notice Modal
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<NoticeItem[]>("/teacher/notices");
      if (res.success && Array.isArray(res.data)) {
        setNotices(res.data);
      }
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiClient.get<any[]>("/teacher/batches");
      if (res.success && Array.isArray(res.data)) {
        const batchList = res.data;
        setBatches(batchList);
        if (batchList.length > 0 && !form.batchId) {
          setForm((prev) => ({ ...prev, batchId: batchList[0].id }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotices();
    fetchBatches();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Please enter notice title and content");
      return;
    }

    try {
      setCreating(true);
      const targetBatch = batches.find((b) => b.id === form.batchId);
      const res = await apiClient.post<any>("/teacher/notices", {
        batchId: form.batchId || undefined,
        courseId: targetBatch?.courseId || undefined,
        title: form.title.trim(),
        content: form.content.trim(),
        priority: "NORMAL",
        attachmentUrl: form.attachmentUrl || undefined,
      });

      if (res.success) {
        toast.success("Notice broadcasted to assigned batch!");
        setIsCreateModalOpen(false);
        setForm({
          batchId: batches[0]?.id || "",
          title: "",
          content: "",
          attachmentUrl: "",
        });
        fetchNotices();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish notice");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNotice = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notice "${title}"?`)) return;

    try {
      const res = await apiClient.delete<any>(`/teacher/notices/${id}`);
      if (res.success) {
        toast.success("Notice deleted successfully");
        setNotices((prev) => prev.filter((n) => n.id !== id));
        if (selectedNotice && selectedNotice.id === id) {
          setSelectedNotice(null);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notice");
    }
  };

  const isAuthor = (item: NoticeItem) => {
    if (!currentUser) return false;
    if (item.authorId && item.authorId === currentUser.id) return true;
    if (item.author?.id && item.author.id === currentUser.id) return true;
    if (item.author?.fullName && item.author.fullName === currentUser.fullName) return true;
    return false;
  };

  const filteredNotices = notices.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.batch?.name && n.batch.name.toLowerCase().includes(q)) ||
      (n.course?.name && n.course.name.toLowerCase().includes(q)) ||
      (n.branch?.name && n.branch.name.toLowerCase().includes(q));

    let matchesScope = true;
    if (scopeFilter === "BATCH") matchesScope = !!n.batch;
    if (scopeFilter === "CAMPUS") matchesScope = !n.batch;

    let matchesBatch = true;
    if (scopeFilter !== "CAMPUS" && batchFilter !== "ALL") {
      matchesBatch = n.batch?.id === batchFilter;
    }

    return matchesSearch && matchesScope && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Unified Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" /> Notice Board
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight mt-0.5">
            Notice Board
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Broadcast and manage notices for your assigned student batches and view campus announcements.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs shrink-0 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      {/* Unified Search & Filter Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search notice title, details, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Audience Filter: All, Batch, Campus & General */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">Audience:</span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as "ALL" | "BATCH" | "CAMPUS")}
              className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
            >
              <option value="ALL">All Notices</option>
              <option value="BATCH">My Batch Notices</option>
              <option value="CAMPUS">Campus & General Notices</option>
            </select>
          </div>

          {/* Target Batch Filter */}
          {scopeFilter !== "CAMPUS" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-bold">Batch:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
              >
                <option value="ALL">All Assigned Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Unified Notices Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-surface border border-accent rounded-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading notices...
          </div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No notices posted</p>
          <p className="text-xs text-text-muted mt-1">
            Click "Post Notice" to announce schedule shifts, exam guidelines, or materials to your batch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.map((n) => {
            const authorMatch = isAuthor(n);
            return (
              <div
                key={n.id}
                onClick={() => setSelectedNotice(n)}
                className={`bg-surface border rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/40 cursor-pointer transition-colors ${
                  n.pinned ? "border-brand-primary/50 bg-brand-primary/[0.015]" : "border-accent"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {n.pinned && (
                        <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                          <Pin className="w-3 h-3 fill-current" /> Pinned
                        </span>
                      )}
                      {n.isPublic ? (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-accent-subtle text-text-muted px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                          <Lock className="w-3 h-3" /> Internal
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted truncate max-w-[120px]">
                        {n.batch?.name || n.course?.name || n.branch?.name || "Campus & General"}
                      </span>
                    </div>

                    <span className="text-xs text-text-muted flex items-center gap-1 shrink-0 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(n.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-main leading-snug line-clamp-2 mt-2">
                      {n.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5 truncate">
                      <Users className="w-3 h-3 text-brand-primary shrink-0" />
                      Target: {n.batch ? `Batch: ${n.batch.name}` : n.course ? `Course: ${n.course.name}` : n.branch ? `Campus: ${n.branch.name}` : "Campus & General Announcement"}
                    </p>
                  </div>

                  <p className="text-xs text-text-muted line-clamp-3 leading-relaxed mt-2">
                    {n.content}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-accent flex items-center justify-between text-xs">
                  <span className="text-[11px] text-text-muted truncate max-w-[120px]">
                    By {n.author?.fullName || "Faculty"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {n.attachmentUrl && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary mr-1">
                        <Paperclip className="w-3 h-3" />
                      </span>
                    )}

                    {authorMatch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotice(n.id, n.title);
                        }}
                        title="Delete your notice"
                        className="p-1.5 rounded-sm border border-accent text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-start justify-between bg-bg-app">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedNotice.pinned && (
                    <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                      <Pin className="w-3 h-3 fill-current" /> Pinned
                    </span>
                  )}
                  {selectedNotice.isPublic ? (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                      <Globe className="w-3 h-3" /> Public Landing Page
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-accent-subtle text-text-muted px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                      <Lock className="w-3 h-3" /> Internal Students Only
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted">
                    {selectedNotice.batch ? selectedNotice.batch.name : selectedNotice.course ? selectedNotice.course.name : selectedNotice.branch ? selectedNotice.branch.name : "Campus & General Announcement"}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-text-main mt-1 leading-snug">
                  {selectedNotice.title}
                </h2>
                <p className="text-[11px] text-text-muted">
                  Published: {new Date(selectedNotice.publishedAt).toLocaleString()}
                  {selectedNotice.author && ` • By: ${selectedNotice.author.fullName}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-bg-app rounded-sm p-4 border border-accent/60 text-xs text-text-main leading-relaxed whitespace-pre-wrap font-sans">
                {selectedNotice.content}
              </div>

              {selectedNotice.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={selectedNotice.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-brand-primary text-white text-xs font-semibold rounded-sm shadow-xs hover:opacity-90"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> Download / View Attachment
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-accent bg-bg-app flex flex-wrap items-center justify-between gap-2">
              <div>
                {isAuthor(selectedNotice) && (
                  <button
                    onClick={() => handleDeleteNotice(selectedNotice.id, selectedNotice.title)}
                    className="px-3 py-1.5 bg-surface border border-red-500/30 text-red-500 text-xs font-semibold rounded-sm hover:bg-red-500/10 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Notice
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Notice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-primary" />
                <h2 className="text-sm sm:text-base font-bold text-text-main">Post Course Notice</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Target Batch</label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-semibold focus:outline-none focus:border-brand-primary"
                >
                  <option value="">All My Assigned Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Notice Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Schedule Change for Sunday Physics Lab"
                  required
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Notice Content *</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write details for the announcement..."
                  required
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main leading-relaxed focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <FileUpload
                  label="Attach File / Routine PDF (Optional)"
                  folder="materials"
                  isImage={false}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(url: string) => setForm((prev) => ({ ...prev, attachmentUrl: url }))}
                  value={form.attachmentUrl}
                />
              </div>

              <div className="pt-3 border-t border-accent flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-surface border border-accent text-text-muted text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
