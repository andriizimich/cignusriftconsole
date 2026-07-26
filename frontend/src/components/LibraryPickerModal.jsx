import { useEffect, useState, useCallback } from "react";
import { X, Search, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { blockDuration } from "@/components/ContentBlockCard";
import { Button } from "@/components/base/Button";
import { Img } from "@/components/base/Img";

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
    <div className="cr-modal-overlay" onClick={onClose} data-testid="library-modal">
      <div className="cr-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="cr-modal-lg-head">
          <div><h3 className="cr-modal-title">Content Library — {type === "theory" ? "Theory" : "Practice"}</h3><p className="cr-modal-sub">{data.total} blocks available · {count} selected</p></div>
          <Button variant="bare" onClick={onClose} className="cr-modal-x"><X className="h-5 w-5" /></Button>
        </div>

        <div className="cr-modal-lg-head flex-wrap gap-3">
          <div className="cr-search"><Search className="cr-search-icon" /><input data-testid="modal-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search library..." className="cr-search-input" /></div>
          <select data-testid="modal-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="cr-select">
            <option value="">All categories</option>
            {Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="modal-grid">
            {data.items.map((b) => {
              const sel = Boolean(selected[b.id]);
              return (
                <Button variant="bare" key={b.id} type="button" data-testid={`modal-block-${b.id}`} onClick={() => toggle(b)} className={`cr-libtile ${sel ? "is-sel" : ""}`}>
                  <div className="relative aspect-video">
                    <Img src={b.thumbnail} alt={b.title} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
                    <span className="cr-libtile-badge">{b.category}</span>
                    {sel && <span className="cr-libtile-check"><Check className="h-3 w-3 text-white" /></span>}
                  </div>
                  <div className="cr-libtile-body"><p className="cr-libtile-title">{b.title}</p><p className="cr-libtile-meta">{blockDuration(b)}</p></div>
                </Button>
              );
            })}
          </div>
          {data.items.length === 0 && <p className="cr-empty text-center">No content matches your filters.</p>}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button variant="bare" data-testid="modal-prev" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="cr-pager-btn"><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <span className="cr-pager-info">Page {page + 1} / {totalPages}</span>
            <Button variant="bare" data-testid="modal-next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="cr-pager-btn">Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="cr-modal-lg-head justify-end gap-3" style={{ borderTop: "1px solid var(--cr-border)", borderBottom: "none" }}>
          <Button variant="bare" onClick={onClose} className="cr-btn-ghost">Cancel</Button>
          <Button variant="bare" data-testid="modal-confirm" onClick={() => { onConfirm(Object.values(selected)); onClose(); }} className="cr-btn-primary">Add {count} block{count === 1 ? "" : "s"}</Button>
        </div>
      </div>
    </div>
  );
};
