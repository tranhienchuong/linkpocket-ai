type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="block">
      <span className="field-label">Search</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Title, domain, or URL"
        className="form-control h-12 px-4 text-sm"
        type="search"
      />
    </label>
  );
}
