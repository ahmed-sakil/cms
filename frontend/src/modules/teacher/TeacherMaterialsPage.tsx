import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Download,
  BookOpen,
  Loader2,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { FileUpload } from "../../components/common/FileUpload.js";

interface StudyMaterialItem {
  id: string;
  title: string;
  description?: string | null;
  classTopic?: string | null;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  batch?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  exam?: { id: string; title: string } | null;
}

export const TeacherMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [exams, setExams] = useState<Array<{ id: string; title: string; batchId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");

  // Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    batchId: "",
    title: "",
    description: "",
    classTopic: "",
    examId: "",
    fileUrl: "",
    fileType: "pdf",
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<StudyMaterialItem[]>("/teacher/materials");
      if (res.success && Array.isArray(res.data)) {
        setMaterials(res.data);
      }
    } catch {
      toast.error("Failed to load study materials");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchesAndExams = async () => {
    try {
      const [batchRes, examRes] = await Promise.all([
        apiClient.get<any[]>("/teacher/batches"),
        apiClient.get<any[]>("/teacher/exams"),
      ]);
      if (batchRes.success && Array.isArray(batchRes.data)) {
        const batchList = batchRes.data;
        setBatches(batchList);
        if (batchList.length > 0 && !form.batchId) {
          setForm((prev) => ({ ...prev, batchId: batchList[0].id }));
        }
      }
      if (examRes.success && Array.isArray(examRes.data)) {
        setExams(examRes.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMaterials();
    fetchBatchesAndExams();
  }, []);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) {
      toast.error("Please select a target batch");
      return;
    }
    if (!form.fileUrl) {
      toast.error("Please provide or upload a document file");
      return;
    }

    try {
      setUploading(true);
      const res = await apiClient.post<any>("/teacher/materials", {
        batchId: form.batchId,
        title: form.title,
        description: form.description || undefined,
        classTopic: form.classTopic || undefined,
        examId: form.examId || undefined,
        fileUrl: form.fileUrl,
        fileType: form.fileType,
      });

      if (res.success) {
        toast.success("Study material uploaded and shared with students!");
        setIsUploadModalOpen(false);
        setForm({
          batchId: batches[0]?.id || "",
          title: "",
          description: "",
          classTopic: "",
          examId: "",
          fileUrl: "",
          fileType: "pdf",
        });
        fetchMaterials();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload study material");
    } finally {
      setUploading(false);
    }
  };

  const filtered = materials.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(q) ||
      (m.classTopic && m.classTopic.toLowerCase().includes(q)) ||
      (m.batch?.name && m.batch.name.toLowerCase().includes(q)) ||
      (m.course?.name && m.course.name.toLowerCase().includes(q));

    const matchesBatch =
      selectedBatchFilter === "ALL" || m.batch?.id === selectedBatchFilter;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Course Materials & Handouts
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Study Materials Repository
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Upload lecture notes, lecture presentations, past exam papers, and supplementary reading for your cohorts.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Upload Material
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search material title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-text-muted font-bold shrink-0">Cohort:</span>
          <select
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="w-full sm:w-56 p-1.5 bg-bg-app border border-accent rounded-sm text-xs font-semibold text-text-main"
          >
            <option value="ALL">All Assigned Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading materials...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-dashed border-accent rounded-sm p-12 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-text-main">No study materials found</p>
          <p className="text-xs text-text-muted mt-1">
            Click "Upload Material" above to publish lecture slides, worksheets, or notes for your students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-accent rounded-sm p-5 shadow-xs flex flex-col justify-between hover:border-brand-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-xs uppercase tracking-wider">
                    {item.fileType || "Document"}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-main leading-tight">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Batch: {item.batch?.name || "All Enrolled"}
                  </p>
                </div>

                {item.classTopic && (
                  <div className="flex items-center gap-1.5 text-xs text-brand-primary font-semibold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Topic: {item.classTopic}</span>
                  </div>
                )}

                {item.exam && (
                  <div className="text-[11px] text-text-muted bg-bg-app border border-accent/60 p-2 rounded-xs">
                    Tagged to Exam: <span className="font-semibold text-text-main">{item.exam.title}</span>
                  </div>
                )}

                {item.description && (
                  <p className="text-xs text-text-muted line-clamp-2">{item.description}</p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-accent flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  Shared with students
                </span>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1 px-3 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> View / Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-accent rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-accent flex items-center justify-between bg-bg-app">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                <h2 className="text-sm sm:text-base font-bold text-text-main">Upload Study Material</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-sm text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Target Cohort / Batch *</label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-semibold"
                >
                  <option value="" disabled>Select cohort...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Material Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Lecture Slides & Practice Sheet"
                  required
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Class Topic / Module</label>
                  <input
                    type="text"
                    value={form.classTopic}
                    onChange={(e) => setForm({ ...form, classTopic: e.target.value })}
                    placeholder="e.g. Vectors & Kinetics"
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-main block mb-1">Format Type</label>
                  <select
                    value={form.fileType}
                    onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                    className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word Document</option>
                    <option value="slides">Presentation Slides</option>
                    <option value="image">Image / Diagram</option>
                    <option value="video">Recorded Video Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Link with Exam (Optional)</label>
                <select
                  value={form.examId}
                  onChange={(e) => setForm({ ...form, examId: e.target.value })}
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                >
                  <option value="">None (General Lecture Material)</option>
                  {exams
                    .filter((ex) => !form.batchId || ex.batchId === form.batchId)
                    .map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Document File *</label>
                <FileUpload
                  folder="materials"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  onChange={(url: string) => setForm((prev) => ({ ...prev, fileUrl: url }))}
                  value={form.fileUrl}
                  isImage={false}
                />
                {form.fileUrl && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ File uploaded successfully: {form.fileUrl.split("/").pop()}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summary notes or study instructions for students..."
                  className="w-full p-2 bg-bg-app border border-accent rounded-sm text-xs text-text-main"
                />
              </div>

              <div className="pt-3 border-t border-accent flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
