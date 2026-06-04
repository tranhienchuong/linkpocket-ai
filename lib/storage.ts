import type { SavedLink } from "@/lib/types";

const STORAGE_KEY = "linkpocket-ai-links";

export function loadLinks(): SavedLink[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawLinks = window.localStorage.getItem(STORAGE_KEY);
    if (!rawLinks) {
      return [];
    }

    const parsedLinks = JSON.parse(rawLinks);
    return Array.isArray(parsedLinks) ? parsedLinks : [];
  } catch {
    return [];
  }
}

export function saveLinks(links: SavedLink[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}
