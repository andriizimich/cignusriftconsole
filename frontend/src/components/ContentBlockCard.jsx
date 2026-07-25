import { useState } from "react";
import { Play, Clock, X } from "lucide-react";

export const blockDuration = (b) => (b.type === "practice" || b.approx ? `~${b.duration} min` : `${b.duration} min`);

export const ContentBlockCard = ({ block, onRemove, testid }) => {
  const [preview, setPreview] = useState(false);
  return (
    <div data-testid={testid} className="group relative overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B]">
      <div className="relative aspect-video overflow-hidden">
        <img src={block.thumbnail} alt={block.title} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <button onClick={() => setPreview(true)} className="absolute inset-0 flex items-center justify-center" title="Preview">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/30 transition-transform group-hover:scale-110"><Play className="h-5 w-5 text-white" /></span>
        </button>
        <span className={`absolute left-2 top-2 rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${block.type === "theory" ? "bg-[#0066FF]/80 text-white" : "bg-[#00FF66]/80 text-black"}`}>{block.type}</span>
        {onRemove && <button onClick={onRemove} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-[#FF3366]"><X className="h-3.5 w-3.5" /></button>}
      </div>
      <div className="p-4">
        <p className="truncate text-sm text-white">{block.title}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {blockDuration(block)}</span>
          <span className="truncate">{block.category}</span>
          <span className="ml-auto shrink-0 text-zinc-600">{block.created_at}</span>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setPreview(false)}>
          <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#0A0A0B] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg tracking-tight">{block.title}</h3><button onClick={() => setPreview(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="flex aspect-video items-center justify-center rounded-md border border-white/10 bg-black">
              <div className="text-center"><Play className="mx-auto h-10 w-10 text-zinc-700" /><p className="mt-3 text-xs uppercase tracking-[0.3em] text-zinc-600">Video preview placeholder</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
