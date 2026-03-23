import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import type { Citation, KnowledgeChunk } from '../../models/chat';
import { lookupAssetByFileName } from '../../services/chat/mediaAssets';

const DocumentViewer = lazy(() => import('./DocumentViewer'));

let cachedChunks: KnowledgeChunk[] | null = null;

/** Search knowledge base chunks for content matching a citation title */
async function findChunkContent(fileName: string): Promise<string | null> {
  try {
    if (!cachedChunks) {
      const res = await fetch('/knowledge-base/private/chunks.json');
      if (!res.ok) return null;
      cachedChunks = await res.json();
    }

    const lower = fileName.toLowerCase().replace(/[_-]+/g, ' ');

    const matching = cachedChunks!.filter((c) => {
      const normTitle = c.title.toLowerCase().replace(/[_-]+/g, ' ');
      return normTitle.includes(lower) || lower.includes(normTitle);
    });

    if (matching.length > 0) {
      return matching
        .slice(0, 3)
        .map((c) => c.content)
        .join('\n\n---\n\n');
    }

    return null;
  } catch {
    return null;
  }
}

interface SourcePanelProps {
  citation: Citation | null;
  onClose: () => void;
}

export function SourcePanel({ citation, onClose }: SourcePanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const asset = citation ? lookupAssetByFileName(citation.fileName) : undefined;

  const loadContent = useCallback(
    async (
      cit: Citation,
      assetPublicUrl: string | undefined,
      assetFileType: string | undefined
    ) => {
      setLoading(true);
      try {
        if (assetPublicUrl && assetFileType === 'text') {
          const res = await fetch(assetPublicUrl);
          if (res.ok) {
            setContent(await res.text());
            return;
          }
        }
        if (!assetPublicUrl) {
          const chunkContent = await findChunkContent(cit.fileName);
          setContent(chunkContent);
          return;
        }
        setContent(null);
      } catch {
        setContent(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!citation) return;
    setContent(null);
    setShowViewer(false);
    loadContent(citation, asset?.publicUrl, asset?.fileType);
  }, [citation, asset?.publicUrl, asset?.fileType, loadContent]);

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

      <div className="source-panel-content">
        {loading && <p className="source-panel-loading">Loading content...</p>}

        {!loading && content && <pre className="source-panel-text">{content}</pre>}

        {!loading && asset?.fileType === 'image' && (
          <img src={asset.publicUrl} alt={citation.fileName} className="source-panel-image" />
        )}

        {!loading && asset?.fileType === 'pdf' && !showViewer && (
          <button className="source-panel-view-btn" onClick={() => setShowViewer(true)}>
            View PDF
          </button>
        )}

        {!loading && !content && !asset && (
          <p className="source-panel-no-preview">No preview available for this file.</p>
        )}
      </div>

      {showViewer && asset && (
        <Suspense fallback={<div className="doc-viewer-loading">Loading viewer...</div>}>
          <DocumentViewer
            filePath={asset.publicUrl}
            fileName={asset.fileName}
            fileType={asset.fileType}
            onClose={() => setShowViewer(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
