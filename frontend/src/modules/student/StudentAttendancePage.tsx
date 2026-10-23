import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";

interface AttendanceItem {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks?: string | null;
  batch?: {
    id: string;
    name: string;
    classroom?: string | null;
    course?: { name: string } | null;
  } | null;
}

export const StudentAttendancePage: React.FC = () => {
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("cms_token");
        const res = await fetch("/api/v1/students/attendance", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAttendances(json.data);
        } else {
          setAttendances([]);
        }
      } catch {
        setAttendances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Compute batches for filtering
  const batchesList = Array.from(
    new Map(
      attendances
        .filter((a) => a.batch)
        .map((a) => [a.batch!.id, a.batch!.name])
    ).entries()
  );

  const filtered = attendances.filter((a) => {
    if (selectedBatch === "ALL") return true;
    return a.batch?.id === selectedBatch;
  });

  const totalClasses = filtered.length;
  const presentCount = filtered.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const absentCount = filtered.filter((a) => a.status === "ABSENT").length;
  const lateCount = filtered.filter((a) => a.status === "LATE").length;
  const excusedCount = filtered.filter((a) => a.status === "EXCUSED").length;

  const attendancePercentage =
    totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-5 border border-accent rounded-sm">
        <div>
          <h1 className="text-lg font-bold text-text-main flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-primary" />
            Class Attendance
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Track your physical classroom presence and lecture logs.
          </p>
        </div>

        {batchesList.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-2.5 py-1.5 bg-bg-app border border-accent rounded-sm text-xs text-text-main font-medium focus:outline-hidden focus:border-brand-primary"
            >
              <option value="ALL">All Batches</option>
              {batchesList.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Attendance Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold ${
                attendancePercentage >= 80
                  ? "text-green-600 dark:text-green-400"
                  : attendancePercentage >= 65
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {attendancePercentage}%
            </span>
            <span className="text-[10px] text-text-muted">
              {presentCount}/{totalClasses} Sessions
            </span>
          </div>
          <div className="w-full bg-bg-app rounded-xs h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                attendancePercentage >= 80
                  ? "bg-green-600 dark:bg-green-500"
                  : attendancePercentage >= 65
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Present Days */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Present
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-text-main">{presentCount}</p>
          <p className="text-[10px] text-text-muted">Classes attended</p>
        </div>

        {/* Absent Days */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Absent
            </span>
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold text-text-main">{absentCount}</p>
          <p className="text-[10px] text-text-muted">Missed sessions</p>
        </div>

        {/* Late / Excused */}
        <div className="bg-surface border border-accent rounded-sm p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Late / Excused
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-text-main">
            {lateCount + excusedCount}
          </p>
          <p className="text-[10px] text-text-muted">
            {lateCount} late, {excusedCount} excused
          </p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-surface border border-accent rounded-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-accent flex items-center justify-between">
          <h2 className="text-xs font-bold text-text-main uppercase tracking-wider">
            Attendance Log
          </h2>
          <span className="text-[11px] text-text-muted">
            {filtered.length} Recorded Entries
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-text-muted space-y-2">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading attendance history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CalendarCheck className="w-8 h-8 text-text-muted/40 mx-auto" />
            <p className="text-sm font-bold text-text-main">No Attendance Records</p>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Attendance records will appear here as your lectures are conducted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-bg-app border-b border-accent text-[10px] uppercase font-bold text-text-muted">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Batch & Course</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent">
                {filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-bg-app/50 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-text-main">
                      {new Date(att.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-text-main">
                        {att.batch?.name || "Assigned Batch"}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {att.batch?.course?.name || "Course"}
                      </div>
                    </td>
                    <td className="p-3 text-text-muted">
                      {att.batch?.classroom || "Main Hall"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                          att.status === "PRESENT"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                            : att.status === "LATE"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : att.status === "EXCUSED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted">
                      {att.remarks || "Regular Lecture Session"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
