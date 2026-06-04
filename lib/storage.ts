import { LINK_CATEGORIES, type SavedLink } from "@/lib/types";

const STORAGE_KEY = "linkpocket-ai-links";

type ImportedSavedLink = Omit<SavedLink, "note" | "tags"> &
  Partial<
    Pick<
      SavedLink,
      | "note"
      | "tags"
      | "description"
      | "favicon"
      | "image"
      | "siteName"
      | "summary"
      | "suggestedTags"
      | "suggestedNote"
      | "usefulness"
    >
  >;

function isSavedLinkLike(value: unknown): value is ImportedSavedLink {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedLink>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.domain === "string" &&
    typeof candidate.category === "string" &&
    LINK_CATEGORIES.includes(candidate.category) &&
    typeof candidate.url === "string" &&
    typeof candidate.createdAt === "string"
  );
}

export function normalizeLinks(value: unknown): SavedLink[] {
  if (!Array.isArray(value)) {
    throw new Error("Imported JSON must be an array of saved links.");
  }

  return value.map((item) => {
    if (!isSavedLinkLike(item)) {
      throw new Error("Imported JSON contains invalid link data.");
    }

    try {
      const parsedUrl = new URL(item.url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid URL protocol.");
      }
    } catch {
      throw new Error("Imported JSON contains an invalid URL.");
    }

    return {
      id: item.id,
      title: item.title,
      domain: item.domain,
      category: item.category,
      url: item.url,
      note: typeof item.note === "string" ? item.note : "",
      tags: Array.isArray(item.tags)
        ? item.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      description:
        typeof item.description === "string" ? item.description : undefined,
      favicon: typeof item.favicon === "string" ? item.favicon : undefined,
      image: typeof item.image === "string" ? item.image : undefined,
      siteName: typeof item.siteName === "string" ? item.siteName : undefined,
      summary: typeof item.summary === "string" ? item.summary : undefined,
      suggestedTags: Array.isArray(item.suggestedTags)
        ? item.suggestedTags.filter(
            (tag): tag is string => typeof tag === "string",
          )
        : undefined,
      suggestedNote:
        typeof item.suggestedNote === "string" ? item.suggestedNote : undefined,
      usefulness:
        typeof item.usefulness === "string" ? item.usefulness : undefined,
      createdAt: item.createdAt,
    };
  });
}

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
    return normalizeLinks(parsedLinks);
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
