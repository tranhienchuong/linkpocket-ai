import { FormEvent, useState } from "react";

type LinkFormProps = {
  onSubmit: (input: { rawUrl: string; title: string }) => void;
};

export default function LinkForm({ onSubmit }: LinkFormProps) {
  const [rawUrl, setRawUrl] = useState("");
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ rawUrl, title });
    setRawUrl("");
    setTitle("");
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
      <button
        className="h-12 w-full rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 active:scale-[0.99]"
        type="submit"
      >
        Save link
      </button>
    </form>
  );
}
