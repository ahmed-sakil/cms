import React, { useEffect, useState, Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  CreditCard,
  Bell,
  LogOut,
  Moon,
  Sun,
  UserCheck,
  Settings,
  FileText,
  Award,
  Share2,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Crown,
  Receipt,
  GraduationCap,
  Trophy,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../lib/theme.js";
import { setDynamicFavicon } from "../utils/dynamicFavicon.js";

export const AdminLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(true);

  const [currentUser] = useState<{
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    branchId?: string;
    branch?: { id: string; name: string; code: string };
  } | null>(() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [institution, setInstitution] = useState<{ name?: string; logoUrl?: string; faviconUrl?: string } | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; isMainBranch?: boolean }>>([]);

  useEffect(() => {
    fetch("/api/v1/public/landing")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.organization) {
            setInstitution(json.data.organization);
            setDynamicFavicon(
              json.data.organization.faviconUrl || json.data.organization.logoUrl,
              json.data.organization.name,
              json.data.organization.logoUrl
            );
          }
          if (json.data.branches) setBranches(json.data.branches);
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_refresh_token");
    localStorage.removeItem("cms_user");
    toast.info("Signed out of administrative console");
    navigate("/login");
  };


  const getInitials = (name?: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";

  const navLinks = [
    { label: "Overview", path: "/admin", icon: LayoutDashboard, hasSubActions: false },
    ...(!isBranchAdmin
      ? [
          {
            label: "Organisation Settings",
            path: "/admin/settings",
            icon: Settings,
            children: [
              { label: "Identity & Branding", path: "/admin/settings?tab=branding", tab: "branding" },
              { label: "Hero Posters & Sliders", path: "/admin/settings?tab=posters", tab: "posters" },
              { label: "Payment Channels & Sensitive", path: "/admin/settings?tab=payments", tab: "payments" },
              { label: "Campus / Branches", path: "/admin/settings?tab=branches", tab: "branches" },
            ],
          },
        ]
      : [
          { label: "Assigned Campus", path: "/admin/branches", icon: Building2, hasSubActions: true },
        ]),
    { label: "Students Directory", path: "/admin/students", icon: Users, hasSubActions: true },
    { label: "Faculty & Staff", path: "/admin/teachers", icon: UserCheck, hasSubActions: true },
    { label: "Batches & Classrooms", path: "/admin/batches", icon: Calendar, hasSubActions: true },
    { label: "Courses & Curriculums", path: "/admin/courses", icon: GraduationCap, hasSubActions: true },
    { label: "Study Materials", path: "/admin/materials", icon: FileText, hasSubActions: true },
    { label: "Exams & Marksheets", path: "/admin/exams", icon: Award, hasSubActions: true },
    { label: "Notice Board", path: "/admin/notices", icon: Bell, hasSubActions: true },
    { label: "Hall of Fame & Achievements", path: "/admin/achievements", icon: Trophy, hasSubActions: true },
    { label: "Faculty Tips & Guides", path: "/admin/faculty-tips", icon: BookOpen, hasSubActions: true },
    { label: "Reviews & Advice", path: "/admin/reviews", icon: MessageSquare, hasSubActions: true },
    { label: "Accounts & Fees", path: "/admin/fees", icon: CreditCard, hasSubActions: true },
    { label: "Campus Expenses", path: "/admin/expenses", icon: Receipt, hasSubActions: true },
    { label: "Referral Payouts", path: "/admin/referrals", icon: Share2, hasSubActions: true },
  ];

  const currentNav = navLinks.find(
    (l) => l.path === location.pathname || (l.path !== "/admin" && location.pathname.startsWith(l.path))
  );

  const resolvedBranchName =
    currentUser?.branch?.name ||
    branches.find((b) => b.id === currentUser?.branchId)?.name ||
    "Assigned Campus";

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between bg-surface">
      {/* Brand & Enrollment Header */}
      <div>
        <div className="h-16 border-b border-theme px-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5 font-bold text-sm min-w-0">
            {institution?.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name || "Logo"}
                className="w-8 h-8 rounded-sm object-contain border border-theme bg-white"
              />
            ) : (
              <div className="w-8 h-8 bg-brand-primary text-white flex items-center justify-center rounded-sm font-bold shadow-xs shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            )}
            <div className="leading-tight min-w-0">
              {institution?.name ? (
                <span className="block text-text-main font-bold truncate">
                  {institution.name}
                </span>
              ) : (
                <span className="block h-4 w-28 bg-accent rounded-xs animate-pulse" />
              )}
              <span className="block text-[10px] text-text-main/50 font-normal">Admin Console</span>
            </div>
          </Link>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xs uppercase tracking-wider shrink-0">
            {currentUser?.role?.replace("_", " ") || "SUPER"}
          </span>
        </div>

        {/* Branch Context Indicator */}
        <div className="p-3 bg-bg-app/60 border-b border-theme text-xs">
          <span className="text-text-main/50 block text-[10px] uppercase font-bold tracking-wider">
            Operational Scope
          </span>
          <div className="font-semibold text-text-main flex items-center gap-1.5 mt-0.5 truncate">
            {currentUser?.role === "SUPER_ADMIN" ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span className="truncate">Universal (All Campuses)</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{resolvedBranchName}</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-text-main/40">
            Administrative Menu
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isGroupActive =
                location.pathname.startsWith("/admin/settings") ||
                location.pathname === "/admin/branches";
              const currentTab = new URLSearchParams(location.search).get("tab") || "branding";

              return (
                <div key={item.path} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setIsOrgMenuOpen((prev) => !prev)}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-sm text-xs font-semibold cursor-pointer transition-all ${
                      isGroupActive
                        ? "bg-bg-app text-brand-primary border border-theme"
                        : "text-text-main/70 hover:bg-bg-app hover:text-text-main"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                      <Icon className="w-4 h-4 shrink-0 text-brand-primary" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="p-1 text-text-main/40 group-hover:text-text-main rounded-xs shrink-0">
                      {isOrgMenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isOrgMenuOpen && (
                    <div className="ml-4 pl-2.5 border-l-2 border-theme space-y-0.5 pt-1 pb-1">
                      {item.children.map((child: any) => {
                        const isChildActive =
                          (location.pathname === "/admin/settings" && currentTab === child.tab) ||
                          (child.tab === "branches" && location.pathname === "/admin/branches");

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all ${
                              isChildActive
                                ? "bg-brand-primary text-white font-bold shadow-xs"
                                : "text-text-main/70 hover:bg-bg-app hover:text-text-main"
                            }`}
                          >
                            <span className="truncate">{child.label}</span>
                            {isChildActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`group flex items-center justify-between px-3 py-2 rounded-sm text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-text-main/70 hover:bg-bg-app hover:text-text-main"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-brand-primary"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.hasSubActions && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isActive ? "text-white/80" : "text-text-main/30 group-hover:text-text-main/60"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Public Portal Link */}
        <div className="px-3 pt-1">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-sm text-xs font-medium text-text-main/70 hover:bg-bg-app hover:text-text-main border border-dashed border-theme"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-brand-primary" />
              <span>Public Portal</span>
            </span>
            <ChevronRight className="w-3 h-3 text-text-main/40" />
          </Link>
        </div>
      </div>

      {/* Bottom Profile Dock (matching StudentLayout) */}
      <div className="p-3 border-t border-theme bg-bg-app/40 space-y-2">
        <Link
          to="/admin/settings"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-3 p-2 rounded-sm hover:bg-surface border border-transparent hover:border-theme transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30 flex items-center justify-center text-xs font-black shrink-0">
            {getInitials(currentUser?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-main truncate group-hover:text-brand-primary transition-colors">
              {currentUser?.fullName || "Administrator"}
            </p>
            <p className="text-[10px] text-text-main/50 truncate font-mono">
              {currentUser?.email || "admin@institution"}
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
            title="Sign out of administrative console"
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
              className="absolute top-4 right-3 p-1.5 text-text-main/60 hover:text-text-main rounded-sm z-10"
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
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-theme bg-surface sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 border border-theme rounded-sm hover:bg-bg-app text-text-main"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-text-main">
              {currentNav?.label || "Admin Console"}
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

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse p-4">
                <div className="h-8 bg-surface border border-theme rounded-sm w-48" />
                <div className="h-64 bg-surface border border-theme rounded-sm w-full" />
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
