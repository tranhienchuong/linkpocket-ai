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
      className="glass-panel-strong space-y-3 rounded-lg p-3 sm:p-4"
    >
      <label className="block">
        <span className="field-label">Paste URL</span>
        <input
          value={rawUrl}
          onChange={(event) => setRawUrl(event.target.value)}
          placeholder="https://example.com/post?utm_source=..."
          className="form-control h-12 px-4 text-sm"
          inputMode="url"
          type="url"
          required
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <button
          className="button-secondary h-11 px-4 text-sm"
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
        <p className="rounded-lg border border-red-300/25 bg-red-300/10 px-3 py-2 text-sm leading-6 text-red-100">
          {previewError}
        </p>
      )}
      <label className="block">
        <span className="field-label">Optional title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Leave empty to use the domain"
          className="form-control h-12 px-4 text-sm"
          type="text"
        />
      </label>
      <label className="block">
        <span className="field-label">Note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why save this?"
          className="form-control min-h-20 resize-none px-4 py-3 text-sm"
          maxLength={220}
        />
      </label>
      <label className="block">
        <span className="field-label">Tags</span>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="react, reading, work"
          className="form-control h-12 px-4 text-sm"
          type="text"
        />
      </label>
      <button
        className="button-primary h-12 w-full px-4 text-sm"
        type="submit"
      >
        Save link
      </button>
    </form>
  );
}
