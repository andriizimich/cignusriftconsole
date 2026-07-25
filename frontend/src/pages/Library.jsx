import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Library as LibraryIcon } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";
import { ContentBlockCard } from "@/components/ContentBlockCard";

const PAGE = 24;

export default function Library() {
  const [type, setType] = useState("theory");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [cats, setCats] = useState({});
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [counts, setCounts] = useState({ theory: 0, practice: 0 });

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data));
    api.get("/content-blocks?type=theory&limit=1").then((r) => setCounts((c) => ({ ...c, theory: r.data.total })));
    api.get("/content-blocks?type=practice&limit=1").then((r) => setCounts((c) => ({ ...c, practice: r.data.total })));
  }, []);

  const load = useCallback(() => {
    const params = { type, skip: page * PAGE, limit: PAGE };
    if (q) params.q = q;
    if (category) params.category = category;
    api.get("/content-blocks", { params }).then((r) => setData(r.data));
  }, [type, q, category, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [type, q, category]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE));
  const selCls = "rounded-md border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#0066FF]/50";

  return (
    <div>
      <PageHeader overline="Interactive Content" title="Content Library" subtitle="Browse theory and practice blocks to compose your VR lessons." />

      <div className="mb-6 flex gap-2 border-b border-white/[0.07]">
        <button data-testid="lib-tab-theory" onClick={() => setType("theory")} className={`relative px-4 py-3 text-sm transition-colors ${type === "theory" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
          Theory <span className="ml-1 text-xs text-zinc-500">({counts.theory})</span>
          {type === "theory" && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0066FF]" />}
        </button>
        <button data-testid="lib-tab-practice" onClick={() => setType("practice")} className={`relative px-4 py-3 text-sm transition-colors ${type === "practice" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
          Practice <span className="ml-1 text-xs text-zinc-500">({counts.practice})</span>
          {type === "practice" && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#00FF66]" />}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-4">
        <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="library-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search content..." className="w-full rounded-md border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50" /></div>
        <select data-testid="library-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selCls}>
          <option value="">All categories</option>
          {Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}
        </select>
        <span className="ml-auto flex items-center gap-2 text-xs text-zinc-500"><LibraryIcon className="h-4 w-4" /> {data.total} results</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="library-grid">
        {data.items.map((b) => <ContentBlockCard key={b.id} block={b} testid={`library-block-${b.id}`} />)}
      </div>
      {data.items.length === 0 && <p className="text-sm text-zinc-500">No content matches your filters.</p>}

      <div className="mt-8 flex items-center justify-center gap-4">
        <button data-testid="library-prev" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /> Prev</button>
        <span className="text-sm text-zinc-500">Page {page + 1} / {totalPages}</span>
        <button data-testid="library-next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-30">Next <ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
