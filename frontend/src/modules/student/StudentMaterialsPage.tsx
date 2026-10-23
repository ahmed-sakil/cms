import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Download,
  BookOpen,
  Calendar,
  Layers,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface StudentMaterial {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  course?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  uploader?: { fullName: string; role: string } | null;
}

export const StudentMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("cms_token");
        const res = await fetch("/api/v1/student/materials", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMaterials(json.data);
        } else {
          setMaterials([]);
        }
      } catch {
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.course?.name && m.course.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      typeFilter === "ALL" || (m.fileType || "").toUpperCase() === typeFilter.toUpperCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Academic Resource Hub
          </span>
          <h1 className="text-xl font-bold text-text-main mt-0.5">Study Materials & Notes</h1>
          <p className="text-xs text-text-muted mt-1">
            Access official lecture notes, formulas, slides, and practice worksheets uploaded by your instructors.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-primary" /> {loading ? "..." : `${materials.length} Resources Available`}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-surface border border-accent rounded-sm p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search topics, courses, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-text-muted">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Formats</option>
            <option value="PDF">PDF Handouts</option>
            <option value="SLIDES">Lecture Slides</option>
            <option value="WORKSHEET">Worksheets</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-12 bg-accent rounded-xs" />
                <div className="h-3 w-16 bg-accent rounded-xs" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-4/5 bg-accent rounded-xs" />
                <div className="h-3 w-full bg-accent/60 rounded-xs" />
              </div>
              <div className="pt-2 border-t border-accent flex justify-between items-center">
                <div className="h-3 w-20 bg-accent rounded-xs" />
                <div className="h-6 w-16 bg-accent rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-accent rounded-sm space-y-2">
          <FileText className="w-10 h-10 text-text-muted mx-auto stroke-1" />
          <p className="text-sm font-semibold text-text-main">No study materials found</p>
          <p className="text-xs text-text-muted">
            Check back later as your teachers upload lecture sheets and handouts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-accent rounded-sm p-5 flex flex-col justify-between shadow-xs hover:border-brand-primary/50 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase tracking-wider">
                    {item.fileType || "PDF"}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-text-main line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-text-muted line-clamp-3 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-accent space-y-1 text-xs text-text-muted">
                  {item.course && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="font-semibold text-text-main truncate">
                        {item.course.name}
                      </span>
                    </div>
                  )}
                  {item.batch && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{item.batch.name}</span>
                    </div>
                  )}
                  {item.uploader && (
                    <div className="text-[11px] text-text-muted">
                      Uploaded by: <span className="font-medium text-text-main">{item.uploader.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-accent flex items-center justify-between gap-2">
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover rounded-sm transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Note
                </a>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 border border-accent hover:bg-bg-app rounded-sm text-text-muted hover:text-text-main transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
