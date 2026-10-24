import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Moon,
  Sun,
  GraduationCap,
  LogIn,
  Phone,
  Mail,
  MapPin,
  Award,
  Menu,
  X,
  Calendar,
  BellRing,
  Trophy,
  BookOpen,
  MessageSquare,
  Send,
  ChevronRight,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "../lib/theme.js";
import { setDynamicFavicon } from "../utils/dynamicFavicon.js";

interface MainBranchData {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  isMainBranch?: boolean;
}

interface OrgData {
  name?: string;
  tagline?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  establishedYear?: string;
  whatsappNumber?: string;
}

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic database records (no hardcoded fake fallbacks)
  const [landingData, setLandingData] = useState<any>(null);
  const [mainBranch, setMainBranch] = useState<MainBranchData | null>(null);
  const [organization, setOrganization] = useState<OrgData | null>(null);

  // Active Session Reader
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("cms_user");
      const token = localStorage.getItem("cms_token");
      if (userStr && token) {
        setCurrentUser(JSON.parse(userStr));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  const getPortalPath = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "BRANCH_ADMIN":
      case "STAFF":
        return "/admin";
      case "TEACHER":
        return "/teacher";
      case "APPLICANT":
        return "/teacher/application-status";
      case "STUDENT":
        return "/student";
      default:
        return "/student";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Admin Portal";
      case "BRANCH_ADMIN":
        return "Campus Admin";
      case "TEACHER":
        return "Faculty Portal";
      case "APPLICANT":
        return "Application";
      case "STUDENT":
        return "Student Portal";
      case "STAFF":
        return "Staff Desk";
      default:
        return "Portal";
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchOrgData = async () => {
      try {
        const res = await fetch("/api/v1/public/landing");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setLandingData(json.data);
            if (json.data.organization) {
              setOrganization(json.data.organization);
              setDynamicFavicon(
                json.data.organization.faviconUrl || json.data.organization.logoUrl,
                json.data.organization.name,
                json.data.organization.logoUrl
              );
            }
            const branches = json.data.branches || [];
            const mb = branches.find((b: any) => b.isMainBranch) || branches[0] || null;
            if (mb) {
              setMainBranch(mb);
            }
          }
        }
      } catch (e) {
        console.warn("Could not load header branch info:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchOrgData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Prevent background scroll when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Scrollspy: Track active section on landing page
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = [
      "inquiry",
      "reviews",
      "tips",
      "faculty",
      "achievements",
      "results",
      "batches",
      "notices",
    ];

    const handleScroll = () => {
      if (window.scrollY < 200) {
        setActiveSection("");
        return;
      }

      const scrollPosition = window.scrollY + 220;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(id);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", href: "/", icon: GraduationCap },
    { label: "Notice Board", href: "/#notices", icon: BellRing },
    { label: "Available Batches", href: "/#batches", icon: Calendar },
    { label: "Teacher Panel", href: "/#faculty", icon: Users },
    { label: "Exam Standings", href: "/#results", icon: Trophy },
    { label: "Hall of Fame", href: "/#achievements", icon: Award },
    { label: "Study Tips", href: "/#tips", icon: BookOpen },
    { label: "Reviews", href: "/#reviews", icon: MessageSquare },
    { label: "Admission Inquiry", href: "/#inquiry", icon: Send },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "/" || href === "/#") {
      if (location.pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.location.hash) {
          window.history.pushState(null, "", "/");
        }
        setIsMobileMenuOpen(false);
        return;
      }
    } else if (href.startsWith("/#")) {
      if (location.pathname === "/") {
        e.preventDefault();
        const targetId = href.replace("/#", "");
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href);
        }
        setIsMobileMenuOpen(false);
        return;
      }
    }
    setIsMobileMenuOpen(false);
  };

  const contactPhone = mainBranch?.phone || organization?.phone;
  const contactEmail = mainBranch?.email || organization?.email;
  const campusAddress = mainBranch?.address || organization?.address;
  const whatsappTarget = organization?.whatsappNumber || contactPhone;

  return (
    <div className="min-h-screen flex flex-col bg-bg-app text-text-main antialiased selection:bg-brand-primary selection:text-white">
      {/* ========================================================================= */}
      {/* 1. POLISHED VERY TOP BAR (DYNAMIC FROM DATABASE / SKELETON WHILE LOADING) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-2 px-3 sm:px-6 lg:px-8 border-b border-slate-800 z-50">
        <div className="w-full max-w-[95vw] mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          {/* Left: Main Campus Location & Established Year (Unified Styling) */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            {isLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-16 h-4 bg-slate-800 rounded-xs" />
                <div className="w-48 h-4 bg-slate-800 rounded-xs" />
              </div>
            ) : (
              <>
                {campusAddress && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="max-w-[280px] sm:max-w-none truncate sm:overflow-visible">
                      {mainBranch?.isMainBranch ? "Main Campus" : mainBranch?.name || "Campus"}:{" "}
                      <strong className="text-white font-medium">{campusAddress}</strong>
                    </span>
                  </div>
                )}
                {organization?.establishedYear && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span>Est.</span>
                    <strong className="text-white font-medium">{organization.establishedYear}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Main Branch Phone & Mail (Clickable) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {isLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-24 h-4 bg-slate-800 rounded-xs" />
                <div className="w-28 h-4 bg-slate-800 rounded-xs" />
              </div>
            ) : (
              <>
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                    title="Call Campus"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="font-mono text-[11px]">{contactPhone}</span>
                  </a>
                )}
                {contactPhone && contactEmail && (
                  <span className="hidden sm:inline text-slate-700">|</span>
                )}
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                    title="Email Campus"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>{contactEmail}</span>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STICKY NAVBAR WITH BRAND, DESKTOP LINKS, THEME & BURGER MENU */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-accent shadow-xs">
        <div className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand Name */}
          <Link
            to="/"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                if (window.location.hash) {
                  window.history.pushState(null, "", "/");
                }
              }
            }}
            className="flex items-center gap-3 font-bold text-lg text-brand-primary shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-sm py-1"
          >
            {/* Unpadded Large Logo Container */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              {organization?.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name || "Logo"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-11 h-11 bg-brand-primary text-white flex items-center justify-center rounded-sm shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0 max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
              {organization?.name ? (
                <span className="tracking-tight text-text-main font-extrabold text-base sm:text-lg leading-tight line-clamp-1 sm:line-clamp-none">
                  {organization.name}
                </span>
              ) : isLoading ? (
                <div className="w-32 h-4 bg-accent rounded-xs animate-pulse my-0.5" />
              ) : (
                <span className="tracking-tight text-text-main font-extrabold text-base leading-tight">
                  Coaching Portal
                </span>
              )}
              {organization?.tagline ? (
                <span className="text-[10px] sm:text-[11px] text-text-muted font-normal uppercase tracking-wider break-words whitespace-normal leading-tight mt-0.5">
                  {organization.tagline}
                </span>
              ) : (
                <span className="text-[10px] text-text-muted font-normal uppercase tracking-wider">
                  Academic Portal
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links with Active Scroll Indicator */}
          <nav className="hidden xl:flex items-center gap-3.5 2xl:gap-5 text-xs font-semibold">
            {navLinks.map((item) => {
              const isActive =
                (item.href === "/" && !activeSection) || item.href === `/#${activeSection}`;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`py-1.5 transition-all whitespace-nowrap rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                    isActive
                      ? "text-brand-primary font-bold border-b-2 border-brand-primary"
                      : "text-text-muted hover:text-brand-primary border-b-2 border-transparent font-medium"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (Desktop only - in drawer for mobile & tablet) */}
            <button
              onClick={toggleTheme}
              className="hidden xl:inline-flex p-2 border border-accent rounded-sm hover:bg-accent transition-colors text-text-muted"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Active Session Portal CTA / Login button */}
            {currentUser ? (
              <Link
                to={getPortalPath(currentUser.role)}
                className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:bg-brand-hover transition-colors shadow-xs"
                title={`Signed in as ${currentUser.fullName} (${getRoleLabel(currentUser.role)})`}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-4 h-4 rounded-full object-cover border border-white/40"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                    {currentUser.fullName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span>My Portal</span>
                <span className="text-[10px] opacity-80 px-1 py-0.5 bg-black/20 rounded-xs font-normal">
                  {getRoleLabel(currentUser.role)}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:bg-brand-hover transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Burger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 border border-accent rounded-sm bg-surface hover:bg-accent transition-colors text-text-main"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-brand-primary transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE BURGER MENU OVERLAY & SLIDE-IN DRAWER (SMOOTH ANIMATION) */}
      {/* ========================================================================= */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 xl:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-surface border-l border-accent z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out xl:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header with Mobile Theme Switch */}
        <div className="p-4 border-b border-accent flex items-center justify-between bg-bg-app">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center rounded-sm shrink-0 overflow-hidden">
              {organization?.logoUrl ? (
                <img src={organization.logoUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-9 h-9 bg-brand-primary text-white flex items-center justify-center rounded-sm">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-text-main block truncate">
                {organization?.name || "Coaching Portal"}
              </span>
              <span className="text-[10px] text-text-muted break-words leading-tight block">
                {organization?.tagline || "Academic Portal"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 border border-accent rounded-sm text-text-muted hover:text-text-main hover:bg-accent transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 border border-accent rounded-sm text-text-muted hover:text-text-main hover:bg-accent transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-2 py-1">
            Quick Navigation
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.href === "/" && !activeSection) || item.href === `/#${activeSection}`;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`flex items-center justify-between p-2.5 rounded-sm text-xs font-semibold transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isActive
                    ? "bg-brand-primary/15 text-brand-primary font-bold"
                    : "text-text-main hover:bg-brand-primary/10 hover:text-brand-primary"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-brand-primary" : "text-text-muted group-hover:text-brand-primary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-all ${
                    isActive
                      ? "text-brand-primary"
                      : "text-text-muted/60 group-hover:text-brand-primary group-hover:translate-x-0.5"
                  }`}
                />
              </a>
            );
          })}

          <div className="pt-4 mt-2 border-t border-accent space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-2">
              {currentUser ? "Active Session" : "Student & Faculty Access"}
            </div>

            {currentUser ? (
              <div className="space-y-2">
                <div className="p-3 bg-surface border border-accent rounded-sm flex items-center gap-3">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-accent shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center shrink-0 text-sm">
                      {currentUser.fullName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-main truncate">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[11px] text-text-muted truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-1">
                      <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-xs bg-brand-primary/10 text-brand-primary">
                        {getRoleLabel(currentUser.role)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to={getPortalPath(currentUser.role)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-primary text-white rounded-sm font-bold text-xs hover:bg-brand-hover shadow-xs transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to My Portal</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Mobile Portal Login */}
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-primary text-white rounded-sm font-bold text-xs hover:bg-brand-hover shadow-xs transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-surface border border-accent text-text-main rounded-sm font-semibold text-xs hover:bg-accent transition-colors"
                >
                  <span>New Student Registration</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer / Main Branch Helpline */}
        <div className="p-4 border-t border-accent bg-bg-app space-y-2.5 text-xs">
          <div className="text-[11px] font-semibold text-text-main flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span className="truncate">{mainBranch?.name || organization?.name || "Campus Desk"}</span>
          </div>
          {campusAddress && (
            <div className="text-[11px] text-text-muted line-clamp-1">{campusAddress}</div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            {contactPhone ? (
              <a
                href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-surface border border-accent rounded-sm text-[11px] font-mono text-text-main hover:border-brand-primary transition-colors"
              >
                <Phone className="w-3 h-3 text-brand-primary" />
                <span>Call Campus</span>
              </a>
            ) : (
              <div />
            )}
            {whatsappTarget ? (
              <a
                href={`https://wa.me/${whatsappTarget.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600/10 border border-emerald-600/30 text-emerald-600 rounded-sm text-[11px] font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <div />
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1" key={location.pathname}>
        <Outlet context={{ landingData, isLoading }} />
      </main>
    </div>
  );
};
