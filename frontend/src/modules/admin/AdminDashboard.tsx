import React from "react";
import {
  Users,
  Calendar,
  GraduationCap,
  TrendingUp,
  Building2,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

export const AdminDashboard: React.FC = () => {
  const stats = [
    { label: "Active Students", value: "1,248", change: "+12% this month", icon: Users },
    { label: "Ongoing Batches", value: "28", change: "4 starting next week", icon: Calendar },
    { label: "Total Courses", value: "14", change: "3 branches active", icon: GraduationCap },
    { label: "Monthly Collections", value: "৳ 8,42,000", change: "92% collected", icon: TrendingUp },
  ];

  const recentAdmissions = [
    { id: "1", name: "Samiul Islam", roll: "2026-DH-0199", course: "Higher Mathematics", branch: "Dhanmondi", status: "ACTIVE" },
    { id: "2", name: "Farhana Akter", roll: "2026-UT-0145", course: "HSC Higher English", branch: "Uttara", status: "ACTIVE" },
    { id: "3", name: "Nayeem Rahman", roll: "2026-MP-0082", course: "Physics Fundamentals", branch: "Mirpur", status: "PENDING_VERIFICATION" },
    { id: "4", name: "Ayesha Siddiqua", roll: "2026-DH-0200", course: "Higher Mathematics", branch: "Dhanmondi", status: "ACTIVE" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cross-branch overview and real-time admission metrics.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => toast.info("Opening Student Admission Modal")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> New Admission
          </button>
          <button
            onClick={() => toast.info("Opening Batch Scheduling Wizard")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-accent-subtle transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Batch
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface border border-accent rounded-sm p-4 space-y-2 shadow-xs"
            >
              <div className="flex justify-between items-center text-text-muted">
                <span className="text-xs font-medium">{stat.label}</span>
                <Icon className="w-4 h-4 text-brand-primary" />
              </div>
              <p className="text-2xl font-black text-text-main">{stat.value}</p>
              <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Admissions Table */}
      <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-accent flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-text-main">Recent Admissions</h3>
            <p className="text-xs text-text-muted">Newly registered students across all active branches.</p>
          </div>
          <button
            onClick={() => toast.success("Refreshed recent admissions records")}
            className="text-xs text-brand-primary font-semibold hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Student Name</th>
                <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                <th className="py-2.5 px-4 font-semibold">Course</th>
                <th className="py-2.5 px-4 font-semibold">Branch</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent">
              {recentAdmissions.map((student) => (
                <tr key={student.id} className="hover:bg-accent-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text-main">{student.name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-text-muted">{student.roll}</td>
                  <td className="py-3 px-4 text-text-main">{student.course}</td>
                  <td className="py-3 px-4 flex items-center gap-1 text-text-muted">
                    <Building2 className="w-3 h-3 text-brand-primary" /> {student.branch}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${
                        student.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
