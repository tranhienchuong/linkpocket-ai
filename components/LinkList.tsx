"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import LinkCard, { type LinkCardUpdate } from "@/components/LinkCard";
import LinkForm from "@/components/LinkForm";
import SearchBar from "@/components/SearchBar";
import { cleanUrl } from "@/lib/clean-url";
import { classifyLink } from "@/lib/classify-link";
import { loadLinks, normalizeLinks, saveLinks } from "@/lib/storage";
import type { CategoryFilterValue, SavedLink } from "@/lib/types";

type Toast = {
  message: string;
  type: "success" | "error";
};

type LinkMetadataInput = Pick<
  SavedLink,
  "description" | "favicon" | "image" | "siteName"
>;

const INSTALL_HINT_KEY = "linkpocket-ai-install-hint-dismissed";

function parseTags(tags: string) {
  return Array.from(
    new Set(
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function getStats(links: SavedLink[]) {
  return {
    total: links.length,
    Code: links.filter((link) => link.category === "Code").length,
    Study: links.filter((link) => link.category === "Study").length,
    Video: links.filter((link) => link.category === "Video").length,
    Article: links.filter((link) => link.category === "Article").length,
  };
}

export default function LinkList() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [clientReady, setClientReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilterValue>("All");
  const [toast, setToast] = useState<Toast | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLinks(loadLinks());
    setIsOnline(navigator.onLine);
    setShowInstallHint(
      window.localStorage.getItem(INSTALL_HINT_KEY) !== "true" &&
        !window.matchMedia("(display-mode: standalone)").matches,
    );
    setClientReady(true);
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setToast({ message: "Back online.", type: "success" });
    }

    function handleOffline() {
      setIsOnline(false);
      setToast({
        message: "Offline mode. Saved links still work.",
        type: "error",
      });
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!clientReady) {
      return;
    }

    saveLinks(links);
  }, [clientReady, links]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const stats = useMemo(() => getStats(links), [links]);

  const filteredLinks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return links.filter((link) => {
      const matchesCategory = category === "All" || link.category === category;
      const matchesSearch =
        !normalizedSearch ||
        link.title.toLowerCase().includes(normalizedSearch) ||
        link.description?.toLowerCase().includes(normalizedSearch) ||
        link.siteName?.toLowerCase().includes(normalizedSearch) ||
        link.domain.toLowerCase().includes(normalizedSearch) ||
        link.url.toLowerCase().includes(normalizedSearch) ||
        link.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [category, links, searchQuery]);

  function showToast(message: string, type: Toast["type"] = "success") {
    setToast({ message, type });
  }

  function handleAddLink(input: {
    rawUrl: string;
    title: string;
    note: string;
    tags: string;
    metadata: LinkMetadataInput;
  }) {
    try {
      const { cleanUrl: normalizedUrl, domain } = cleanUrl(input.rawUrl);
      const title = input.title.trim() || domain;

      const nextLink: SavedLink = {
        id: crypto.randomUUID(),
        title,
        domain,
        category: classifyLink(domain),
        url: normalizedUrl,
        note: input.note.trim(),
        tags: parseTags(input.tags),
        description: input.metadata.description,
        favicon: input.metadata.favicon,
        image: input.metadata.image,
        siteName: input.metadata.siteName,
        createdAt: new Date().toISOString(),
      };

      setLinks((currentLinks) => [nextLink, ...currentLinks]);
      showToast("Link saved.");
    } catch {
      showToast("Please enter a valid http or https URL.", "error");
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Clean URL copied.");
    } catch {
      showToast("Copy failed. Open the link and copy it manually.", "error");
    }
  }

  function handleDelete(id: string) {
    setLinks((currentLinks) => currentLinks.filter((link) => link.id !== id));
    showToast("Link deleted.");
  }

  function handleUpdate(id: string, update: LinkCardUpdate) {
    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === id
          ? {
              ...link,
              title: update.title,
              category: update.category,
              note: update.note,
              tags: update.tags,
            }
          : link,
      ),
    );
    showToast("Link updated.");
  }

  function handleClearAll() {
    setLinks([]);
    setSearchQuery("");
    setCategory("All");
    showToast("All links cleared.");
  }

  function handleExport() {
    try {
      const blob = new Blob([JSON.stringify(links, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `linkpocket-ai-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast("Export JSON started.");
    } catch {
      showToast("Export failed.", "error");
    }
  }

  function handleDismissInstallHint() {
    window.localStorage.setItem(INSTALL_HINT_KEY, "true");
    setShowInstallHint(false);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const importedLinks = normalizeLinks(JSON.parse(text));
      const importedByUrl = new Map<string, SavedLink>();

      for (const link of importedLinks) {
        importedByUrl.set(link.url, link);
      }

      setLinks((currentLinks) => {
        const existingUrls = new Set(currentLinks.map((link) => link.url));
        const newLinks = Array.from(importedByUrl.values()).filter(
          (link) => !existingUrls.has(link.url),
        );

        return [...newLinks, ...currentLinks];
      });

      showToast(`Imported ${importedByUrl.size} links.`);
    } catch {
      showToast("Import failed. Choose a valid LinkPocket JSON file.", "error");
    }
  }

  const hasFilters = searchQuery.trim() !== "" || category !== "All";
  const emptyTitle = links.length === 0 ? "Your pocket is empty" : "No matches";
  const emptyText =
    links.length === 0
      ? "Save your first clean link with a note and tags."
      : "Try another search term or switch category.";

  return (
    <section className="space-y-5">
      <LinkForm
        isOnline={isOnline}
        onSubmit={handleAddLink}
        onPreviewError={(message) => showToast(message, "error")}
        onPreviewSuccess={showToast}
      />

      {clientReady && !isOnline && (
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-100">
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          Offline mode
        </div>
      )}

      {clientReady && showInstallHint && (
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-cyan-100">
                Add to Home Screen
              </p>
              <p className="text-sm leading-6 text-zinc-400">
                Install LinkPocket for a full-screen mobile app that opens your
                saved links offline.
              </p>
            </div>
            <button
              className="h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-zinc-300"
              type="button"
              onClick={handleDismissInstallHint}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {[
          ["Total", stats.total],
          ["Code", stats.Code],
          ["Study", stats.Study],
          ["Video", stats.Video],
          ["Article", stats.Article],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-white/[0.045] px-2 py-3 text-center"
          >
            <div className="text-lg font-semibold text-white">{value}</div>
            <div className="mt-1 text-[11px] font-medium text-zinc-500">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          className="h-11 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={handleExport}
          disabled={links.length === 0}
        >
          Export JSON
        </button>
        <button
          className="h-11 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/50"
          type="button"
          onClick={() => importInputRef.current?.click()}
        >
          Import JSON
        </button>
        <button
          className="h-11 rounded-lg border border-red-300/20 bg-red-300/10 px-3 text-xs font-medium text-red-100 transition hover:border-red-300/50 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={handleClearAll}
          disabled={links.length === 0}
        >
          Clear all
        </button>
        <input
          ref={importInputRef}
          className="hidden"
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {filteredLinks.length} of {links.length} links
        </p>
        {hasFilters && (
          <button
            className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs font-medium text-zinc-300"
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCategory("All");
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {filteredLinks.length > 0 ? (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.02)_100%)] px-5 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-lg font-semibold text-cyan-100">
            LP
          </div>
          <p className="mt-4 text-base font-semibold text-zinc-100">
            {emptyTitle}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
            {emptyText}
          </p>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border px-4 py-3 text-sm shadow-[0_20px_70px_rgba(0,0,0,0.55)] ${
            toast.type === "error"
              ? "border-red-300/30 bg-red-950/95 text-red-100"
              : "border-cyan-300/30 bg-[#07141b]/95 text-cyan-100"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}
