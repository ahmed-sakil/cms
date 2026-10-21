import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Trash2, Users, RefreshCw, Calendar, CheckSquare, CheckCircle2 } from "lucide-react";
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

type AttendanceStatusType = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceRecordState {
  status: AttendanceStatusType;
  remarks: string;
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
  const [activeTab, setActiveTab] = useState<"roster" | "attendance">("roster");
  const [rosterList, setRosterList] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollRollNumber, setEnrollRollNumber] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecordState>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("cms_token") || localStorage.getItem("token");
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

  const loadAttendanceForDate = useCallback(async (date: string) => {
    if (!batch) return;
    setAttendanceLoading(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batch.id}/attendance?date=${date}`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const initialMap: Record<string, AttendanceRecordState> = {};
        json.data.forEach((att: any) => {
          if (att.studentId) {
            initialMap[att.studentId] = {
              status: (att.status as AttendanceStatusType) || "PRESENT",
              remarks: att.remarks || "",
            };
          }
        });
        setAttendanceMap(initialMap);
      }
    } catch {
      console.warn("Could not load attendance for date");
    } finally {
      setAttendanceLoading(false);
    }
  }, [batch, getHeaders]);

  useEffect(() => {
    if (isOpen && batch) {
      setEnrollRollNumber("");
      loadRoster();
      loadAttendanceForDate(attendanceDate);
    } else {
      setRosterList([]);
      setAttendanceMap({});
    }
  }, [isOpen, batch, loadRoster, loadAttendanceForDate, attendanceDate]);

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

  const handleMarkAll = (status: AttendanceStatusType) => {
    const updated: Record<string, AttendanceRecordState> = {};
    rosterList.forEach((st) => {
      updated[st.studentId] = {
        status,
        remarks: attendanceMap[st.studentId]?.remarks || "",
      };
    });
    setAttendanceMap(updated);
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatusType) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || "",
      },
    }));
  };

  const setStudentRemarks = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "PRESENT",
        remarks,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    if (!batch || rosterList.length === 0) return;
    setIsSavingAttendance(true);
    try {
      const records = rosterList.map((st) => ({
        studentId: st.studentId,
        status: attendanceMap[st.studentId]?.status || "PRESENT",
        remarks: attendanceMap[st.studentId]?.remarks || undefined,
      }));

      const headers = getHeaders();
      const res = await fetch(`/api/v1/academics/batches/${batch.id}/attendance`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: attendanceDate,
          records,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save attendance");
      }

      toast.success(`Attendance saved for ${records.length} students on ${attendanceDate}!`);
      await loadAttendanceForDate(attendanceDate);
    } catch (err: any) {
      toast.error(err.message || "Error saving attendance records");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  if (!isOpen || !batch) return null;

  const presentCount = rosterList.filter(
    (st) => (attendanceMap[st.studentId]?.status || "PRESENT") === "PRESENT"
  ).length;
  const absentCount = rosterList.filter(
    (st) => attendanceMap[st.studentId]?.status === "ABSENT"
  ).length;
  const lateCount = rosterList.filter(
    (st) => attendanceMap[st.studentId]?.status === "LATE"
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-accent rounded-sm max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col justify-between">
        <div className="flex flex-col min-h-0 flex-1">
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

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-accent mt-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("roster")}
              className={`py-2 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "roster"
                  ? "border-brand-primary text-brand-primary bg-accent-subtle/50"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Roster & Admissions ({rosterList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className={`py-2 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "attendance"
                  ? "border-brand-primary text-brand-primary bg-accent-subtle/50"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Attendance Session Desk
            </button>
          </div>

          {/* Tab 1: Roster */}
          {activeTab === "roster" && (
            <div className="flex flex-col min-h-0 flex-1 mt-3">
              {/* Quick Enroll Bar */}
              <form onSubmit={handleEnrollStudent} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Student Roll Number (e.g. 2026-DH-0101) to enroll..."
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
              <div className="mt-3 border border-accent rounded-sm overflow-hidden flex-1 max-h-80 overflow-y-auto">
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
                          <td className="py-2 px-3 font-mono font-bold text-brand-primary">
                            {st.rollNumber}
                          </td>
                          <td className="py-2 px-3 font-semibold text-text-main">{st.fullName}</td>
                          <td className="py-2 px-3 font-mono text-text-muted">{st.phone}</td>
                          <td className="py-2 px-3 text-text-muted font-mono">
                            {st.guardianPhone || "N/A"}
                          </td>
                          <td className="py-2 px-3 text-right">
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
          )}

          {/* Tab 2: Attendance Session Desk */}
          {activeTab === "attendance" && (
            <div className="flex flex-col min-h-0 flex-1 mt-3 space-y-3">
              {/* Session Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-accent-subtle border border-accent rounded-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-semibold text-text-main">Session Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-2 py-1 bg-surface border border-accent rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary font-mono"
                  />
                  {attendanceLoading && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  )}
                </div>

                {/* Quick Bulk Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll("PRESENT")}
                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold rounded-sm border border-emerald-500/30 transition-colors"
                  >
                    ✓ All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll("ABSENT")}
                    className="px-2.5 py-1 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs font-semibold rounded-sm border border-rose-500/30 transition-colors"
                  >
                    ✕ All Absent
                  </button>
                </div>
              </div>

              {/* Attendance Quick Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 border border-accent rounded-sm bg-bg-app">
                  <span className="text-text-muted block text-[10px] uppercase">Enrolled</span>
                  <span className="font-bold font-mono text-text-main text-sm">{rosterList.length}</span>
                </div>
                <div className="p-2 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                  <span className="text-emerald-600 block text-[10px] uppercase font-semibold">Present</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">{presentCount}</span>
                </div>
                <div className="p-2 border border-rose-500/30 rounded-sm bg-rose-500/5">
                  <span className="text-rose-600 block text-[10px] uppercase font-semibold">Absent</span>
                  <span className="font-bold font-mono text-rose-600 text-sm">{absentCount}</span>
                </div>
                <div className="p-2 border border-amber-500/30 rounded-sm bg-amber-500/5">
                  <span className="text-amber-600 block text-[10px] uppercase font-semibold">Late</span>
                  <span className="font-bold font-mono text-amber-600 text-sm">{lateCount}</span>
                </div>
              </div>

              {/* Attendance Students Table */}
              <div className="border border-accent rounded-sm overflow-hidden flex-1 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider sticky top-0 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Roll Number</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent">
                    {rosterList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-text-muted">
                          No enrolled students in this batch to record attendance.
                        </td>
                      </tr>
                    ) : (
                      rosterList.map((st) => {
                        const currentStatus = attendanceMap[st.studentId]?.status || "PRESENT";
                        const currentRemarks = attendanceMap[st.studentId]?.remarks || "";

                        return (
                          <tr key={st.studentId} className="hover:bg-accent-subtle/30 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-brand-primary">
                              {st.rollNumber}
                            </td>
                            <td className="py-2 px-3 font-medium text-text-main">
                              {st.fullName}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setStudentStatus(st.studentId, "PRESENT")}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors ${
                                    currentStatus === "PRESENT"
                                      ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                                      : "bg-surface text-text-muted border-accent hover:border-emerald-500/50"
                                  }`}
                                >
                                  P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentStatus(st.studentId, "ABSENT")}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors ${
                                    currentStatus === "ABSENT"
                                      ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                                      : "bg-surface text-text-muted border-accent hover:border-rose-500/50"
                                  }`}
                                >
                                  A
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentStatus(st.studentId, "LATE")}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors ${
                                    currentStatus === "LATE"
                                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                      : "bg-surface text-text-muted border-accent hover:border-amber-500/50"
                                  }`}
                                >
                                  L
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentStatus(st.studentId, "EXCUSED")}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors ${
                                    currentStatus === "EXCUSED"
                                      ? "bg-blue-500 text-white border-blue-600 shadow-xs"
                                      : "bg-surface text-text-muted border-accent hover:border-blue-500/50"
                                  }`}
                                >
                                  E
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="Optional note..."
                                value={currentRemarks}
                                onChange={(e) => setStudentRemarks(st.studentId, e.target.value)}
                                className="w-full px-2 py-0.5 text-[11px] bg-bg-app border border-accent rounded-sm focus:outline-none focus:border-brand-primary"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Attendance Bar */}
              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance || rosterList.length === 0}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingAttendance ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Session...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm & Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-accent pt-3 flex justify-between items-center text-xs text-text-muted">
          <span>Attendance records update student profile history immediately.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-accent text-xs font-semibold rounded-sm hover:bg-accent-subtle text-text-main transition-colors"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
