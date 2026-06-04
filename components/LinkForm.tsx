import { FormEvent, useState } from "react";

type PreviewMetadata = {
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
};

type LinkFormProps = {
  isOnline: boolean;
  onSubmit: (input: {
    rawUrl: string;
    title: string;
    note: string;
    tags: string;
    metadata: PreviewMetadata;
  }) => void;
  onPreviewError: (message: string) => void;
  onPreviewSuccess: (message: string) => void;
};

export default function LinkForm({
  isOnline,
  onSubmit,
  onPreviewError,
  onPreviewSuccess,
}: LinkFormProps) {
  const [rawUrl, setRawUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [metadata, setMetadata] = useState<PreviewMetadata>({});
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ rawUrl, title, note, tags, metadata });
    setRawUrl("");
    setTitle("");
    setNote("");
    setTags("");
    setMetadata({});
    setPreviewError("");
  }

  async function handleFetchPreview() {
    setPreviewError("");

    if (!isOnline) {
      const message = "Preview needs internet. You can still save links offline.";
      setPreviewError(message);
      onPreviewError(message);
      return;
    }

    setIsFetchingPreview(true);

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: rawUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Could not fetch preview metadata.",
        );
      }

      const nextMetadata: PreviewMetadata = {
        title: typeof data.title === "string" ? data.title : undefined,
        description:
          typeof data.description === "string" ? data.description : undefined,
        favicon: typeof data.favicon === "string" ? data.favicon : undefined,
        image: typeof data.image === "string" ? data.image : undefined,
        siteName: typeof data.siteName === "string" ? data.siteName : undefined,
      };

      setMetadata(nextMetadata);
      if (!title.trim() && nextMetadata.title) {
        setTitle(nextMetadata.title);
      }
      onPreviewSuccess("Preview fetched.");
    } catch (error) {
      const message =
        !isOnline || error instanceof TypeError
          ? "Preview needs internet. You can still save links offline."
          : error instanceof Error
            ? error.message
            : "Could not fetch preview metadata.";
      setPreviewError(message);
      onPreviewError(message);
    } finally {
      setIsFetchingPreview(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/10 bg-white/[0.05] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.38)]"
    >
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-normal text-zinc-500">
          Paste URL
        </span>
        <input
          value={rawUrl}
          onChange={(event) => setRawUrl(event.target.value)}
          placeholder="https://example.com/post?utm_source=..."
          className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
          inputMode="url"
          type="url"
          required
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <button
          className="h-11 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={handleFetchPreview}
          disabled={isFetchingPreview || rawUrl.trim() === "" || !isOnline}
          title={!isOnline ? "Preview requires an internet connection." : undefined}
        >
          {!isOnline
            ? "Preview offline"
            : isFetchingPreview
              ? "Fetching..."
              : "Get Preview"}
        </button>
        {!isOnline ? (
          <p className="text-xs leading-5 text-amber-100/80">
            Preview fetch is paused until you are online.
          </p>
        ) : (metadata.description || metadata.image || metadata.favicon) && (
          <p className="text-xs text-zinc-500">
            Preview data will be saved with this link.
          </p>
        )}
      </div>
      {(metadata.title ||
        metadata.description ||
        metadata.image ||
        metadata.siteName) && (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/25">
          {metadata.image && (
            <img
              src={metadata.image}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          )}
          <div className="space-y-2 p-3">
            <div className="flex min-w-0 items-center gap-2">
              {metadata.favicon && (
                <img
                  src={metadata.favicon}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-sm"
                />
              )}
              {metadata.siteName && (
                <p className="truncate text-xs font-medium text-zinc-500">
                  {metadata.siteName}
                </p>
              )}
            </div>
            {metadata.title && (
              <p className="text-sm font-semibold leading-5 text-zinc-100">
                {metadata.title}
              </p>
            )}
            {metadata.description && (
              <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
                {metadata.description}
              </p>
            )}
          </div>
        </div>
      )}
      {previewError && (
        <p className="rounded-lg border border-red-300/25 bg-red-300/10 px-3 py-2 text-sm text-red-100">
          {previewError}
        </p>
      )}
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-normal text-zinc-500">
          Optional title
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Leave empty to use the domain"
          className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
          type="text"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-normal text-zinc-500">
          Note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why save this?"
          className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
          maxLength={220}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-normal text-zinc-500">
          Tags
        </span>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="react, reading, work"
          className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
          type="text"
        />
      </label>
      <button
        className="h-12 w-full rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 active:scale-[0.99]"
        type="submit"
      >
        Save link
      </button>
    </form>
  );
}
