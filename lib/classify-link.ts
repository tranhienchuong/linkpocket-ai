import type { Category } from "@/lib/types";

const CATEGORY_BY_DOMAIN: Array<{ domains: string[]; category: Category }> = [
  { domains: ["github.com", "stackoverflow.com"], category: "Code" },
  { domains: ["youtube.com", "youtu.be"], category: "Video" },
  { domains: ["docs.google.com", "drive.google.com"], category: "Study" },
  { domains: ["medium.com", "dev.to"], category: "Article" },
  {
    domains: ["tiktok.com", "facebook.com", "instagram.com"],
    category: "Social",
  },
  { domains: ["shopee.vn", "lazada.vn", "tiki.vn"], category: "Shopping" },
];

export function classifyLink(domain: string): Category {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  const match = CATEGORY_BY_DOMAIN.find(({ domains }) =>
    domains.some(
      (knownDomain) =>
        normalizedDomain === knownDomain ||
        normalizedDomain.endsWith(`.${knownDomain}`),
    ),
  );

  return match?.category ?? "Other";
}
