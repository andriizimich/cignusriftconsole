import { useState } from "react";
import { Play, Clock, X } from "lucide-react";

export const blockDuration = (b) => (b.type === "practice" || b.approx ? `~${b.duration} min` : `${b.duration} min`);

export const ContentBlockCard = ({ block, onRemove, testid }) => {
  const [preview, setPreview] = useState(false);
  return (
    <div data-testid={testid} className="cr-block group">
      <div className="cr-block-media">
        <img src={block.thumbnail} alt={block.title} loading="lazy" className="cr-block-img" />
        <div className="cr-block-scrim" />
        <button onClick={() => setPreview(true)} className="cr-block-play" title="Preview">
          <span className="cr-block-play-ring"><Play className="cr-block-play-icon h-5 w-5" /></span>
        </button>
        <span className={`cr-block-badge ${block.type === "theory" ? "cr-block-badge--theory" : "cr-block-badge--practice"}`}>{block.type}</span>
        {onRemove && <button onClick={onRemove} className="cr-block-remove"><X className="h-3.5 w-3.5" /></button>}
      </div>
      <div className="cr-block-body">
        <p className="cr-block-title">{block.title}</p>
        <div className="cr-block-meta">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {blockDuration(block)}</span>
          <span className="truncate">{block.category}</span>
          <span className="cr-block-date">{block.created_at}</span>
        </div>
      </div>

      {preview && (
        <div className="cr-modal-overlay" onClick={() => setPreview(false)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="cr-modal-title">{block.title}</h3>
              <button onClick={() => setPreview(false)} className="cr-modal-x"><X className="h-5 w-5" /></button>
            </div>
            <div className="cr-video-ph">
              <div className="text-center">
                <Play className="cr-video-ph-icon mx-auto h-10 w-10" />
                <p className="cr-video-ph-text">Video preview placeholder</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
