import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  filePath: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'text';
  onClose: () => void;
}

export default function DocumentViewer({
  filePath,
  fileName,
  fileType,
  onClose,
}: DocumentViewerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="doc-viewer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <div className="doc-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="doc-viewer-header">
          <h2 id="doc-viewer-title" className="doc-viewer-title">
            {fileName}
          </h2>
          <button className="doc-viewer-close" onClick={onClose} aria-label="Close document viewer">
            &times;
          </button>
        </div>
        <div className="doc-viewer-content">
          {fileType === 'pdf' && <PdfRenderer filePath={filePath} />}
          {fileType === 'text' && <TextRenderer filePath={filePath} />}
          {fileType === 'image' && <ImageRenderer filePath={filePath} fileName={fileName} />}
        </div>
      </div>
    </div>
  );
}

function PdfRenderer({ filePath }: { filePath: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth - 32);
    }
  }, []);

  if (loadError) {
    return <ErrorFallback message={loadError} filePath={filePath} />;
  }

  return (
    <div ref={containerRef} className="doc-viewer-pdf">
      <Document
        file={filePath}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(error) => setLoadError(`Failed to load PDF: ${error.message}`)}
        loading={<div className="doc-viewer-loading">Loading PDF...</div>}
      >
        <Page
          pageNumber={currentPage}
          width={containerWidth}
          loading={<div className="doc-viewer-loading">Rendering page...</div>}
        />
      </Document>
      {numPages && numPages > 1 && (
        <div className="doc-viewer-nav">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="doc-viewer-page-info">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function TextRenderer({ filePath }: { filePath: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(setContent)
      .catch((err) => setError(err.message));
  }, [filePath]);

  if (error) return <ErrorFallback message={`Failed to load file: ${error}`} />;
  if (content === null) return <div className="doc-viewer-loading">Loading...</div>;

  return <pre className="doc-viewer-text">{content}</pre>;
}

function ImageRenderer({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [error, setError] = useState(false);

  if (error) return <ErrorFallback message="Failed to load image" />;

  return (
    <div className="doc-viewer-image-wrapper">
      <img
        src={filePath}
        alt={fileName}
        className="doc-viewer-image"
        onError={() => setError(true)}
      />
      <p className="doc-viewer-image-caption">{fileName}</p>
    </div>
  );
}

function ErrorFallback({ message, filePath }: { message: string; filePath?: string }) {
  return (
    <div className="doc-viewer-error">
      <p className="doc-viewer-error-title">Document unavailable</p>
      <p className="doc-viewer-error-message">{message}</p>
      {filePath && (
        <a
          href={filePath}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-viewer-error-link"
        >
          Try opening in a new tab
        </a>
      )}
    </div>
  );
}
