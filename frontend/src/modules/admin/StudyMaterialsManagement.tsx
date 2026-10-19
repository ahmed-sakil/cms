import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Download,
  BookOpen,
  Calendar,
  Layers,
  Filter,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../components/common/FileUpload.js";

interface StudyMaterialItem {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  isPublic: boolean;
  createdAt: string;
  course?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
  uploader?: { fullName: string; role: string } | null;
}

interface CourseItem {
  id: string;
  name: string;
}

interface BatchItem {
  id: string;
  name: string;
}

interface BranchItem {
  id: string;
  name: string;
}

export const StudyMaterialsManagement: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileType: "PDF",
    courseId: "",
    batchId: "",
    branchId: "",
    isPublic: false,
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/academics/materials", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMaterials(json.data);
      }
    } catch {
      toast.error("Failed to load study materials");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem("cms_token");
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [cRes, bRes, brRes] = await Promise.all([
        fetch("/api/v1/academics/courses", { headers }),
        fetch("/api/v1/academics/batches", { headers }),
        fetch("/api/v1/admin/branches", { headers }),
      ]);

      const [cJson, bJson, brJson] = await Promise.all([
        cRes.json(),
        bRes.json(),
        brRes.json(),
      ]);

      if (cJson.success && Array.isArray(cJson.data)) setCourses(cJson.data);
      if (bJson.success && Array.isArray(bJson.data)) setBatches(bJson.data);
      if (brJson.success && Array.isArray(brJson.data)) setBranches(brJson.data);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchFilters();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.fileUrl.trim()) {
      toast.error("File upload or file URL is required");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("cms_token");
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        fileUrl: formData.fileUrl,
        fileType: formData.fileType || "PDF",
        courseId: formData.courseId ? formData.courseId : undefined,
        batchId: formData.batchId ? formData.batchId : undefined,
        branchId: formData.branchId ? formData.branchId : undefined,
        isPublic: formData.isPublic,
      };

      const res = await fetch("/api/v1/academics/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to publish study material");
      }

      toast.success("Study material published to students successfully!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        fileUrl: "",
        fileType: "PDF",
        courseId: "",
        batchId: "",
        branchId: "",
        isPublic: false,
      });
      fetchMaterials();
    } catch (err: any) {
      toast.error(err.message || "Error publishing study material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch(`/api/v1/academics/materials/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete");
      }
      toast.success("Study material deleted");
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Error deleting material");
    }
  };

  // Filtered List
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.course?.name && m.course.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourse = selectedCourse === "ALL" || m.course?.id === selectedCourse;
    const matchesBatch = selectedBatch === "ALL" || m.batch?.id === selectedBatch;

    return matchesSearch && matchesCourse && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-primary" /> Study Materials & Lecture Notes
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Upload syllabi, lecture slides, worksheets, and exam prep resources for students.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Upload New Material
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Total Resources</span>
            <Layers className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{materials.length}</p>
          <p className="text-[11px] text-text-muted">Published notes and guides</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">PDF Documents</span>
            <FileText className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">
            {materials.filter((m) => (m.fileType || "").toUpperCase().includes("PDF")).length}
          </p>
          <p className="text-[11px] text-text-muted">Lecture sheets & handouts</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Public Handouts</span>
            <Globe className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-text-main">
            {materials.filter((m) => m.isPublic).length}
          </p>
          <p className="text-[11px] text-green-600 font-medium">Available across all batches</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Active Courses Covered</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{courses.length}</p>
          <p className="text-[11px] text-text-muted">Academic curriculum links</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-accent rounded-sm p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search material title or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Filter className="w-3.5 h-3.5 text-brand-primary" /> Course:
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
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

      {/* Materials List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface border border-accent rounded-sm">
          Loading study materials repository...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-accent rounded-sm space-y-3">
          <FileText className="w-10 h-10 text-text-muted mx-auto stroke-1" />
          <p className="text-sm font-semibold text-text-main">No study materials found</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Upload lecture notes, formulas, sample exam papers, and presentation slides for your coaching batches.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover"
          >
            Upload First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-accent rounded-sm p-4 flex flex-col justify-between shadow-xs hover:border-brand-primary/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-xs uppercase tracking-wider">
                    {item.fileType || "PDF"}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.isPublic ? (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 rounded-xs font-medium">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-accent-subtle text-text-muted rounded-xs font-medium">
                        <Lock className="w-3 h-3" /> Batch Only
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-text-main line-clamp-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-accent space-y-1 text-xs text-text-muted">
                  {item.course && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="font-medium text-text-main truncate">{item.course.name}</span>
                    </div>
                  )}
                  {item.batch && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">{item.batch.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-accent flex items-center justify-between">
                <div className="text-[10px] text-text-muted font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-accent-subtle hover:bg-brand-primary hover:text-white border border-accent rounded-sm transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-sm transition-colors"
                    title="Delete resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-accent pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-primary" /> Upload Study Material
                </h3>
                <p className="text-xs text-text-muted">
                  Share notes and documents directly to your students' dashboard.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-text-main mb-1">
                  Document / Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Math Vector Geometry Lecture Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-main mb-1">
                  Description / Topic Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chapters 3 and 4 formulas, theorem proofs, and homework practice sheet."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-main mb-1">Associated Course</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">General (All Courses)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text-main mb-1">Target Batch</label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">All Batches</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-main mb-1">Target Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">All Campuses</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text-main mb-1">Document Format</label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  >
                    <option value="PDF">PDF Handout</option>
                    <option value="SLIDES">Presentation Slides</option>
                    <option value="WORKSHEET">Practice Worksheet</option>
                    <option value="DOCUMENT">Word Document</option>
                    <option value="OTHER">Other Resource</option>
                  </select>
                </div>
              </div>

              {/* Upload Component */}
              <div className="space-y-1.5 pt-1">
                <FileUpload
                  label="Attach File / Document (PDF, DOCX, ZIP)"
                  folder="materials"
                  isImage={false}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                  value={formData.fileUrl}
                  onChange={(url) => setFormData({ ...formData, fileUrl: url })}
                  helperText="Uploads directly to Supabase Storage cms-assets bucket."
                />
              </div>

              {/* Or manual URL fallback */}
              <div>
                <label className="block font-medium text-text-muted mb-1 text-[11px]">
                  Or direct Google Drive / External Resource Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary font-mono text-[11px]"
                />
              </div>

              {/* Is Public Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-brand-primary rounded-xs"
                  />
                  <span className="font-semibold text-text-main">
                    Make visible across entire student body (Public)
                  </span>
                </label>
                <p className="text-[11px] text-text-muted pl-6">
                  If unchecked, only students enrolled in the assigned course/batch can view and download this file.
                </p>
              </div>

              <div className="pt-3 border-t border-accent flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
