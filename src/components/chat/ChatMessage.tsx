import Markdown from 'react-markdown';
import type { ChatMessage as ChatMessageType, Citation } from '../../models/chat';
import { lookupAssetByFileName } from '../../services/chat/mediaAssets';
import { MediaPreview } from './MediaPreview';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
  onViewDocument?: (
    publicUrl: string,
    fileName: string,
    fileType: 'pdf' | 'image' | 'text'
  ) => void;
}

export function ChatMessage({ message, onCitationClick, onViewDocument }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="chat-message chat-message--user">
        <div className="chat-bubble chat-bubble--user">{message.content}</div>
      </div>
    );
  }

  // Auto-resolve previews from citations — show preview cards for any cited file
  // that has a previewable original in the media manifest (max 3)
  const previewAssets = onViewDocument
    ? message.citations
        .map((c) => lookupAssetByFileName(c.fileName))
        .filter((a) => a !== undefined)
        .slice(0, 3)
    : [];

  return (
    <div className="chat-message chat-message--assistant">
      <div className="chat-bubble chat-bubble--assistant">
        <Markdown
          components={{
            a: ({ children, href, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {formatContentWithCitations(message.content)}
        </Markdown>
        {previewAssets.length > 0 && onViewDocument && (
          <div className="media-previews">
            {previewAssets.map((asset) => (
              <MediaPreview
                key={asset.id}
                relativePath={asset.relativePath}
                fileType={asset.fileType}
                fileName={asset.fileName}
                publicUrl={asset.publicUrl}
                onViewFull={onViewDocument}
              />
            ))}
          </div>
        )}
        {message.citations.length > 0 && (
          <div className="chat-citations">
            <span className="chat-citations-label">Sources:</span>
            {message.citations.map((citation) => (
              <button
                key={citation.fileName}
                className="chat-citation-badge"
                onClick={() => onCitationClick?.(citation)}
                title={citation.fileName}
              >
                {citation.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Clean [Source: ...] and [Preview: ...] markers from displayed text */
function formatContentWithCitations(content: string): string {
  return content.replace(/\[Source:\s*[^\]]+\]/g, '').replace(/\[Preview:\s*[^\]]+\]/g, '');
}
