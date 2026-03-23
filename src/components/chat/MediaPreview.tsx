import { useState, useEffect, Suspense, lazy } from 'react';

const LazyPdfThumbnail = lazy(() => import('./PdfThumbnail'));

interface MediaPreviewProps {
  relativePath: string;
  fileType: 'pdf' | 'image' | 'text';
  fileName: string;
  publicUrl: string;
  onViewFull: (publicUrl: string, fileName: string, fileType: 'pdf' | 'image' | 'text') => void;
}

export function MediaPreview({ fileType, fileName, publicUrl, onViewFull }: MediaPreviewProps) {
  return (
    <div className="media-preview-card">
      <div className="media-preview-thumbnail">
        {fileType === 'pdf' && (
          <Suspense fallback={<div className="preview-skeleton" />}>
            <LazyPdfThumbnail publicUrl={publicUrl} />
          </Suspense>
        )}
        {fileType === 'image' && (
          <img src={publicUrl} alt={fileName} className="media-preview-thumb-img" loading="lazy" />
        )}
        {fileType === 'text' && <TextThumbnail publicUrl={publicUrl} />}
      </div>
      <div className="media-preview-info">
        <p className="media-preview-filename">{fileName}</p>
        <p className="media-preview-meta">{fileType.toUpperCase()}</p>
        <button
          className="media-preview-action"
          onClick={() => onViewFull(publicUrl, fileName, fileType)}
        >
          View Full Document
        </button>
      </div>
    </div>
  );
}

function TextThumbnail({ publicUrl }: { publicUrl: string }) {
  const [excerpt, setExcerpt] = useState('');

  useEffect(() => {
    fetch(publicUrl)
      .then((res) => (res.ok ? res.text() : ''))
      .then((text) => setExcerpt(text.slice(0, 200)))
      .catch(() => setExcerpt(''));
  }, [publicUrl]);

  if (!excerpt) return <div className="preview-skeleton" />;

  return <div className="media-preview-text-excerpt">{excerpt}...</div>;
}

export function PreviewUnavailable({ fileName }: { fileName: string }) {
  return <div className="preview-unavailable">Document preview unavailable: {fileName}</div>;
}
