import React, { useState, useEffect, Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  UserCheck,
  Award,
  FileText,
  Bell,
  BookOpen,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../lib/theme.js";
import { setDynamicFavicon } from "../utils/dynamicFavicon.js";

export const TeacherLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [currentUser] = useState<{
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    branchId?: string;
    avatarUrl?: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [institution, setInstitution] = useState<{ name?: string; logoUrl?: string; faviconUrl?: string } | null>(null);

  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.organization) {
          setInstitution(json.data.organization);
          setDynamicFavicon(
            json.data.organization.faviconUrl || json.data.organization.logoUrl,
            json.data.organization.name,
            json.data.organization.logoUrl
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_refresh_token");
    localStorage.removeItem("cms_user");
    toast.info("Signed out of faculty portal");
    navigate("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "TH";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navLinks = [
    { label: "Overview", path: "/teacher", icon: LayoutDashboard },
    { label: "My Batches & Routine", path: "/teacher/batches", icon: Calendar },
    { label: "Class Attendance", path: "/teacher/attendance", icon: UserCheck },
    { label: "Exams & Marksheets", path: "/teacher/exams", icon: Award },
    { label: "Study Materials", path: "/teacher/materials", icon: FileText },
    { label: "Notices", path: "/teacher/notices", icon: Bell },
    { label: "Academic Tips", path: "/teacher/tips", icon: BookOpen },
    { label: "Faculty Profile", path: "/teacher/profile", icon: User },
  ];

  const currentNav = navLinks.find(
    (l) => l.path === location.pathname || (l.path !== "/teacher" && location.pathname.startsWith(l.path))
  );

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between bg-surface border-r border-accent">
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-accent px-4 flex items-center justify-between">
          <Link to="/teacher" className="flex items-center gap-2.5 font-bold text-sm min-w-0">
            {institution?.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name || "Logo"}
                className="w-8 h-8 rounded-sm object-contain border border-accent bg-white shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-brand-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                TP
              </div>
            )}
            <div className="truncate">
              <span className="block text-text-main text-xs font-bold truncate">
                {institution?.name || "Apex Academy"}
              </span>
              <span className="block text-[10px] text-brand-primary font-semibold tracking-wider uppercase">
                Teacher Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/teacher/notices"
              className="p-1.5 text-text-muted hover:text-brand-primary rounded-sm transition-colors relative"
              title="Notices"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-text-muted hover:text-brand-primary rounded-sm transition-colors"
              title="View Public Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.path === "/teacher"
                ? location.pathname === "/teacher"
                : location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary"
                    : "text-text-muted hover:text-text-main hover:bg-bg-app"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-primary" : "text-text-muted"}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Dock */}
      <div className="p-3 border-t border-accent bg-bg-app/50 space-y-2">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-sm hover:bg-surface border border-transparent hover:border-accent transition-colors">
          <Link
            to="/teacher/profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
            title="Manage Faculty Profile"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName || "Faculty"}
                className="w-8 h-8 rounded-sm object-cover border border-accent shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-brand-primary/20 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0 border border-brand-primary/30">
                {getInitials(currentUser?.fullName)}
              </div>
            )}
            <div className="truncate">
              <span className="block text-xs font-bold text-text-main group-hover:text-brand-primary transition-colors truncate">
                {currentUser?.fullName || "Faculty Member"}
              </span>
              <span className="block text-[10px] text-text-muted truncate">
                {currentUser?.email || "faculty@portal.edu"}
              </span>
            </div>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-app rounded-sm transition-colors cursor-pointer shrink-0"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-text-muted hover:text-status-danger hover:border-status-danger/30 hover:bg-status-danger/5 bg-surface border border-accent rounded-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg-app overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 z-50">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Top Header (Hidden on Desktop where Sidepanel is visible) */}
        <header className="lg:hidden h-14 border-b border-accent bg-surface px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-text-muted hover:text-text-main rounded-sm border border-accent"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-text-main">{currentNav?.label || "Teacher Portal"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/teacher/notices"
              className="p-1.5 text-text-muted hover:text-brand-primary rounded-sm transition-colors"
              title="Notices"
            >
              <Bell className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bg-app">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-48">
                <span className="text-xs text-text-muted">Loading module...</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;

