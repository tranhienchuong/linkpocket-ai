export const CATEGORIES = [
  "All",
  "Code",
  "Video",
  "Study",
  "Article",
  "Social",
  "Shopping",
  "Other",
] as const;

export const LINK_CATEGORIES = CATEGORIES.filter(
  (category) => category !== "All",
) as Category[];

export type Category = Exclude<(typeof CATEGORIES)[number], "All">;
export type CategoryFilterValue = (typeof CATEGORIES)[number];

export type SavedLink = {
  id: string;
  title: string;
  domain: string;
  category: Category;
  url: string;
  note: string;
  tags: string[];
  description?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
  summary?: string;
  suggestedTags?: string[];
  suggestedNote?: string;
  usefulness?: string;
  createdAt: string;
};
