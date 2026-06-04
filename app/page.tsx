import LinkList from "@/components/LinkList";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070910] text-zinc-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.16)]">
            Mobile-first link pocket
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              LinkPocket AI
            </h1>
            <p className="max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              Save clean links, auto-sort them, and find them fast from your
              phone.
            </p>
          </div>
        </header>
        <LinkList />
      </div>
    </main>
  );
}
