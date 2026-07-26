import { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Play, Clock, X } from "lucide-react";
import { Img } from "@/components/base/Img";
import { Button } from "@/components/base/Button";
import styles from "./ContentBlockCard.module.css";

export const blockDuration = (b) => (b.type === "practice" || b.approx ? `~${b.duration} min` : `${b.duration} min`);

export const ContentBlockCard = ({ block, onRemove, testid }) => {
  const [preview, setPreview] = useState(false);
  return (
    <div data-testid={testid} className={styles.block}>
      <div className={styles.media}>
        <Img src={block.thumbnail} alt={block.title} className={styles.img} />
        <div className={styles.scrim} />
        <Button variant="bare" onClick={() => setPreview(true)} className={styles.play} title="Preview">
          <span className={styles.playRing}><Play className={clsx(styles.playIcon, "h-5 w-5")} /></span>
        </Button>
        <span className={clsx(styles.badge, block.type === "theory" ? styles.badgeTheory : styles.badgePractice)}>{block.type}</span>
        {onRemove && <Button variant="bare" onClick={onRemove} className={styles.remove}><X className="h-3.5 w-3.5" /></Button>}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{block.title}</p>
        <div className={styles.meta}>
          <span className={styles.metaItem}><Clock className="h-3 w-3" /> {blockDuration(block)}</span>
          <span className={styles.metaCat}>{block.category}</span>
          <span className={styles.date}>{block.created_at}</span>
        </div>
      </div>

      {preview && (
        <div className="cr-modal-overlay" onClick={() => setPreview(false)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="cr-modal-title">{block.title}</h3>
              <Button variant="bare" onClick={() => setPreview(false)} className="cr-modal-x"><X className="h-5 w-5" /></Button>
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

ContentBlockCard.propTypes = {
  block: PropTypes.shape({
    thumbnail: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    duration: PropTypes.number,
    approx: PropTypes.bool,
    category: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func,
  testid: PropTypes.string,
};
