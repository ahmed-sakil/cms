import React, { useState } from "react";
import { Plus, Trash2, Layers, X } from "lucide-react";
import { ClassCategory, type AcademicClassRecord } from "../../../types/index.js";

interface AcademicClassesTabProps {
  academicClasses: AcademicClassRecord[];
  loading: boolean;
  onSaveClass: (form: {
    name: string;
    code: string;
    academicYear: string;
    category: ClassCategory;
    displayOrder: number;
  }) => Promise<boolean>;
  onDeleteClass: (classId: string) => Promise<boolean>;
}

export const AcademicClassesTab: React.FC<AcademicClassesTabProps> = ({
  academicClasses,
  loading,
  onSaveClass,
  onDeleteClass,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    academicYear: new Date().getFullYear().toString(),
    category: ClassCategory.COLLEGE,
    displayOrder: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    setIsSaving(true);
    const success = await onSaveClass(form);
    setIsSaving(false);

    if (success) {
      setIsModalOpen(false);
      setForm({
        name: "",
        code: "",
        academicYear: new Date().getFullYear().toString(),
        category: ClassCategory.COLLEGE,
        displayOrder: 1,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this academic class? Existing batches under it will lose their category tag.")) {
      return;
    }
    setDeletingId(id);
    await onDeleteClass(id);
    setDeletingId(null);
  };

  const getCategoryBadgeClass = (category: ClassCategory) => {
    switch (category) {
      case ClassCategory.COLLEGE:
        return "bg-brand-primary text-white";
      case ClassCategory.ADMISSION:
        return "bg-blue-600 text-white";
      case ClassCategory.SCHOOL:
        return "bg-emerald-600 text-white";
      case ClassCategory.PROFESSIONAL:
        return "bg-purple-600 text-white";
      default:
        return "bg-surface border border-accent text-text-main";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:row justify-between items-start sm:items-center gap-3 bg-surface border border-accent p-4 rounded-sm shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-primary" /> Academic Classes & Levels
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Define academic standards (e.g., Class 1-10, HSC 1st/2nd Year 2026, Admission: BUET, Medical, DU) to categorize offline batches.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs flex items-center gap-1.5 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add Academic Class
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-text-muted">Loading academic classes...</div>
      ) : academicClasses.length === 0 ? (
        <div className="py-12 text-center text-xs text-text-muted bg-surface border border-accent rounded-sm">
          No academic classes defined yet. Click &quot;Add Academic Class&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academicClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-surface border border-accent p-4 rounded-sm space-y-3 flex flex-col justify-between shadow-xs hover:border-brand-primary/40 transition-colors"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${getCategoryBadgeClass(
                      cls.category
                    )}`}
                  >
                    {cls.category}
                  </span>
                  <span className="font-mono text-xs text-text-muted">{cls.code}</span>
                </div>
                <h4 className="font-bold text-sm text-text-main mt-2">{cls.name}</h4>
                <p className="text-xs text-text-muted">Academic Year: {cls.academicYear}</p>
              </div>

              <div className="pt-3 border-t border-accent flex justify-between items-center text-xs">
                <span className="text-text-muted font-medium">
                  {cls.batchesCount !== undefined ? `${cls.batchesCount} Batches Scheduled` : "Active Class"}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(cls.id)}
                  disabled={deletingId === cls.id}
                  className="p-1.5 text-text-muted hover:text-red-500 rounded-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Delete Class"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-accent pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-primary" /> Define Academic Class / Level
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main p-1 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Class / Standard Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC 2nd Year 2026 or BUET Engineering Admission"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Class Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSC-2026"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2026"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Category Tier</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ClassCategory })}
                  className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                >
                  <option value={ClassCategory.COLLEGE}>College / Intermediate (HSC)</option>
                  <option value={ClassCategory.ADMISSION}>University &amp; Medical Admission</option>
                  <option value={ClassCategory.SCHOOL}>School / Secondary (Class 1-10)</option>
                  <option value={ClassCategory.PROFESSIONAL}>Professional &amp; Skills</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-accent text-xs font-semibold rounded-sm hover:bg-accent-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Academic Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
