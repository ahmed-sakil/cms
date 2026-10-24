import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  GraduationCap,
  TrendingUp,
  Building2,
  Plus,
  UserPlus,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";
import { formatCurrency, formatDate, formatNumber } from "../../lib/formatters.js";
import { StatCard } from "../../components/ui/StatCard.js";

interface AdminMetrics {
  totalStudents: number;
  totalBatches: number;
  totalCourses: number;
  activeBranches: number;
}

interface FinanceOverview {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses: number;
  netOperatingBalance: number;
}

interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rollNumber?: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  enrollments?: Array<{
    batch?: {
      id: string;
      name: string;
      course?: {
        name: string;
      } | null;
    } | null;
  }>;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalStudents: 0,
    totalBatches: 0,
    totalCourses: 0,
    activeBranches: 0,
  });

  const [financials, setFinancials] = useState<FinanceOverview>({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalExpenses: 0,
    netOperatingBalance: 0,
  });

  const [recentAdmissions, setRecentAdmissions] = useState<StudentItem[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, studentsRes, financeRes] = await Promise.allSettled([
        apiClient.get<AdminMetrics>("/admin/metrics"),
        apiClient.get<{ items: StudentItem[]; meta: any }>("/admin/students?limit=5"),
        apiClient.get<FinanceOverview>("/finance/overview"),
      ]);

      if (metricsRes.status === "fulfilled" && metricsRes.value.success && metricsRes.value.data) {
        setMetrics(metricsRes.value.data);
      }

      if (studentsRes.status === "fulfilled" && studentsRes.value.success && studentsRes.value.data) {
        const items = studentsRes.value.data.items || (Array.isArray(studentsRes.value.data) ? studentsRes.value.data : []);
        setRecentAdmissions(items);
      }

      if (financeRes.status === "fulfilled" && financeRes.value.success && financeRes.value.data) {
        setFinancials(financeRes.value.data);
      }
    } catch {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Active Students",
      value: formatNumber(metrics.totalStudents),
      change: `Across ${metrics.activeBranches || 1} campus${metrics.activeBranches === 1 ? "" : "es"}`,
      icon: Users,
    },
    {
      label: "Ongoing Batches",
      value: formatNumber(metrics.totalBatches),
      change: "Active cohorts scheduled",
      icon: Calendar,
    },
    {
      label: "Total Courses",
      value: formatNumber(metrics.totalCourses),
      change: "Standardized curriculums",
      icon: GraduationCap,
    },
    {
      label: "Total Collections",
      value: formatCurrency(financials.totalCollected),
      change: `Net: ${formatCurrency(financials.netOperatingBalance)}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">
            Admin Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Overview and key metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            title="Refresh metrics"
            className="p-1.5 bg-surface border border-accent text-text-muted hover:text-text-main rounded-sm hover:bg-accent-subtle transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => navigate("/admin/students?action=admit")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> New Admission
          </button>
          <button
            onClick={() => navigate("/admin/batches?action=create")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent text-text-main text-xs font-semibold rounded-sm hover:bg-accent-subtle transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Batch
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            isLoading={isLoading}
            trend="up"
          />
        ))}
      </div>

      {/* Recent Admissions Table */}
      <div className="bg-surface border border-accent rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-accent flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-text-main">Recent Admissions</h3>
            <p className="text-xs text-text-muted">Newly registered students across all active branches.</p>
          </div>
          <button
            onClick={() => navigate("/admin/students")}
            className="flex items-center gap-1 text-xs text-brand-primary font-semibold hover:underline"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent-subtle text-text-muted border-b border-accent uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Student Name</th>
                <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                <th className="py-2.5 px-4 font-semibold">Course / Batch</th>
                <th className="py-2.5 px-4 font-semibold">Campus</th>
                <th className="py-2.5 px-4 font-semibold">Admission Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-3.5 w-28 bg-accent rounded-xs" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-20 bg-accent rounded-xs" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-24 bg-accent rounded-xs" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-20 bg-accent rounded-xs" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-16 bg-accent rounded-xs" /></td>
                  </tr>
                ))
              ) : recentAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted text-xs">
                    No recent admissions found. Click &quot;New Admission&quot; to admit a student.
                  </td>
                </tr>
              ) : (
                recentAdmissions.map((student) => {
                  const firstEnrollment = student.enrollments?.[0];
                  const courseName =
                    firstEnrollment?.batch?.course?.name ||
                    firstEnrollment?.batch?.name ||
                    "General";

                  return (
                    <tr key={student.id} className="hover:bg-accent-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-text-main">{student.fullName}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-brand-primary font-semibold">
                        {student.rollNumber || "PENDING"}
                      </td>
                      <td className="py-3 px-4 text-text-main">{courseName}</td>
                      <td className="py-3 px-4 flex items-center gap-1 text-text-muted">
                        <Building2 className="w-3 h-3 text-brand-primary" /> {student.branch?.name || "Main Campus"}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {formatDate(student.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
