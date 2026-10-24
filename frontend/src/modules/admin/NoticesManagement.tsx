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
  Calendar,
  Users,
  Pencil,
  X,
  Loader2,
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
  const [batchFilter, setBatchFilter] = useState("ALL");

  // Selected Notice for Detail Modal
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleOpenCreate = () => {
    setEditingId(null);
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: NoticeItem) => {
    setEditingId(notice.id);
    setFormData({
      title: notice.title,
      content: notice.content,
      isPublic: notice.isPublic,
      pinned: notice.pinned,
      branchId: notice.branch?.id || (isBranchAdmin ? userBranchId : ""),
      batchId: notice.batch?.id || "",
      attachmentUrl: notice.attachmentUrl || "",
      expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 10) : "",
    });
    setIsModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
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
        branchId: activeBranchId && activeBranchId.trim() ? activeBranchId.trim() : null,
        batchId: formData.batchId && formData.batchId.trim() ? formData.batchId.trim() : null,
        attachmentUrl: formData.attachmentUrl && formData.attachmentUrl.trim() ? formData.attachmentUrl.trim() : null,
        expiresAt: formData.expiresAt && formData.expiresAt.trim() ? formData.expiresAt.trim() : null,
      };

      const url = editingId ? `/api/v1/ops/notices/${editingId}` : "/api/v1/ops/notices";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${editingId ? "update" : "publish"} notice`);
      }

      toast.success(editingId ? "Notice updated successfully" : "Notice published successfully");
      setIsModalOpen(false);
      setEditingId(null);
      fetchNotices();

      if (selectedNotice && selectedNotice.id === editingId) {
        setSelectedNotice({
          ...selectedNotice,
          ...payload,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving notice");
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
        const newPinned = json.data.pinned;
        toast.success(newPinned ? "Notice pinned to top" : "Notice unpinned");
        setNotices((prev) =>
          prev.map((n) => (n.id === id ? { ...n, pinned: newPinned } : n))
        );
        if (selectedNotice && selectedNotice.id === id) {
          setSelectedNotice((prev) => (prev ? { ...prev, pinned: newPinned } : null));
        }
      }
    } catch {
      toast.error("Failed to update notice pin status");
    }
  };

  const handleTogglePublic = async (notice: NoticeItem) => {
    try {
      const token = localStorage.getItem("cms_token");
      const nextPublicState = !notice.isPublic;
      const res = await fetch(`/api/v1/ops/notices/${notice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isPublic: nextPublicState }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          nextPublicState
            ? "Notice is now visible on public landing page"
            : "Notice hidden from public page (internal only)"
        );
        setNotices((prev) =>
          prev.map((n) => (n.id === notice.id ? { ...n, isPublic: nextPublicState } : n))
        );
        if (selectedNotice && selectedNotice.id === notice.id) {
          setSelectedNotice((prev) => (prev ? { ...prev, isPublic: nextPublicState } : null));
        }
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update notice visibility");
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
        if (selectedNotice && selectedNotice.id === id) {
          setSelectedNotice(null);
        }
      }
    } catch {
      toast.error("Failed to delete notice");
    }
  };

  // Filtered Notices
  const filteredNotices = notices.filter((n) => {
    if (isBranchAdmin && n.branch && n.branch.id !== userBranchId) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.batch?.name && n.batch.name.toLowerCase().includes(q)) ||
      (n.branch?.name && n.branch.name.toLowerCase().includes(q));

    let matchesScope = true;
    if (scopeFilter === "PUBLIC") matchesScope = n.isPublic;
    if (scopeFilter === "INTERNAL") matchesScope = !n.isPublic;
    if (scopeFilter === "PINNED") matchesScope = n.pinned;

    let matchesBatch = true;
    if (batchFilter !== "ALL") {
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
            <Bell className="w-3.5 h-3.5" /> Notice Board & Circulars
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight mt-0.5">
            Notice Board & Circulars
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Broadcast and manage announcements across campuses, batches, and public website.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs shrink-0 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Publish Notice
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">Audience:</span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
            >
              <option value="ALL">All Audiences</option>
              <option value="PUBLIC">Public Landing Page</option>
              <option value="INTERNAL">Internal Batches & Campuses</option>
              <option value="PINNED">Pinned Notices Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">Batch:</span>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary font-medium"
            >
              <option value="ALL">All Batches</option>
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
      </div>

      {/* Unified Notices Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-surface border border-accent rounded-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading circulars & notices...
          </div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No notices found</p>
          <p className="text-xs text-text-muted mt-1">
            Publish a notice to notify students about exams, classes, or public updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.map((n) => (
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
                      {n.batch?.name || n.course?.name || n.branch?.name || "General"}
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
                    Target: {n.batch ? `Batch: ${n.batch.name}` : n.course ? `Course: ${n.course.name}` : n.branch ? `Campus: ${n.branch.name}` : n.isPublic ? "Public Website & All Students" : "All Enrolled Students"}
                  </p>
                </div>

                <p className="text-xs text-text-muted line-clamp-3 leading-relaxed mt-2">
                  {n.content}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-accent flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-muted truncate max-w-[120px]">
                  By {n.author?.fullName || "Faculty Administration"}
                </span>

                <div className="flex items-center gap-1.5">
                  {n.attachmentUrl && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary mr-1">
                      <Paperclip className="w-3 h-3" />
                    </span>
                  )}

                  {/* Quick Toggle Public Visibility */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePublic(n);
                    }}
                    title={n.isPublic ? "Public on website (Click to make internal only)" : "Internal only (Click to show on public website)"}
                    className={`p-1.5 rounded-sm border transition-colors ${
                      n.isPublic
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-surface text-text-muted border-accent hover:text-text-main hover:bg-bg-app"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Toggle Pin */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(n.id);
                    }}
                    title={n.pinned ? "Unpin notice" : "Pin notice to top"}
                    className={`p-1.5 rounded-sm border transition-colors ${
                      n.pinned
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-surface text-text-muted border-accent hover:text-text-main hover:bg-bg-app"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(n);
                    }}
                    title="Edit notice details"
                    className="p-1.5 rounded-sm border border-accent text-text-muted hover:text-brand-primary hover:bg-bg-app transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id, n.title);
                    }}
                    title="Delete notice"
                    className="p-1.5 rounded-sm border border-accent text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                    {selectedNotice.batch ? selectedNotice.batch.name : selectedNotice.course ? selectedNotice.course.name : selectedNotice.branch ? selectedNotice.branch.name : "Universal"}
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
              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Click Toggle Public Button */}
                <button
                  onClick={() => handleTogglePublic(selectedNotice)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm border flex items-center gap-1.5 transition-colors ${
                    selectedNotice.isPublic
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-surface text-text-main border-accent hover:bg-bg-app"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {selectedNotice.isPublic ? "Public (Click to Hide)" : "Internal (Click to Make Public)"}
                </button>

                {/* 1-Click Toggle Pin Button */}
                <button
                  onClick={() => handleTogglePin(selectedNotice.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm border flex items-center gap-1.5 transition-colors ${
                    selectedNotice.pinned
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-surface text-text-main border-accent hover:bg-bg-app"
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  {selectedNotice.pinned ? "Pinned to Top" : "Pin Notice"}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    handleOpenEdit(selectedNotice);
                  }}
                  className="px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(selectedNotice.id, selectedNotice.title)}
                  className="px-3 py-1.5 bg-surface border border-red-500/30 text-red-500 text-xs font-semibold rounded-sm hover:bg-red-500/10 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
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

      {/* Publish / Edit Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-accent pb-3 flex justify-between items-center bg-surface">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-primary" />
                  {editingId ? "Edit Notice Announcement" : "Publish Notice Announcement"}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {editingId ? "Update announcement content, target audience, or public visibility." : "Broadcast updates across the coaching website or specific student batches."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3.5 text-xs">
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
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:opacity-90 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingId ? (
                    "Update Notice"
                  ) : (
                    "Publish Notice"
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
