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
  publishedAt: string;
  attachmentUrl?: string | null;
  batch?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  author?: { fullName: string } | null;
}

export const TeacherNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string; code: string; courseId?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("ALL");

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
      toast.error("Failed to load course notices");
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
        title: form.title,
        content: form.content,
        priority: "NORMAL",
        attachmentUrl: form.attachmentUrl || undefined,
      });

      if (res.success) {
        toast.success("Course circular broadcasted to enrolled students!");
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

  const filteredNotices = notices.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.batch?.name && n.batch.name.toLowerCase().includes(q));

    const matchesBatch =
      batchFilter === "ALL" || (n.batch && n.batch.id === batchFilter);

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" /> Class Circulars & Broadcasts
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Course-Specific Notices
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Publish reminders, class reschedule circulars, and test announcements to your assigned students.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Post New Circular
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search circular title or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-text-muted font-bold">Target Batch:</span>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading circulars...
          </div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No circulars published</p>
          <p className="text-xs text-text-muted mt-1">
            Click "Post New Circular" to announce schedule shifts, exam guidelines, or materials to your batch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              onClick={() => setSelectedNotice(n)}
              className="bg-surface border border-accent rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/40 cursor-pointer transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {n.pinned && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-brand-primary/10 text-brand-primary">
                        Pinned
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted">
                      {n.batch?.name || n.course?.name || "All Assigned"}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-main leading-snug">{n.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-brand-primary" />
                    Target: {n.batch?.name || n.course?.name || "All Assigned Students"}
                  </p>
                </div>

                <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                  {n.content}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-accent flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-muted">
                  By: {n.author?.fullName || "Faculty"}
                </span>
                {n.attachmentUrl && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary">
                    <Paperclip className="w-3 h-3" /> Attachment attached
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Circular Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-center justify-between bg-bg-app">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-primary" />
                <h2 className="text-sm sm:text-base font-bold text-text-main">Broadcast Course Circular</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Target Batch</label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-semibold"
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
                <label className="text-xs font-bold text-text-main block mb-1">Circular Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Schedule Change for Sunday Physics Lab"
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
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
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Attachment (Optional)</label>
                <FileUpload
                  folder="materials"
                  accept="application/pdf,image/*"
                  onChange={(url: string) => setForm((prev) => ({ ...prev, attachmentUrl: url }))}
                  value={form.attachmentUrl}
                />
                {form.attachmentUrl && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Attachment uploaded: {form.attachmentUrl.split("/").pop()}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-accent flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-start justify-between bg-bg-app">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {selectedNotice.pinned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-brand-primary/10 text-brand-primary">
                      Pinned
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted">
                    {selectedNotice.batch?.name || selectedNotice.course?.name || "All Assigned Students"}
                  </span>
                </div>
                <h2 className="text-base font-bold text-text-main mt-1">{selectedNotice.title}</h2>
                <p className="text-[11px] text-text-muted">
                  Published: {new Date(selectedNotice.publishedAt).toLocaleDateString()}
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
              <div className="bg-bg-app rounded-sm p-4 border border-accent/60 text-xs text-text-main leading-relaxed whitespace-pre-wrap">
                {selectedNotice.content}
              </div>

              {selectedNotice.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={selectedNotice.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-brand-primary text-white text-xs font-bold rounded-sm shadow-xs hover:opacity-90"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> View Notice Attachment
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-accent bg-bg-app flex justify-end">
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
    </div>
  );
};
