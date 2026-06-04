import { CATEGORIES, type CategoryFilterValue } from "@/lib/types";

type CategoryFilterProps = {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
};

export default function CategoryFilter({
  value,
  onChange,
}: CategoryFilterProps) {
  return (
    <div>
      <div className="field-label">Category</div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {CATEGORIES.map((category) => {
          const isActive = category === value;

          return (
            <button
              key={category}
              className={`h-10 rounded-lg border px-2 text-xs font-medium transition ${
                isActive
                  ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.14)]"
                  : "border-white/10 bg-white/[0.045] text-zinc-400 hover:border-cyan-300/25 hover:text-zinc-100"
              }`}
              type="button"
              onClick={() => onChange(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
