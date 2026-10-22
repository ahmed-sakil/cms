/**
 * Dynamic Favicon and Page Title Manager
 * Keeps browser tab favicon, branding, and dynamic title updated across all routes.
 */

const STORAGE_FAVICON_KEY = "cms_cached_favicon";
const STORAGE_ORG_NAME_KEY = "cms_cached_org_name";
const STORAGE_LOGO_KEY = "cms_cached_logo";

/**
 * Sets the browser favicon to the specified icon or logo URL.
 * Automatically removes SVG type restriction to allow PNG/JPG/WEBP/ICO uploads.
 */
export function setDynamicFavicon(
  faviconUrl?: string | null,
  institutionName?: string | null,
  logoUrl?: string | null
) {
  if (typeof document === "undefined") return;

  const effectiveIcon = faviconUrl?.trim() || logoUrl?.trim();

  if (effectiveIcon) {
    try {
      localStorage.setItem(STORAGE_FAVICON_KEY, effectiveIcon);
      if (institutionName?.trim()) {
        localStorage.setItem(STORAGE_ORG_NAME_KEY, institutionName.trim());
      }
      if (logoUrl?.trim()) {
        localStorage.setItem(STORAGE_LOGO_KEY, logoUrl.trim());
      }
    } catch {
      // LocalStorage might be restricted
    }

    // Update or create standard icon links
    const selectors = ["link[rel='icon']", "link[rel='shortcut icon']", "link#app-favicon"];
    let link = document.querySelector<HTMLLinkElement>(selectors.join(", "));

    if (!link) {
      link = document.createElement("link");
      link.id = "app-favicon";
      link.rel = "icon";
      document.head.appendChild(link);
    }

    // Remove fixed SVG type so that arbitrary image formats (PNG, JPG, ICO) render
    link.removeAttribute("type");
    if (effectiveIcon.endsWith(".svg")) {
      link.setAttribute("type", "image/svg+xml");
    } else if (effectiveIcon.endsWith(".png")) {
      link.setAttribute("type", "image/png");
    } else if (effectiveIcon.endsWith(".ico")) {
      link.setAttribute("type", "image/x-icon");
    }

    // Force refresh in browser by setting href
    link.href = effectiveIcon;

    // Also update apple-touch-icon if present or create it
    let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }
    appleLink.href = effectiveIcon;
  }
}

/**
 * Returns a clean, descriptive page title based on the active path and institution name.
 */
export function getRouteTitle(pathname: string, institutionName?: string): string {
  const org = institutionName?.trim() || getCachedOrgName() || "Apex Coaching";

  // Public Marketing Routes
  if (pathname === "/" || pathname === "") {
    return `${org} | Leading Coaching, Model Exams & Academic Care`;
  }
  if (pathname.startsWith("/batches/") && pathname.endsWith("/planner")) {
    return `Curriculum Planner | ${org}`;
  }
  if (pathname.startsWith("/batches/")) {
    return `Batch Details & Routine | ${org}`;
  }
  if (pathname.startsWith("/tips/") || pathname.startsWith("/faculty-tips/")) {
    return `Faculty Study Guide | ${org}`;
  }
  if (pathname === "/reviews" || pathname === "/testimonials") {
    return `Parents & Students Reviews & Advice | ${org}`;
  }
  if (pathname === "/login") {
    return `Sign In to Portal | ${org}`;
  }
  if (pathname === "/register") {
    return `Student Admission Registration | ${org}`;
  }

  // Admin Routes
  if (pathname === "/admin") {
    return `Dashboard Overview | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/students") {
    return `Students Directory | Admin Portal | ${org}`;
  }
  if (pathname.startsWith("/admin/students/") && pathname.endsWith("/admit")) {
    return `Batch Admission Desk | Admin Portal | ${org}`;
  }
  if (pathname.startsWith("/admin/students/")) {
    return `Student Profile Record | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/teachers") {
    return `Faculty & Staff Members | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/batches") {
    return `Batches & Classrooms | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/courses") {
    return `Courses & Curriculums | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/materials") {
    return `Study Materials Repository | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/exams") {
    return `Exams & Results Standings | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/achievements") {
    return `Hall of Fame & Achievements | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/faculty-tips") {
    return `Faculty Tips & Guides Management | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/reviews") {
    return `Reviews & Feedback Moderation | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/notices") {
    return `Notice Board | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/fees") {
    return `Accounts & Fee Collections | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/expenses") {
    return `Campus Expenses & Accounts | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/referrals") {
    return `Referral Payouts & Codes | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/branches") {
    return `Campuses & Branches | Admin Portal | ${org}`;
  }
  if (pathname === "/admin/settings") {
    return `Organisation Settings & Branding | Admin Portal | ${org}`;
  }

  // Student Routes
  if (pathname === "/student") {
    return `Student Portal Dashboard | ${org}`;
  }
  if (pathname === "/student/materials") {
    return `Class Notes & Materials | ${org}`;
  }
  if (pathname === "/student/fees") {
    return `Fee Invoices & Receipts | ${org}`;
  }
  if (pathname === "/student/exams") {
    return `My Model Exams & Results | ${org}`;
  }
  if (pathname === "/student/referrals") {
    return `Student Referral Program | ${org}`;
  }
  if (pathname === "/student/profile") {
    return `My Profile & Guardian Info | ${org}`;
  }

  return `${org} | Coaching Management System`;
}

/**
 * Updates document.title dynamically based on path and institution name.
 */
export function setDynamicPageTitle(pathname: string, customTitle?: string, institutionName?: string) {
  if (typeof document === "undefined") return;

  if (customTitle && customTitle.trim()) {
    const org = institutionName?.trim() || getCachedOrgName() || "Apex Coaching";
    document.title = `${customTitle.trim()} | ${org}`;
  } else {
    document.title = getRouteTitle(pathname, institutionName);
  }
}

export function getCachedOrgName(): string | null {
  try {
    return localStorage.getItem(STORAGE_ORG_NAME_KEY);
  } catch {
    return null;
  }
}

export function getCachedFavicon(): string | null {
  try {
    return localStorage.getItem(STORAGE_FAVICON_KEY) || localStorage.getItem(STORAGE_LOGO_KEY);
  } catch {
    return null;
  }
}

/**
 * Bootstraps branding immediately on app boot from cache or public API.
 */
export async function initializeBranding() {
  if (typeof window === "undefined") return;

  // 1. Immediately apply cached values so there's zero flash
  const cachedFav = getCachedFavicon();
  const cachedOrg = getCachedOrgName();
  if (cachedFav) {
    setDynamicFavicon(cachedFav, cachedOrg);
  }
  setDynamicPageTitle(window.location.pathname, undefined, cachedOrg || undefined);

  // 2. Fetch fresh values from public API
  try {
    const res = await fetch("/api/v1/public/landing");
    const json = await res.json();
    if (res.ok && json.success && json.data?.organization) {
      const org = json.data.organization;
      const effectiveFavicon = org.faviconUrl || org.logoUrl || org.logo;
      setDynamicFavicon(effectiveFavicon, org.name, org.logoUrl || org.logo);
      setDynamicPageTitle(window.location.pathname, undefined, org.name);
    }
  } catch {
    // Silently fall back to cached values
  }
}
