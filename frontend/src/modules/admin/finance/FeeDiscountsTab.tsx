import React, { useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import { DiscountType } from "../../../types/index.js";

export interface DiscountItem {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  batch?: { name: string } | null;
  student?: { rollNumber: string; user: { fullName: string } } | null;
}

interface FeeDiscountsTabProps {
  discounts: DiscountItem[];
  batches: Array<{ id: string; name: string }>;
  loading: boolean;
  onAddDiscount: (form: {
    name: string;
    type: DiscountType;
    value: number;
    batchId?: string;
  }) => Promise<boolean>;
}

export const FeeDiscountsTab: React.FC<FeeDiscountsTabProps> = ({
  discounts,
  batches,
  loading,
  onAddDiscount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    name: "",
    type: DiscountType.PERCENTAGE,
    value: 10,
    batchId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onAddDiscount(discountForm);
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      setDiscountForm({
        name: "",
        type: DiscountType.PERCENTAGE,
        value: 10,
        batchId: "",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-text-muted">
          Merit scholarships, early-bird incentives, and special quota fee waivers.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Waiver Rule
        </button>
      </div>

      {loading ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center text-xs text-text-muted">
          Loading fee waivers & discounts...
        </div>
      ) : discounts.length === 0 ? (
        <div className="bg-surface border border-accent rounded-sm p-12 text-center text-xs text-text-muted space-y-2">
          <Tag className="w-8 h-8 text-text-muted mx-auto" />
          <p>No fee discounts configured yet. Click &quot;Add Waiver Rule&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {discounts.map((d) => (
            <div
              key={d.id}
              className="bg-surface border border-accent rounded-sm p-4 space-y-2 shadow-xs hover:border-brand-primary/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-text-main">{d.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 rounded-xs">
                  {d.type === DiscountType.PERCENTAGE ? `${d.value}% OFF` : `৳${d.value} FLAT`}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Applicable for: {d.batch?.name || "All Batches"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-accent rounded-sm max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-accent pb-2">
              <h3 className="font-bold text-sm text-text-main">Add Discount / Waiver</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-text-main">Discount Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Merit Scholarship 25%"
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-text-main">Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        type: e.target.value as DiscountType,
                      })
                    }
                    className="w-full px-2 py-2 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                  >
                    <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                    <option value={DiscountType.FLAT_AMOUNT}>Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-text-main">Rate / Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountForm.value}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, value: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-bg-app border border-accent rounded-sm font-mono font-bold text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text-main">Target Batch (Optional)</label>
                <select
                  value={discountForm.batchId}
                  onChange={(e) => setDiscountForm({ ...discountForm, batchId: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-text-main focus:outline-none focus:border-brand-primary"
                >
                  <option value="">Universal / All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
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
                  {isSubmitting ? "Saving..." : "Save Waiver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
