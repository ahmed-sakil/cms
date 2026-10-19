import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Trash2, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { BatchRecordItem } from "./BatchesListTab.js";

export interface RosterStudent {
  enrollmentId: string;
  studentId: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string;
  guardianName?: string;
  guardianPhone?: string;
  status: string;
  enrolledAt: string;
}

interface BatchRosterDrawerProps {
  isOpen: boolean;
  batch: BatchRecordItem | null;
  onClose: () => void;
  onRosterChanged?: () => void;
}

export const BatchRosterDrawer: React.FC<BatchRosterDrawerProps> = ({
  isOpen,
  batch,
  onClose,
  onRosterChanged,
}) => {
  const [rosterList, setRosterList] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollRollNumber, setEnrollRollNumber] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const loadRoster = useCallback(async () => {
    if (!batch) return;
    setLoading(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batch.id}/roster`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRosterList(json.data);
      }
    } catch {
      console.warn("Could not load full roster");
    } finally {
      setLoading(false);
    }
  }, [batch, getHeaders]);

  useEffect(() => {
    if (isOpen && batch) {
      setEnrollRollNumber("");
      loadRoster();
    } else {
      setRosterList([]);
    }
  }, [isOpen, batch, loadRoster]);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollRollNumber.trim() || !batch) {
      toast.error("Please enter a student roll number or ID");
      return;
    }

    setIsEnrolling(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batch.id}/enroll`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rollNumber: enrollRollNumber.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Enrollment failed");
      }

      toast.success("Student enrolled directly into batch");
      setEnrollRollNumber("");
      await loadRoster();
      onRosterChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll student");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!batch) return;
    if (!window.confirm("Drop this student from the batch?")) return;

    setRemovingId(studentId);
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batch.id}/enroll/${studentId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove enrollment");
      }

      toast.info("Student enrollment removed from batch");
      setRosterList((prev) => prev.filter((r) => r.studentId !== studentId));
      onRosterChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove enrollment");
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-surface border border-accent rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start border-b border-accent pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-primary" />
                <h3 className="font-bold text-sm text-text-main">
                  {batch.title || batch.name}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-bg-app border border-accent text-brand-primary rounded-xs">
                  {batch.classroom || "No Room Assigned"}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {batch.branch.name} • Enrolled: {rosterList.length} /{" "}
                {batch.seatLimit || batch.maxCapacity} Seats
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-main p-1 rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Enroll Bar */}
          <form onSubmit={handleEnrollStudent} className="pt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                required
                placeholder="Enter Student Roll Number (e.g. 2026-DH-0101) to enroll directly..."
                value={enrollRollNumber}
                onChange={(e) => setEnrollRollNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isEnrolling}
              className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 whitespace-nowrap shadow-xs"
            >
              {isEnrolling ? "Enrolling..." : "+ Enroll Student"}
            </button>
          </form>

          {/* Roster Table */}
          <div className="mt-4 border border-accent rounded-sm overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider sticky top-0 font-semibold">
                <tr>
                  <th className="py-2 px-3">Roll Number</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3">Guardian Contact</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-text-muted">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                        Loading batch roster...
                      </div>
                    </td>
                  </tr>
                ) : rosterList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-text-muted">
                      No students enrolled in this batch yet. Use the roll number input above to enroll.
                    </td>
                  </tr>
                ) : (
                  rosterList.map((st) => (
                    <tr key={st.enrollmentId} className="hover:bg-accent-subtle/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-primary">
                        {st.rollNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-text-main">{st.fullName}</td>
                      <td className="py-2.5 px-3 font-mono text-text-muted">{st.phone}</td>
                      <td className="py-2.5 px-3 text-text-muted font-mono">
                        {st.guardianPhone || "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(st.studentId)}
                          disabled={removingId === st.studentId}
                          className="p-1 text-text-muted hover:text-red-500 rounded-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Drop Student from Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-accent pt-3 flex justify-between items-center text-xs text-text-muted">
          <span>Roster updates reflect in student schedules immediately.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-accent text-xs font-semibold rounded-sm hover:bg-accent-subtle text-text-main"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
