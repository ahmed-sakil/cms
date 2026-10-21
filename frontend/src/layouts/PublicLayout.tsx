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
  Clock,
  BellRing,
  Trophy,
  BookOpen,
  MessageSquare,
  Building2,
  Send,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../lib/theme.js";

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

  const navLinks = [
    { label: "Home", href: "/", icon: GraduationCap },
    { label: "Notice Board", href: "/#notices", icon: BellRing },
    { label: "Available Batches", href: "/#batches", icon: Calendar },
    { label: "Upcoming Batches", href: "/#upcoming", icon: Clock },
    { label: "Exam Standings", href: "/#results", icon: Trophy },
    { label: "Hall of Fame", href: "/#achievements", icon: Award },
    { label: "Study Tips", href: "/#tips", icon: BookOpen },
    { label: "Reviews", href: "/#reviews", icon: MessageSquare },
    { label: "Branches", href: "/#inquiry", icon: Building2 },
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
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          {/* Left: Established Badge & Main Branch Location */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            {isLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-16 h-4 bg-slate-800 rounded-xs" />
                <div className="w-48 h-4 bg-slate-800 rounded-xs" />
              </div>
            ) : (
              <>
                {organization?.establishedYear && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-brand-primary/20 text-brand-primary font-bold text-[10px] sm:text-[11px] tracking-wide border border-brand-primary/30">
                    <Award className="w-3.5 h-3.5" />
                    Est. {organization.establishedYear}
                  </span>
                )}
                {campusAddress && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">
                      {mainBranch?.isMainBranch ? "Main Campus" : mainBranch?.name || "Campus"}:{" "}
                      <strong className="text-white font-medium">{campusAddress}</strong>
                    </span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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
            className="flex items-center gap-2.5 font-bold text-lg text-brand-primary shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-sm"
          >
            <div className="w-9 h-9 bg-brand-primary text-white flex items-center justify-center rounded-sm shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
              {organization?.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name || "Logo"}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col">
              {organization?.name ? (
                <span className="tracking-tight text-text-main font-extrabold text-base leading-tight">
                  {organization.name}
                </span>
              ) : isLoading ? (
                <div className="w-28 h-4 bg-accent rounded-xs animate-pulse my-0.5" />
              ) : (
                <span className="tracking-tight text-text-main font-extrabold text-base leading-tight">
                  Coaching Portal
                </span>
              )}
              {organization?.tagline ? (
                <span className="text-[10px] text-text-muted font-normal uppercase tracking-wider truncate max-w-[220px]">
                  {organization.tagline}
                </span>
              ) : (
                <span className="text-[10px] text-text-muted font-normal uppercase tracking-wider">
                  Academic Portal
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold">
            {navLinks.slice(0, 7).map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-text-muted hover:text-brand-primary transition-colors py-1 hover:border-b-2 hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xs"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/#reviews"
              onClick={(e) => handleNavClick(e, "/#reviews")}
              className="text-text-muted hover:text-brand-primary transition-colors py-1 hover:border-b-2 hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xs"
            >
              Reviews
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 border border-accent rounded-sm hover:bg-accent transition-colors text-text-muted"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Portal Login (Visible on tablet & desktop) */}
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-sm hover:bg-brand-hover transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal Login</span>
            </Link>

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
        {/* Drawer Header */}
        <div className="p-4 border-b border-accent flex items-center justify-between bg-bg-app">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary text-white flex items-center justify-center rounded-sm shrink-0 overflow-hidden">
              {organization?.logoUrl ? (
                <img src={organization.logoUrl} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <GraduationCap className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-text-main block truncate">
                {organization?.name || "Coaching Portal"}
              </span>
              <span className="text-[10px] text-text-muted truncate block">
                {organization?.establishedYear ? `Est. ${organization.establishedYear} • ` : ""}
                Academic Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 border border-accent rounded-sm text-text-muted hover:text-text-main hover:bg-accent transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-2 py-1">
            Quick Navigation
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="flex items-center justify-between p-2.5 rounded-sm text-xs font-semibold text-text-main hover:bg-brand-primary/10 hover:text-brand-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted/60 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
              </a>
            );
          })}

          <div className="pt-4 mt-2 border-t border-accent space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-2">
              Student & Faculty Access
            </div>
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-primary text-white rounded-sm font-bold text-xs hover:bg-brand-hover shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Portal</span>
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-surface border border-accent text-text-main rounded-sm font-semibold text-xs hover:bg-accent transition-colors"
            >
              <span>New Student Registration</span>
            </Link>
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
      {/* 4. MAIN CONTENT AREA (NO PREVIOUS REDUNDANT FOOTER) */}
      {/* ========================================================================= */}
      <main className="flex-1 animate-page-enter" key={location.pathname}>
        <Outlet context={{ landingData, isLoading }} />
      </main>
    </div>
  );
};
