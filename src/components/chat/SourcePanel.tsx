import type { Citation } from '../../models/chat';

interface SourcePanelProps {
  citation: Citation | null;
  onClose: () => void;
}

export function SourcePanel({ citation, onClose }: SourcePanelProps) {
  if (!citation) return null;

  return (
    <div className="source-panel">
      <div className="source-panel-header">
        <h3 className="source-panel-title">{citation.title}</h3>
        <button className="source-panel-close" onClick={onClose} aria-label="Close source panel">
          &times;
        </button>
      </div>
      {citation.category && <span className="source-panel-category">{citation.category}</span>}
      <div className="source-panel-meta">
        <span className="source-panel-filename">{citation.fileName}</span>
      </div>
    </div>
  );
}
