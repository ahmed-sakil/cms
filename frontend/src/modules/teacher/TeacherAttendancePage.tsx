import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  CheckCircle2,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { Badge } from "../../components/ui/Badge.js";

type AttendanceStatusType = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface StudentAttendanceRow {
  studentId: string;
  rollNumber: string;
  fullName: string;
  avatarUrl?: string | null;
  status: AttendanceStatusType;
  remarks: string;
  isMarked: boolean;
}

export const TeacherAttendancePage: React.FC = () => {
  const [batches, setBatches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roster, setRoster] = useState<StudentAttendanceRow[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Load batches first
  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true);
        const res = await apiClient.get<any[]>("/teacher/batches");
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBatches(res.data);
          setSelectedBatchId(res.data[0].id);
        }
      } catch {
        toast.error("Failed to load assigned batches");
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, []);

  // Fetch attendance when batch or date changes
  useEffect(() => {
    if (!selectedBatchId) return;

    const fetchAttendance = async () => {
      try {
        setLoadingRoster(true);
        const res = await apiClient.get<any>(
          `/teacher/batches/${selectedBatchId}/attendance?date=${selectedDate}`
        );
        if (res.success && res.data) {
          setIsCompleted(!!res.data.isCompleted);
          const mapped: StudentAttendanceRow[] = (res.data.roster || []).map((r: any) => ({
            studentId: r.studentId,
            rollNumber: r.rollNumber || "N/A",
            fullName: r.fullName || "Student",
            avatarUrl: r.avatarUrl,
            status: r.status || "PRESENT",
            remarks: r.remarks || "",
            isMarked: !!r.isMarked,
          }));
          setRoster(mapped);
        }
      } catch {
        toast.error("Failed to load attendance records for selected date");
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchAttendance();
  }, [selectedBatchId, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setRoster((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, status } : row))
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, remarks } : row))
    );
  };

  const handleMarkAll = (status: AttendanceStatusType) => {
    setRoster((prev) => prev.map((row) => ({ ...row, status })));
    toast.info(`Marked all students as ${status}`);
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatchId || roster.length === 0) return;

    try {
      setSaving(true);
      const payload = {
        date: selectedDate,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks.trim() || undefined,
        })),
      };

      const res = await apiClient.post<any>(
        `/teacher/batches/${selectedBatchId}/attendance`,
        payload
      );

      if (res.success) {
        toast.success(
          `Attendance saved for ${res.data.recordedCount || roster.length} students`
        );
        setIsCompleted(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === "PRESENT").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const lateCount = roster.filter((r) => r.status === "LATE").length;
  const excusedCount = roster.filter((r) => r.status === "EXCUSED").length;
  const attendanceRate =
    roster.length > 0 ? Math.round(((presentCount + lateCount) / roster.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-accent rounded-sm p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Classroom Attendance Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-0.5">
            Daily Student Attendance
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Select an assigned batch and date to record or update attendance entries and excuse logs.
          </p>
        </div>

        {/* Batch & Date Picker Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={loadingBatches || batches.length === 0}
              className="w-full sm:w-56 p-2 bg-bg-app border border-accent rounded-sm text-xs font-bold text-text-main focus:outline-none focus:border-brand-primary"
            >
              {batches.length === 0 ? (
                <option value="">No Assigned Batches</option>
              ) : (
                batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 bg-bg-app border border-accent rounded-sm text-xs font-semibold text-text-main focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Metrics & Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-text-muted">Total Enrolled</p>
          <p className="text-xl font-black text-text-main mt-0.5 font-mono">{roster.length}</p>
        </div>
        <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-status-success">Present</p>
          <p className="text-xl font-black text-status-success mt-0.5 font-mono">{presentCount}</p>
        </div>
        <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-status-danger">Absent</p>
          <p className="text-xl font-black text-status-danger mt-0.5 font-mono">{absentCount}</p>
        </div>
        <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-status-warning">Late / Excused</p>
          <p className="text-xl font-black text-status-warning mt-0.5 font-mono">{lateCount + excusedCount}</p>
        </div>
        <div className="bg-surface border border-accent rounded-sm p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-brand-primary">Attendance Rate</p>
          <p className="text-xl font-black text-brand-primary mt-0.5 font-mono">{attendanceRate}%</p>
        </div>
      </div>

      {/* Roster Container */}
      <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
        {/* Sub-Header Actions */}
        <div className="p-4 border-b border-accent bg-bg-app flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-main">
              Roster Marking: <span className="font-mono">{selectedDate}</span>
            </span>
            {isCompleted && (
              <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                Already Recorded
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleMarkAll("PRESENT")}
              disabled={loadingRoster || roster.length === 0}
              className="px-2.5 py-1 bg-surface hover:bg-bg-app border border-accent text-xs font-bold text-status-success rounded-sm transition-colors cursor-pointer"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              disabled={loadingRoster || roster.length === 0}
              className="px-2.5 py-1 bg-surface hover:bg-bg-app border border-accent text-xs font-bold text-status-danger rounded-sm transition-colors cursor-pointer"
            >
              All Absent
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || loadingRoster || roster.length === 0}
              className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50 ml-auto cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Attendance
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loadingRoster ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-primary mb-2" />
            Loading cohort students for attendance...
          </div>
        ) : roster.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            <Users className="w-8 h-8 mx-auto text-text-muted opacity-40 mb-2" />
            No enrolled students in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-app/50 border-b border-accent text-text-muted font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-16">Roll</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 text-center">Status Selection</th>
                  <th className="p-3 w-64">Remarks / Excuse Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent">
                {roster.map((row) => (
                  <tr key={row.studentId} className="hover:bg-bg-app/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-text-main">
                      {row.rollNumber}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[10px]">
                          {row.fullName[0] || "S"}
                        </div>
                        <span className="font-semibold text-text-main">{row.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, "PRESENT")}
                          className={`px-3 py-1 rounded-xs text-[11px] font-bold border transition-colors cursor-pointer ${
                            row.status === "PRESENT"
                              ? "bg-status-success text-white border-status-success shadow-xs"
                              : "bg-surface text-text-muted border-accent hover:border-status-success/50"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, "ABSENT")}
                          className={`px-3 py-1 rounded-xs text-[11px] font-bold border transition-colors cursor-pointer ${
                            row.status === "ABSENT"
                              ? "bg-status-danger text-white border-status-danger shadow-xs"
                              : "bg-surface text-text-muted border-accent hover:border-status-danger/50"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, "LATE")}
                          className={`px-3 py-1 rounded-xs text-[11px] font-bold border transition-colors cursor-pointer ${
                            row.status === "LATE"
                              ? "bg-status-warning text-white border-status-warning shadow-xs"
                              : "bg-surface text-text-muted border-accent hover:border-status-warning/50"
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, "EXCUSED")}
                          className={`px-3 py-1 rounded-xs text-[11px] font-bold border transition-colors cursor-pointer ${
                            row.status === "EXCUSED"
                              ? "bg-status-info text-white border-status-info shadow-xs"
                              : "bg-surface text-text-muted border-accent hover:border-status-info/50"
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => handleRemarksChange(row.studentId, e.target.value)}
                        placeholder="Optional remarks..."
                        className="w-full p-1.5 bg-bg-app border border-accent rounded-xs text-xs text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Submit Strip */}
        <div className="p-4 border-t border-accent bg-bg-app flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Records are synced instantly with student portals and parent alerts.
          </p>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loadingRoster || roster.length === 0}
            className="px-5 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
