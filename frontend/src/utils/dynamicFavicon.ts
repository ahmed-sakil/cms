/**
 * Dynamically updates the browser favicon and document title based on institution settings.
 */
export function setDynamicFavicon(faviconUrl?: string | null, institutionName?: string | null) {
  if (typeof document === "undefined") return;

  if (faviconUrl && faviconUrl.trim()) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl.trim();
  }

  if (institutionName && institutionName.trim()) {
    const currentTitle = document.title;
    const baseSuffix = "Coaching Management System";
    if (!currentTitle || currentTitle === baseSuffix) {
      document.title = `${institutionName.trim()} | ${baseSuffix}`;
    }
  }
}
