import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfThumbnail({ publicUrl }: { publicUrl: string }) {
  return (
    <Document
      file={publicUrl}
      loading={<div className="preview-skeleton" />}
      error={<div className="preview-skeleton" />}
    >
      <Page pageNumber={1} height={120} loading={<div className="preview-skeleton" />} />
    </Document>
  );
}
