import React, { useState } from "react";
import { Plus, X, Layers } from "lucide-react";
import { formatCurrency } from "../../../lib/formatters.js";

export interface FeeStructureItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  branch?: { name: string } | null;
  course?: { name: string } | null;
  batch?: { name: string } | null;
}

interface FeeStructuresTabProps {
  structures: FeeStructureItem[];
  loading: boolean;
  onAddStructure: (form: { name: string; amount: number; frequency?: string }) => Promise<boolean>;
}

export const FeeStructuresTab: React.FC<FeeStructuresTabProps> = ({
  structures,
  loading,
  onAddStructure,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [structureForm, setStructureForm] = useState({
    name: "",
    amount: 6000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onAddStructure(structureForm);
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      setStructureForm({ name: "", amount: 6000 });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-text-muted">
          Standard fee rates for courses, batches, and admission terms.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Fee Structure
        </button>
      </div>

      {loading ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center text-xs text-text-muted">
          Loading fee structures...
        </div>
      ) : structures.length === 0 ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center text-xs text-text-muted space-y-2">
          <Layers className="w-8 h-8 text-text-muted mx-auto" />
          <p>No fee structures configured yet. Click &quot;Add Fee Structure&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {structures.map((s) => (
            <div
              key={s.id}
              className="bg-surface border border-accent rounded-sm p-4 space-y-2 shadow-xs hover:border-brand-primary/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-text-main">{s.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-accent-subtle text-text-muted rounded-xs uppercase">
                  {s.frequency}
                </span>
              </div>
              <p className="text-2xl font-black text-brand-primary">
                {formatCurrency(s.amount)}
              </p>
              <p className="text-xs text-text-muted">
                {s.batch?.name || s.course?.name || "Universal Standard Fee"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-accent pb-2">
              <h3 className="font-bold text-sm text-text-main">Add Fee Structure</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-text-main">Fee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Admission & Kit Fee"
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-text-main">Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={structureForm.amount}
                  onChange={(e) =>
                    setStructureForm({ ...structureForm, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm font-mono font-bold text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-accent">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-accent rounded-sm text-text-muted hover:bg-bg-app transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-brand-primary text-white rounded-sm font-semibold hover:bg-brand-hover shadow-xs transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
