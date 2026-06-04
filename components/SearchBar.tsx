type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-normal text-zinc-500">
        Search
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Title, domain, or URL"
        className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition focus:border-cyan-300/70 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
        type="search"
      />
    </label>
  );
}
