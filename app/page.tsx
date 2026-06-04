import LinkList from "@/components/LinkList";

export default function Home() {
  return (
    <main className="app-shell text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
        <header className="space-y-5 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]">
              Mobile-first link pocket
            </div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-medium text-zinc-400">
              Local saves with optional AI
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-gradient text-4xl font-semibold tracking-normal sm:text-5xl">
              LinkPocket AI
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Save clean links, auto-sort them, add quick notes, and ask AI for
              compact summaries when you need more context.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Clean URLs", "Smart categories", "Offline pocket"].map((item) => (
              <div
                key={item}
                className="glass-soft rounded-lg px-3 py-2 text-sm font-medium text-zinc-300"
              >
                {item}
              </div>
            ))}
          </div>
        </header>
        <LinkList />
      </div>
    </main>
  );
}
