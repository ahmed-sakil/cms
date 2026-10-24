import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Pin,
  Trash2,
  Globe,
  Lock,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../components/common/FileUpload.js";

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  pinned: boolean;
  priority?: string;
  attachmentUrl?: string | null;
  publishedAt: string;
  expiresAt?: string | null;
  branch?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  author?: { id: string; fullName: string; role?: string } | null;
}

export const NoticesManagement: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string; branchId?: string; branch?: { id: string } }[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";
  const userBranchId = currentUser?.branchId || currentUser?.branch?.id || "";

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublic: true,
    pinned: false,
    branchId: isBranchAdmin ? userBranchId : "",
    batchId: "",
    attachmentUrl: "",
    expiresAt: "",
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("cms_token");
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [nRes, brRes, bRes] = await Promise.all([
        fetch("/api/v1/ops/notices", { headers }),
        fetch("/api/v1/admin/branches", { headers }),
        fetch("/api/v1/academics/batches", { headers }),
      ]);

      const [nJson, brJson, bJson] = await Promise.all([
        nRes.json(),
        brRes.json(),
        bRes.json(),
      ]);

      if (nJson.success && Array.isArray(nJson.data)) setNotices(nJson.data);
      if (brJson.success && Array.isArray(brJson.data)) setBranches(brJson.data);
      if (bJson.success && Array.isArray(bJson.data)) setBatches(bJson.data);
    } catch {
      toast.error("Failed to load notice board items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Notice title is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Notice announcement content is required");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("cms_token");
      const activeBranchId = isBranchAdmin ? userBranchId : formData.branchId;

      const payload: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPublic: formData.isPublic,
        pinned: formData.pinned,
        priority: "NORMAL",
      };

      if (activeBranchId && activeBranchId.trim()) {
        payload.branchId = activeBranchId.trim();
      }
      if (formData.batchId && formData.batchId.trim()) {
        payload.batchId = formData.batchId.trim();
      }
      if (formData.attachmentUrl && formData.attachmentUrl.trim()) {
        payload.attachmentUrl = formData.attachmentUrl.trim();
      }
      if (formData.expiresAt && formData.expiresAt.trim()) {
        payload.expiresAt = formData.expiresAt.trim();
      }

      const res = await fetch("/api/v1/ops/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to publish notice");
      }

      toast.success("Notice published successfully!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        content: "",
        isPublic: true,
        pinned: false,
        branchId: isBranchAdmin ? userBranchId : "",
        batchId: "",
        attachmentUrl: "",
        expiresAt: "",
      });
      fetchNotices();
    } catch (err: any) {
      toast.error(err.message || "Error publishing notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch(`/api/v1/ops/notices/${id}/pin`, {
        method: "PATCH",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.pinned ? "Notice pinned to top" : "Notice unpinned");
        setNotices((prev) =>
          prev.map((n) => (n.id === id ? { ...n, pinned: json.data.pinned } : n))
        );
      }
    } catch {
      toast.error("Failed to update notice pin status");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notice "${title}"?`)) return;

    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch(`/api/v1/ops/notices/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Notice deleted");
        setNotices((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      toast.error("Failed to delete notice");
    }
  };

  // Filtered
  const filteredNotices = notices.filter((n) => {
    if (isBranchAdmin && n.branch && n.branch.id !== userBranchId) {
      return false;
    }

    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesScope = true;
    if (scopeFilter === "PUBLIC") matchesScope = n.isPublic;
    if (scopeFilter === "INTERNAL") matchesScope = !n.isPublic;
    if (scopeFilter === "PINNED") matchesScope = n.pinned;

    return matchesSearch && matchesScope;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-primary" /> Notice Board & Announcements
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Broadcast emergency updates, admission notices, holiday alerts, and exam routines.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Publish New Notice
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold">Total Notices</span>
            <Bell className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{notices.length}</p>
          <p className="text-[10px] text-text-muted">Active broadcasts</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-green-700">Public Website</span>
            <Globe className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-700">
            {notices.filter((n) => n.isPublic).length}
          </p>
          <p className="text-[10px] text-green-600 font-medium">Visible on landing page</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-blue-600">Batch Circulars</span>
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600">
            {notices.filter((n) => !n.isPublic).length}
          </p>
          <p className="text-[10px] text-text-muted">Enrolled students only</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-semibold text-brand-primary">Pinned to Top</span>
            <Pin className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-brand-primary">
            {notices.filter((n) => n.pinned).length}
          </p>
          <p className="text-[10px] text-text-muted">Spotlighted circulars</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notice title or announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Audiences</option>
            <option value="PUBLIC">Public Only</option>
            <option value="INTERNAL">Internal Student Batches</option>
            <option value="PINNED">Pinned Notices Only</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface border border-accent rounded-sm">
          Loading notices...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-accent rounded-sm space-y-2">
          <Bell className="w-10 h-10 text-text-muted mx-auto stroke-1" />
          <p className="text-sm font-semibold text-text-main">No announcements found</p>
          <p className="text-xs text-text-muted">
            Publish a notice to notify students about exams, classes, or holidays.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`bg-surface border rounded-sm p-5 flex flex-col justify-between shadow-xs transition-colors ${
                n.pinned
                  ? "border-brand-primary/80 ring-1 ring-brand-primary/30"
                  : "border-accent hover:border-brand-primary/40"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {n.pinned && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary font-bold rounded-xs uppercase tracking-wider">
                        <Pin className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}

                    {n.isPublic ? (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 rounded-xs font-semibold">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-accent-subtle text-text-muted rounded-xs font-semibold">
                        <Lock className="w-3 h-3" /> Batch Only
                      </span>
                    )}

                    {n.author && (
                      <span className="text-[10px] text-text-muted">
                        by {n.author.fullName}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTogglePin(n.id)}
                    className={`p-1 rounded-sm border transition-colors ${
                      n.pinned
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "border-accent text-text-muted hover:text-text-main"
                    }`}
                    title={n.pinned ? "Unpin notice" : "Pin notice to top"}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-text-main line-clamp-2 leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-3 mt-1.5 leading-relaxed">
                    {n.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-accent space-y-1 text-xs text-text-muted">
                  {n.branch && (
                    <div className="text-[11px]">
                      Campus: <span className="font-semibold text-text-main">{n.branch.name}</span>
                    </div>
                  )}
                  {n.batch && (
                    <div className="text-[11px]">
                      Batch: <span className="font-semibold text-text-main">{n.batch.name}</span>
                    </div>
                  )}
                  {n.attachmentUrl && (
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-brand-primary font-semibold underline pt-1"
                    >
                      <Paperclip className="w-3 h-3" /> Attached PDF / File
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-accent flex items-center justify-between text-[11px] text-text-muted">
                <span className="font-mono">{new Date(n.publishedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDelete(n.id, n.title)}
                  className="p-1 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors"
                  title="Delete notice"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-primary" /> Publish Announcement Notice
                </h3>
                <p className="text-xs text-text-muted">
                  Broadcast updates across the coaching website or specific student batches.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-text-main mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Revision Class Schedule for HSC 2026 Batch"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-main mb-1">
                  Announcement Details & Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter full details, dates, room numbers, and relevant guidance..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-main mb-1">Scope Campus</label>
                  {isBranchAdmin ? (
                    <div className="w-full px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-sm text-brand-primary font-semibold text-xs flex items-center justify-between">
                      <span className="truncate">
                        {currentUser?.branch?.name || branches.find((b) => b.id === userBranchId)?.name || "Assigned Campus"}
                      </span>
                      <span className="text-[10px] text-brand-primary/70 font-normal">(Campus Scoped)</span>
                    </div>
                  ) : (
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main"
                    >
                      <option value="">All Campuses (Universal)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-text-main mb-1">
                    Target Specific Batch (Optional)
                  </label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main"
                  >
                    <option value="">All Batches {isBranchAdmin ? "(In My Campus)" : ""}</option>
                    {batches
                      .filter((b) => !isBranchAdmin || !b.branchId || b.branchId === userBranchId || b.branch?.id === userBranchId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <FileUpload
                  label="Attach File / Routine PDF (Optional)"
                  folder="general"
                  isImage={false}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  value={formData.attachmentUrl}
                  onChange={(url) => setFormData({ ...formData, attachmentUrl: url })}
                  helperText="Uploads attachment to Supabase Storage."
                />
              </div>

              <div className="pt-1 space-y-2 border-t border-accent">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-brand-primary rounded-xs"
                  />
                  <span className="font-semibold text-text-main">
                    Show on Public Landing Page Notice Board
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 text-brand-primary rounded-xs"
                  />
                  <span className="font-semibold text-text-main">
                    Pin notice to top of announcements
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-accent flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
