import type { SavedLink } from "@/lib/types";

type LinkCardProps = {
  link: SavedLink;
  onCopy: (url: string) => void;
  onDelete: (id: string) => void;
};

const CATEGORY_STYLES: Record<SavedLink["category"], string> = {
  Code: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  Video: "border-red-300/30 bg-red-300/10 text-red-100",
  Study: "border-blue-300/30 bg-blue-300/10 text-blue-100",
  Article: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Social: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
  Shopping: "border-lime-300/30 bg-lime-300/10 text-lime-100",
  Other: "border-zinc-300/20 bg-zinc-300/10 text-zinc-200",
};

export default function LinkCard({ link, onCopy, onDelete }: LinkCardProps) {
  const createdDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(link.createdAt));

  return (
    <article className="rounded-lg border border-white/10 bg-[#0d111c]/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="break-words text-lg font-semibold leading-6 text-white">
            {link.title}
          </h2>
          <p className="truncate text-sm text-zinc-500">{link.domain}</p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium ${CATEGORY_STYLES[link.category]}`}
        >
          {link.category}
        </span>
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block break-all rounded-lg border border-white/10 bg-black/25 p-3 font-mono text-xs leading-5 text-cyan-100 transition hover:border-cyan-300/50"
      >
        {link.url}
      </a>

      <div className="mt-4 flex items-center justify-between gap-3">
        <time className="text-xs text-zinc-500" dateTime={link.createdAt}>
          {createdDate}
        </time>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-center text-xs font-medium text-zinc-100 transition hover:border-cyan-300/50"
          >
            Open
          </a>
          <button
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-cyan-300/50"
            type="button"
            onClick={() => onCopy(link.url)}
          >
            Copy
          </button>
          <button
            className="rounded-lg border border-red-300/20 bg-red-300/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:border-red-300/50"
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
