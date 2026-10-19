import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Receipt,
  LogOut,
  GraduationCap,
  Moon,
  Sun,
  FileText,
  Share2,
  ChevronRight,
  Award,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../lib/theme.js";

export const StudentLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [currentUser] = useState<{
    fullName?: string;
    email?: string;
    rollNumber?: string;
    avatarUrl?: string;
  }>(() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [institutionName, setInstitutionName] = useState<string>("");

  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.organization?.name) {
          setInstitutionName(json.data.organization.name);
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_refresh_token");
    localStorage.removeItem("cms_user");
    toast.info("Signed out of student portal");
    navigate("/login");
  };


  const navLinks = [
    { label: "Dashboard Overview", path: "/student", icon: LayoutDashboard, hasSubActions: false },
    { label: "Study Materials", path: "/student/materials", icon: FileText, hasSubActions: true },
    { label: "Attendance Record", path: "/student/attendance", icon: CalendarCheck, hasSubActions: false },
    { label: "Exam Scores & Cards", path: "/student/exams", icon: Award, hasSubActions: true },
    { label: "Fee Invoices & Pay", path: "/student/fees", icon: Receipt, hasSubActions: true },
    { label: "Referrals & Rewards", path: "/student/referrals", icon: Share2, hasSubActions: true },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between bg-surface">
      {/* Brand & Enrollment Header */}
      <div>
        <div className="h-16 border-b border-theme px-5 flex items-center justify-between">
          <Link to="/student" className="flex items-center gap-2.5 font-bold text-sm">
            <div className="w-8 h-8 bg-brand-primary text-white flex items-center justify-center rounded-sm font-bold shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="block text-text-main font-bold truncate max-w-[120px]">
                {institutionName || "Medhasiree"}
              </span>
              <span className="block text-[10px] text-text-main/50 font-normal">Student Portal</span>
            </div>
          </Link>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 rounded-xs uppercase tracking-wider">
            Active
          </span>
        </div>

        {/* Navigation Options List */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-text-main/40">
            Navigation Menu
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-text-main/70 hover:bg-bg-app hover:text-text-main"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-brand-primary"}`} />
                  <span>{item.label}</span>
                </div>
                {/* Arrow sign for options with sub-actions or multiple modals */}
                {item.hasSubActions && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                      isActive ? "text-white/80" : "text-text-main/30 group-hover:text-text-main/60"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile Dock */}
      <div className="p-3 border-t border-theme bg-bg-app/40 space-y-2">
        {/* Profile Card */}
        <Link
          to="/student/profile"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-3 p-2 rounded-sm hover:bg-surface border border-transparent hover:border-theme transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30 flex items-center justify-center text-xs font-black shrink-0">
            {getInitials(currentUser.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-main truncate group-hover:text-brand-primary transition-colors">
              {currentUser.fullName || "Student Portal"}
            </p>
            <p className="text-[10px] text-text-main/50 truncate font-mono">
              {currentUser.email || "student@institution"}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-main/30 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Action Controls: Theme & Logout */}
        <div className="pt-2 border-t border-theme flex items-center justify-between px-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-[11px] text-text-main/70 hover:text-text-main p-1 rounded-sm"
            title="Toggle color theme"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-brand-primary" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 p-1 rounded-sm transition-colors"
            title="Sign out of student portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-bg-app text-text-main">
      {/* Desktop Sidepanel */}
      <aside className="hidden md:flex w-64 border-r border-theme bg-surface shrink-0 flex-col justify-between fixed top-0 bottom-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Backdrop & Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 flex">
          <div className="w-64 bg-surface h-full shadow-2xl relative">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-text-main/60 hover:text-text-main rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>
            {SidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Mobile Header Bar (Only visible on small mobile screens) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-theme bg-surface sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 border border-theme rounded-sm hover:bg-bg-app text-text-main"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-text-main">
              {navLinks.find((l) => l.path === location.pathname)?.label || "Student Portal"}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 border border-theme rounded-sm hover:bg-bg-app text-text-main/70"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-primary" />}
          </button>
        </div>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
