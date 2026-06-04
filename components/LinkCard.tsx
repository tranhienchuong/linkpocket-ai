import { FormEvent, useState } from "react";
import {
  LINK_CATEGORIES,
  type Category,
  type SavedLink,
} from "@/lib/types";

type LinkCardProps = {
  link: SavedLink;
  isOnline: boolean;
  isSummarizing: boolean;
  onCopy: (url: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, update: LinkCardUpdate) => void;
  onSummarize: (link: SavedLink) => void;
};

export type LinkCardUpdate = Partial<
  Pick<
    SavedLink,
    | "title"
    | "category"
    | "note"
    | "tags"
    | "summary"
    | "suggestedTags"
    | "suggestedNote"
    | "usefulness"
  >
>;

const CATEGORY_STYLES: Record<SavedLink["category"], string> = {
  Code: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  Video: "border-red-300/30 bg-red-300/10 text-red-100",
  Study: "border-blue-300/30 bg-blue-300/10 text-blue-100",
  Article: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Social: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
  Shopping: "border-lime-300/30 bg-lime-300/10 text-lime-100",
  Other: "border-zinc-300/20 bg-zinc-300/10 text-zinc-200",
};

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

export default function LinkCard({
  link,
  isOnline,
  isSummarizing,
  onCopy,
  onDelete,
  onUpdate,
  onSummarize,
}: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [category, setCategory] = useState<Category>(link.category);
  const [note, setNote] = useState(link.note);
  const [tags, setTags] = useState(link.tags.join(", "));
  const [imageFailed, setImageFailed] = useState(false);
  const createdDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(link.createdAt));

  function handleCancel() {
    setTitle(link.title);
    setCategory(link.category);
    setNote(link.note);
    setTags(link.tags.join(", "));
    setIsEditing(false);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdate(link.id, {
      title: title.trim() || link.domain,
      category,
      note: note.trim(),
      tags: parseTags(tags),
    });
    setIsEditing(false);
  }

  function handleApplySuggestedTags() {
    const suggestedTags = link.suggestedTags ?? [];
    const mergedTags = Array.from(new Set([...link.tags, ...suggestedTags]));
    onUpdate(link.id, { tags: mergedTags });
  }

  function handleApplySuggestedNote() {
    if (!link.suggestedNote) {
      return;
    }

    onUpdate(link.id, { note: link.suggestedNote });
  }

  if (isEditing) {
    return (
      <article className="glass-panel-strong rounded-lg p-4">
        <form className="space-y-3" onSubmit={handleSave}>
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <label className="block">
              <span className="field-label">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="form-control h-12 px-4 text-sm"
                type="text"
              />
            </label>
            <label className="block">
              <span className="field-label">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className="form-control h-12 px-3 text-sm"
              >
                {LINK_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="field-label">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="form-control min-h-20 resize-none px-4 py-3 text-sm"
              maxLength={220}
            />
          </label>
          <label className="block">
            <span className="field-label">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="form-control h-12 px-4 text-sm"
              type="text"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="button-secondary h-11 text-sm"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="button-primary h-11 text-sm"
              type="submit"
            >
              Save edit
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="glass-panel ambient-lift rounded-lg p-4">
      {link.image && !imageFailed && (
        <img
          src={link.image}
          alt=""
          className="mb-3 aspect-[16/9] w-full rounded-lg border border-white/10 object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            {link.favicon && (
              <img
                src={link.favicon}
                alt=""
                className="h-4 w-4 shrink-0 rounded-sm"
                loading="lazy"
              />
            )}
            <p className="truncate text-xs font-medium text-zinc-500">
              {link.siteName || link.domain}
            </p>
          </div>
          <h2 className="break-words text-base font-semibold leading-6 text-white">
            {link.title}
          </h2>
          {link.siteName && (
            <p className="truncate text-sm text-zinc-500">{link.domain}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLES[link.category]}`}
        >
          {link.category}
        </span>
      </div>

      {link.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
          {link.description}
        </p>
      )}

      {link.note && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-5 text-zinc-300">
          {link.note}
        </p>
      )}

      {(link.summary || link.usefulness || link.suggestedTags?.length) && (
        <div className="mt-3 space-y-3 rounded-lg border border-violet-300/20 bg-violet-300/[0.07] p-3">
          {link.summary && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-violet-200">
                AI Summary
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-200">
                {link.summary}
              </p>
            </div>
          )}

          {link.usefulness && (
            <p className="text-sm leading-6 text-zinc-300">
              <span className="font-medium text-violet-100">Useful: </span>
              {link.usefulness}
            </p>
          )}

          {link.suggestedTags && link.suggestedTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {link.suggestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-violet-300/25 bg-violet-300/10 px-2 py-1 text-xs text-violet-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <button
                className="h-10 rounded-lg border border-violet-300/25 bg-violet-300/10 px-3 text-xs font-semibold text-violet-100 transition hover:border-violet-300/50"
                type="button"
                onClick={handleApplySuggestedTags}
              >
                Apply suggested tags
              </button>
            </div>
          )}

          {link.suggestedNote && (
            <button
              className="h-10 rounded-lg border border-violet-300/25 bg-violet-300/10 px-3 text-xs font-semibold text-violet-100 transition hover:border-violet-300/50"
              type="button"
              onClick={handleApplySuggestedNote}
            >
              Apply suggested note
            </button>
          )}
        </div>
      )}

      {link.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {link.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block break-all rounded-lg border border-white/10 bg-black/25 p-3 font-mono text-xs leading-5 text-cyan-100 transition hover:border-cyan-300/50"
      >
        {link.url}
      </a>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <time className="text-xs text-zinc-500" dateTime={link.createdAt}>
          {createdDate}
        </time>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            className="h-11 rounded-lg border border-violet-300/20 bg-violet-300/10 px-2 text-xs font-semibold text-violet-100 transition hover:border-violet-300/50 disabled:opacity-45"
            type="button"
            onClick={() => onSummarize(link)}
            disabled={!isOnline || isSummarizing}
          >
            {isSummarizing ? "Summarizing" : "AI Summary"}
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary h-11 px-2 py-3 text-center text-xs"
          >
            Open
          </a>
          <button
            className="button-secondary h-11 px-2 text-xs"
            type="button"
            onClick={() => onCopy(link.url)}
          >
            Copy
          </button>
          <button
            className="button-secondary h-11 px-2 text-xs"
            type="button"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <button
            className="button-danger h-11 px-2 text-xs"
            type="button"
            onClick={() => onDelete(link.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
