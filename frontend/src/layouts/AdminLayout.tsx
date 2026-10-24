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
  ChevronRight,
  ChevronDown,
  ExternalLink,
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
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);

  const [currentUser] = useState<{
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    branchId?: string;
    avatarUrl?: string;
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
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    ...(!isBranchAdmin
      ? [
          {
            label: "Settings",
            path: "/admin/settings",
            icon: Settings,
            children: [
              { label: "Branding & Logo", path: "/admin/settings?tab=branding", tab: "branding" },
              { label: "Hero Sliders", path: "/admin/settings?tab=posters", tab: "posters" },
              { label: "Payment Accounts", path: "/admin/settings?tab=payments", tab: "payments" },
              { label: "Campuses", path: "/admin/settings?tab=branches", tab: "branches" },
            ],
          },
        ]
      : [
          { label: "Assigned Campus", path: "/admin/branches", icon: Building2 },
        ]),
    { label: "Students", path: "/admin/students", icon: Users },
    { label: "Teachers & Staff", path: "/admin/teachers", icon: UserCheck },
    { label: "Batches", path: "/admin/batches", icon: Calendar },
    { label: "Courses", path: "/admin/courses", icon: GraduationCap },
    { label: "Study Materials", path: "/admin/materials", icon: FileText },
    { label: "Exams", path: "/admin/exams", icon: Award },
    { label: "Notices", path: "/admin/notices", icon: Bell },
    { label: "Achievements", path: "/admin/achievements", icon: Trophy },
    { label: "Academic Tips", path: "/admin/faculty-tips", icon: BookOpen },
    { label: "Reviews", path: "/admin/reviews", icon: MessageSquare },
    { label: "Fees & Accounts", path: "/admin/fees", icon: CreditCard },
    { label: "Expenses", path: "/admin/expenses", icon: Receipt },
    { label: "Referrals", path: "/admin/referrals", icon: Share2 },
  ];

  const currentNav = navLinks.find(
    (l) => l.path === location.pathname || (l.path !== "/admin" && location.pathname.startsWith(l.path))
  );

  const resolvedBranchName =
    currentUser?.branch?.name ||
    branches.find((b) => b.id === currentUser?.branchId)?.name ||
    "Assigned Campus";

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between bg-surface border-r border-accent">
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-accent px-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5 font-bold text-sm min-w-0">
            {institution?.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name || "Logo"}
                className="w-8 h-8 rounded-sm object-contain border border-accent bg-white shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-brand-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                AP
              </div>
            )}
            <div className="truncate">
              <span className="block text-text-main text-xs font-bold truncate">
                {institution?.name || "Apex Academy"}
              </span>
              <span className="block text-[10px] text-brand-primary font-semibold tracking-wider uppercase">
                Admin Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/admin/notices"
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

        {/* Minimal Campus Scope */}
        <div className="px-4 py-2 bg-bg-app/40 border-b border-accent flex items-center justify-between text-[11px]">
          <span className="text-text-muted font-medium">Campus</span>
          <span className="font-semibold text-text-main truncate max-w-[140px]">
            {currentUser?.role === "SUPER_ADMIN" ? "All Campuses" : resolvedBranchName}
          </span>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-215px)]">
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
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-sm text-xs font-semibold cursor-pointer transition-colors ${
                      isGroupActive
                        ? "bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary"
                        : "text-text-muted hover:bg-bg-app hover:text-text-main"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                      <Icon className={`w-4 h-4 shrink-0 ${isGroupActive ? "text-brand-primary" : "text-text-muted"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="p-0.5 text-text-muted group-hover:text-text-main rounded-xs shrink-0">
                      {isOrgMenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isOrgMenuOpen && (
                    <div className="ml-3 pl-2.5 border-l border-accent space-y-0.5 pt-0.5 pb-0.5">
                      {item.children.map((child: any) => {
                        const isChildActive =
                          (location.pathname === "/admin/settings" && currentTab === child.tab) ||
                          (child.tab === "branches" && location.pathname === "/admin/branches");

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs transition-colors ${
                              isChildActive
                                ? "bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary"
                                : "text-text-muted hover:bg-bg-app hover:text-text-main"
                            }`}
                          >
                            <span className="truncate">{child.label}</span>
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
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary"
                    : "text-text-muted hover:text-text-main hover:bg-bg-app"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-primary" : "text-text-muted"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Dock */}
      <div className="p-3 border-t border-accent bg-bg-app/50 space-y-2">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-sm hover:bg-surface border border-transparent hover:border-accent transition-colors">
          <Link
            to="/admin/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
            title="Settings & Profile"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName || "Administrator"}
                className="w-8 h-8 rounded-sm object-cover border border-accent shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-brand-primary/20 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0 border border-brand-primary/30">
                {getInitials(currentUser?.fullName)}
              </div>
            )}
            <div className="truncate">
              <span className="block text-xs font-bold text-text-main group-hover:text-brand-primary transition-colors truncate">
                {currentUser?.fullName || "Administrator"}
              </span>
              <span className="block text-[10px] text-text-muted truncate">
                {currentUser?.email || "admin@institution.edu"}
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
              <span className="font-bold text-text-main">{currentNav?.label || "Admin Portal"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/notices"
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
