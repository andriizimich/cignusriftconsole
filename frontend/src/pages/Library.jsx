import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Library as LibraryIcon } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";
import { Button } from "@/components/base/Button";
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

  return (
    <div>
      <PageHeader overline="Interactive Content" title="Content Library" subtitle="Browse theory and practice blocks to compose your VR lessons." />

      <div className="cr-tabs">
        <Button variant="bare" data-testid="lib-tab-theory" onClick={() => setType("theory")} className={`cr-tab ${type === "theory" ? "is-active" : ""}`}>
          Theory <span className="ml-1 text-xs cr-tm">({counts.theory})</span>
          {type === "theory" && <span className="cr-tab-bar" />}
        </Button>
        <Button variant="bare" data-testid="lib-tab-practice" onClick={() => setType("practice")} className={`cr-tab ${type === "practice" ? "is-active" : ""}`}>
          Practice <span className="ml-1 text-xs cr-tm">({counts.practice})</span>
          {type === "practice" && <span className="cr-tab-bar cr-tab-bar-green" />}
        </Button>
      </div>

      <div className="cr-toolbar">
        <div className="cr-search"><Search className="cr-search-icon" /><input data-testid="library-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search content..." className="cr-search-input" /></div>
        <select data-testid="library-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="cr-select">
          <option value="">All categories</option>
          {Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}
        </select>
        <span className="cr-results-note"><LibraryIcon className="h-4 w-4" /> {data.total} results</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="library-grid">
        {data.items.map((b) => <ContentBlockCard key={b.id} block={b} testid={`library-block-${b.id}`} />)}
      </div>
      {data.items.length === 0 && <p className="cr-empty">No content matches your filters.</p>}

      <div className="mt-8 flex items-center justify-center gap-4">
        <Button variant="bare" data-testid="library-prev" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="cr-pager-btn"><ChevronLeft className="h-4 w-4" /> Prev</Button>
        <span className="cr-pager-info">Page {page + 1} / {totalPages}</span>
        <Button variant="bare" data-testid="library-next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="cr-pager-btn">Next <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
