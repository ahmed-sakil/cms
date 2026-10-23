import React, { useEffect, useState, Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Receipt,
  LogOut,
  Moon,
  Sun,
  FileText,
  Share2,
  Award,
  Bell,
  Menu,
  ExternalLink,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../lib/theme.js";
import { setDynamicFavicon } from "../utils/dynamicFavicon.js";

export const StudentLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [currentUser] = useState<{
    id?: string;
    fullName?: string;
    email?: string;
    rollNumber?: string;
    avatarUrl?: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [institution, setInstitution] = useState<{
    name?: string;
    logoUrl?: string;
    faviconUrl?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.organization) {
          const org = json.data.organization;
          setInstitution(org);
          setDynamicFavicon(
            org.faviconUrl || org.logoUrl,
            org.name,
            org.logoUrl
          );
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

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navLinks = [
    { label: "Dashboard", path: "/student", icon: LayoutDashboard },
    { label: "Notices", path: "/student/notices", icon: Bell },
    { label: "Study Materials", path: "/student/materials", icon: FileText },
    { label: "Attendance", path: "/student/attendance", icon: CalendarCheck },
    { label: "Exams", path: "/student/exams", icon: Award },
    { label: "Fees", path: "/student/fees", icon: Receipt },
    { label: "Referrals", path: "/student/referrals", icon: Share2 },
    { label: "Profile", path: "/student/profile", icon: User },
  ];

  const currentNav = navLinks.find(
    (l) => l.path === location.pathname || (l.path !== "/student" && location.pathname.startsWith(l.path))
  );

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between bg-surface border-r border-accent">
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-accent px-4 flex items-center justify-between">
          <Link to="/student" className="flex items-center gap-2.5 font-bold text-sm min-w-0">
            {institution?.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name || "Logo"}
                className="w-8 h-8 rounded-sm object-contain border border-accent bg-white shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-brand-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                SP
              </div>
            )}
            <div className="truncate">
              <span className="block text-text-main text-xs font-bold truncate">
                {institution?.name || "Apex Academy"}
              </span>
              <span className="block text-[10px] text-brand-primary font-semibold tracking-wider uppercase">
                Student Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/student/notices"
              className="p-1.5 text-text-muted hover:text-brand-primary rounded-sm transition-colors relative"
              title="Notices & Circulars"
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
              link.path === "/student"
                ? location.pathname === "/student"
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
            to="/student/profile"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
            title="Manage Student Profile"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName || "Student"}
                className="w-8 h-8 rounded-sm object-cover border border-accent shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-brand-primary/20 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0 border border-brand-primary/30">
                {getInitials(currentUser?.fullName)}
              </div>
            )}
            <div className="truncate">
              <span className="block text-xs font-bold text-text-main group-hover:text-brand-primary transition-colors truncate">
                {currentUser?.fullName || "Student Member"}
              </span>
              <span className="block text-[10px] text-text-muted truncate">
                {currentUser?.email || "student@portal.edu"}
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
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-text-muted hover:text-red-500 bg-surface border border-accent rounded-sm transition-colors cursor-pointer"
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

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Top Navigation */}
        <header className="lg:hidden h-14 border-b border-accent bg-surface px-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 text-text-muted hover:text-text-main rounded-sm"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-text-main">
            {currentNav?.label || "Student Portal"}
          </span>

          <button
            onClick={toggleTheme}
            className="p-1.5 text-text-muted hover:text-text-main rounded-sm"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Dynamic Page Outlet with smooth scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bg-app">
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-surface border border-accent rounded-sm w-48" />
                <div className="h-64 bg-surface border border-accent rounded-sm w-full" />
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
