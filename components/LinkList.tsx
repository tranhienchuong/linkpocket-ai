"use client";

import { useEffect, useMemo, useState } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import LinkCard from "@/components/LinkCard";
import LinkForm from "@/components/LinkForm";
import SearchBar from "@/components/SearchBar";
import { cleanUrl } from "@/lib/clean-url";
import { classifyLink } from "@/lib/classify-link";
import { loadLinks, saveLinks } from "@/lib/storage";
import type { CategoryFilterValue, SavedLink } from "@/lib/types";

export default function LinkList() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilterValue>("All");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    setLinks(loadLinks());
  }, []);

  useEffect(() => {
    saveLinks(links);
  }, [links]);

  const filteredLinks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return links.filter((link) => {
      const matchesCategory = category === "All" || link.category === category;
      const matchesSearch =
        !normalizedSearch ||
        link.title.toLowerCase().includes(normalizedSearch) ||
        link.domain.toLowerCase().includes(normalizedSearch) ||
        link.url.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [category, links, searchQuery]);

  function handleAddLink(input: { rawUrl: string; title: string }) {
    setError("");
    setCopyStatus("");

    try {
      const { cleanUrl: normalizedUrl, domain } = cleanUrl(input.rawUrl);
      const title = input.title.trim() || domain;

      const nextLink: SavedLink = {
        id: crypto.randomUUID(),
        title,
        domain,
        category: classifyLink(domain),
        url: normalizedUrl,
        createdAt: new Date().toISOString(),
      };

      setLinks((currentLinks) => [nextLink, ...currentLinks]);
    } catch {
      setError("Please enter a valid http or https URL before saving.");
    }
  }

  async function handleCopy(url: string) {
    setError("");

    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Copied clean URL.");
    } catch {
      setCopyStatus("");
      setError("Copy failed. Open the link and copy it from your browser.");
    }
  }

  function handleDelete(id: string) {
    setLinks((currentLinks) => currentLinks.filter((link) => link.id !== id));
  }

  function handleClearAll() {
    setLinks([]);
    setSearchQuery("");
    setCategory("All");
    setError("");
    setCopyStatus("");
  }

  return (
    <section className="space-y-5">
      <LinkForm onSubmit={handleAddLink} />

      {(error || copyStatus) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-300/30 bg-red-300/10 text-red-100"
              : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
          }`}
        >
          {error || copyStatus}
        </div>
      )}

      <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {filteredLinks.length} of {links.length} links
        </p>
        <button
          className="h-10 rounded-lg border border-red-300/20 bg-red-300/10 px-3 text-xs font-medium text-red-100 transition hover:border-red-300/50 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={handleClearAll}
          disabled={links.length === 0}
        >
          Clear all
        </button>
      </div>

      {filteredLinks.length > 0 ? (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onCopy={handleCopy}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.03] px-4 py-10 text-center">
          <p className="text-sm font-medium text-zinc-300">No links found</p>
          <p className="mt-2 text-sm text-zinc-500">
            Paste a URL above or adjust search and category filters.
          </p>
        </div>
      )}
    </section>
  );
}
