import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Calendar,
  Paperclip,
  X,
  Bookmark,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface NoticeRecord {
  id: string;
  title: string;
  content: string;
  priority?: string;
  pinned: boolean;
  publishedAt: string;
  attachmentUrl?: string | null;
  batch?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  author?: { fullName: string } | null;
}

export const StudentNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "BATCH" | "CAMPUS">("ALL");
  const [selectedNotice, setSelectedNotice] = useState<NoticeRecord | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("cms_token");
        const res = await fetch("/api/v1/students/notices", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotices(json.data);
        } else {
          setNotices([]);
        }
      } catch {
        toast.error("Failed to load campus notices");
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const filtered = notices.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.batch?.name && n.batch.name.toLowerCase().includes(q)) ||
      (n.course?.name && n.course.name.toLowerCase().includes(q));

    let matchesScope = true;
    if (scopeFilter === "BATCH") matchesScope = !!n.batch;
    if (scopeFilter === "CAMPUS") matchesScope = !n.batch;

    return matchesSearch && matchesScope;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" /> Campus Notices
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-text-main mt-0.5">
            Notices & Circulars
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Stay informed with routine updates, exam circulars, and teacher notices.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Scope Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-text-muted shrink-0">Filter:</span>
        {[
          { id: "ALL", label: "All Circulars" },
          { id: "BATCH", label: "My Batch Circulars" },
          { id: "CAMPUS", label: "Campus & General" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setScopeFilter(tab.id as "ALL" | "BATCH" | "CAMPUS")}
            className={`px-3 py-1 text-xs font-bold rounded-sm border whitespace-nowrap transition-colors ${
              scopeFilter === tab.id
                ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                : "bg-surface text-text-muted border-accent hover:text-text-main"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading circulars...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No circulars posted</p>
          <p className="text-xs text-text-muted mt-1">
            You are fully up to date! Any upcoming notices or routine alterations will show here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedNotice(item)}
              className={`bg-surface border rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/40 cursor-pointer transition-colors ${
                item.pinned ? "border-brand-primary/50 bg-brand-primary/[0.02]" : "border-accent"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {item.pinned && (
                      <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                        <Bookmark className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted">
                      {item.batch ? item.batch.name : item.course ? item.course.name : item.branch ? item.branch.name : "General"}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-main leading-snug">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {item.batch ? `Cohort: ${item.batch.name}` : item.course ? `Course: ${item.course.name}` : item.branch ? `Branch: ${item.branch.name}` : "General Announcement"}
                  </p>
                </div>

                <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-accent flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-muted">
                  By {item.author?.fullName || "Faculty Administration"}
                </span>
                {item.attachmentUrl && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary">
                    <Paperclip className="w-3 h-3" /> Attachment
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-start justify-between bg-bg-app">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {selectedNotice.pinned && (
                    <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-xs flex items-center gap-1 uppercase tracking-wider">
                      <Bookmark className="w-3 h-3 fill-current" /> Pinned
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider bg-accent-subtle text-text-muted">
                    {selectedNotice.batch ? selectedNotice.batch.name : selectedNotice.course ? selectedNotice.course.name : selectedNotice.branch ? selectedNotice.branch.name : "General Announcement"}
                  </span>
                </div>
                <h2 className="text-base font-bold text-text-main mt-1 leading-snug">
                  {selectedNotice.title}
                </h2>
                <p className="text-[11px] text-text-muted">
                  Published: {new Date(selectedNotice.publishedAt).toLocaleString()}
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
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-brand-primary text-white text-xs font-bold rounded-sm shadow-xs hover:opacity-90"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> Download / View Attachment
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
