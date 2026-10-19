import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Search,
  Building2,
  Calendar,
  FileText,
  Clock,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { formatCurrency, formatNumber } from "../../lib/formatters.js";
import { FileUpload } from "../../components/common/FileUpload.js";
import type { BranchRecord } from "../../types/index.js";

interface CourseRecord {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  durationWeeks: number;
  feeAmount: number | string;
  coverImage?: string | null;
  isPublic: boolean;
  isPublished: boolean;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    batches: number;
    studyMaterials: number;
  };
  createdAt: string;
}

export const CoursesManagement: React.FC = () => {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const [selectedBranch, setSelectedBranch] = useState<string>(
    isBranchAdmin ? userBranchId : "ALL"
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    description: "",
    durationWeeks: 12,
    feeAmount: 6000,
    branchId: isBranchAdmin ? userBranchId : "",
    coverImage: "",
    isPublic: true,
    isPublished: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, branchesRes] = await Promise.all([
        apiClient.get<CourseRecord[]>("/academics/courses"),
        apiClient.get<BranchRecord[]>("/admin/branches"),
      ]);

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data);
      }

      if (branchesRes.success && Array.isArray(branchesRes.data)) {
        setBranches(branchesRes.data);
        if (!isBranchAdmin && !courseForm.branchId && branchesRes.data.length > 0 && branchesRes.data[0]?.id) {
          setCourseForm((prev) => ({ ...prev, branchId: branchesRes.data![0].id }));
        }
      }
    } catch {
      toast.error("Failed to load curriculum catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setCourseForm({
      name: "",
      code: "",
      description: "",
      durationWeeks: 12,
      feeAmount: 6000,
      branchId: isBranchAdmin ? userBranchId : branches[0]?.id || "",
      coverImage: "",
      isPublic: true,
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name.trim() || !courseForm.code.trim()) {
      toast.error("Course name and course code are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: courseForm.name.trim(),
        code: courseForm.code.trim().toUpperCase(),
        description: courseForm.description.trim() || undefined,
        durationWeeks: Number(courseForm.durationWeeks) || 12,
        feeAmount: Number(courseForm.feeAmount) || 0,
        branchId: isBranchAdmin ? userBranchId : courseForm.branchId || undefined,
        coverImage: courseForm.coverImage.trim() || undefined,
        isPublic: courseForm.isPublic,
        isPublished: courseForm.isPublished,
      };

      const res = await apiClient.post<CourseRecord>("/academics/courses", payload);
      if (res.success && res.data) {
        toast.success(`Course '${res.data.name}' published successfully`);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(res.message || "Failed to create course");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while creating course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesBranch = selectedBranch === "ALL" || c.branch?.id === selectedBranch;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBranch && matchesSearch;
  });

  const totalBatches = courses.reduce((acc, c) => acc + (c._count?.batches || 0), 0);
  const totalMaterials = courses.reduce((acc, c) => acc + (c._count?.studyMaterials || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-primary" />
            Curriculum & Courses Management
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Standardized academic curriculums, course syllabi, fee structures, and campus allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh Courses"
            className="p-1.5 bg-surface border border-accent text-text-muted hover:text-text-main rounded-sm hover:bg-accent-subtle transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Course
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Published Courses</span>
            <GraduationCap className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{formatNumber(courses.length)}</p>
          <p className="text-[11px] text-green-600 font-medium">Standardized tracks</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Assigned Batches</span>
            <Calendar className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{formatNumber(totalBatches)}</p>
          <p className="text-[11px] text-brand-primary font-medium">Active cohort schedules</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Study Materials</span>
            <FileText className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{formatNumber(totalMaterials)}</p>
          <p className="text-[11px] text-text-muted">Attached lecture notes & PDFs</p>
        </div>

        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-xs font-medium">Campuses Active</span>
            <Building2 className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-black text-text-main">{formatNumber(branches.length)}</p>
          <p className="text-[11px] text-text-muted">Multi-branch catalog</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface border border-accent rounded-sm p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search by course name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isBranchAdmin && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
              >
                <option value="ALL">All Campuses</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Courses Cards Grid */}
      {loading ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center text-xs text-text-muted">
          Loading course catalog...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center space-y-3 shadow-xs">
          <GraduationCap className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs text-text-muted">
            {searchQuery
              ? `No courses matching "${searchQuery}"`
              : "No courses found in catalog. Click 'Create Course' to add one."}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-surface border border-accent rounded-sm p-4 flex flex-col justify-between shadow-xs hover:border-brand-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-brand-primary px-1.5 py-0.5 bg-brand-primary/10 rounded-sm">
                      {course.code}
                    </span>
                    <h3 className="font-bold text-sm text-text-main mt-1.5 leading-tight">
                      {course.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted px-2 py-0.5 bg-accent-subtle rounded-sm flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-brand-primary" /> {course.branch?.name}
                  </span>
                </div>

                {course.description && (
                  <p className="text-xs text-text-muted line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-accent text-xs">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Clock className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{course.durationWeeks} Weeks</span>
                  </div>
                  <div className="text-right font-black text-text-main">
                    {formatCurrency(course.feeAmount)}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-primary" /> {course._count?.batches || 0} Batches
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-brand-primary" /> {course._count?.studyMaterials || 0} Materials
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-accent flex items-center justify-between">
                <Link
                  to={`/admin/batches?courseId=${course.id}`}
                  className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View Cohorts <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-[10px] font-medium text-text-muted">
                  Standard Curriculum
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-accent pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-brand-primary" />
                <h2 className="font-bold text-sm text-text-main">Define New Academic Course</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Course Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Higher Physics & Problem Solving"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSC-PHY-01"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs font-mono uppercase text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Campus / Branch *</label>
                  <select
                    disabled={isBranchAdmin}
                    value={isBranchAdmin ? userBranchId : courseForm.branchId}
                    onChange={(e) => setCourseForm({ ...courseForm, branchId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary disabled:opacity-60"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Duration (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={courseForm.durationWeeks}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, durationWeeks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Base Fee (৳)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={courseForm.feeAmount}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, feeAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Curriculum Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered, target exams, prerequisites, and learning objectives..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <FileUpload
                  label="Cover Banner Image"
                  folder="materials"
                  value={courseForm.coverImage}
                  onChange={(url: string) => setCourseForm({ ...courseForm, coverImage: url })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-accent-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
