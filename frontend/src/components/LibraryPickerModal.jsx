import { useEffect, useState, useCallback } from "react";
import { X, Search, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { blockDuration } from "@/components/ContentBlockCard";

const PAGE = 12;

export const LibraryPickerModal = ({ open, type, initialBlocks = [], onClose, onConfirm }) => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [cats, setCats] = useState({});
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (!open) return;
    api.get("/categories").then((r) => setCats(r.data));
    const map = {};
    initialBlocks.forEach((b) => { map[b.id] = b; });
    setSelected(map);
    setQ(""); setCategory(""); setPage(0);
  }, [open, type]);

  const load = useCallback(() => {
    if (!open) return;
    const params = { type, skip: page * PAGE, limit: PAGE };
    if (q) params.q = q;
    if (category) params.category = category;
    api.get("/content-blocks", { params }).then((r) => setData(r.data));
  }, [open, type, q, category, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [q, category]);

  if (!open) return null;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE));
  const toggle = (b) => setSelected((s) => { const n = { ...s }; if (n[b.id]) delete n[b.id]; else n[b.id] = b; return n; });
  const count = Object.keys(selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose} data-testid="library-modal">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-xl border border-white/10 bg-[#0A0A0B]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div><h3 className="font-display text-lg tracking-tight">Content Library — {type === "theory" ? "Theory" : "Practice"}</h3><p className="text-xs text-zinc-500">{data.total} blocks available · {count} selected</p></div>
          <button onClick={onClose} className="rounded-md p-2 text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-6 py-4">
          <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="modal-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search library..." className="w-full rounded-md border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50" /></div>
          <select data-testid="modal-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#0066FF]/50">
            <option value="">All categories</option>
            {Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="modal-grid">
            {data.items.map((b) => {
              const sel = Boolean(selected[b.id]);
              return (
                <button key={b.id} type="button" data-testid={`modal-block-${b.id}`} onClick={() => toggle(b)} className={`relative overflow-hidden rounded-md border text-left transition-colors ${sel ? "border-[#0066FF]" : "border-white/[0.07] hover:border-white/20"}`}>
                  <div className="relative aspect-video">
                    <img src={b.thumbnail} alt={b.title} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/30" />
                    <span className="absolute left-1.5 top-1.5 max-w-[85%] truncate rounded-sm bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">{b.category}</span>
                    {sel && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]"><Check className="h-3 w-3 text-white" /></span>}
                  </div>
                  <div className="p-2"><p className="truncate text-[11px] text-white">{b.title}</p><p className="text-[10px] text-zinc-500">{blockDuration(b)}</p></div>
                </button>
              );
            })}
          </div>
          {data.items.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No content matches your filters.</p>}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button data-testid="modal-prev" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /> Prev</button>
            <span className="text-sm text-zinc-500">Page {page + 1} / {totalPages}</span>
            <button data-testid="modal-next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-30">Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] px-6 py-4">
          <button onClick={onClose} className="rounded-md border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:text-white">Cancel</button>
          <button data-testid="modal-confirm" onClick={() => { onConfirm(Object.values(selected)); onClose(); }} className="rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white active:scale-95">Add {count} block{count === 1 ? "" : "s"}</button>
        </div>
      </div>
    </div>
  );
};
