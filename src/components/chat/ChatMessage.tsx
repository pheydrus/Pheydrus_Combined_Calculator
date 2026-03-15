import Markdown from 'react-markdown';
import type { ChatMessage as ChatMessageType, Citation } from '../../models/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="chat-message chat-message--user">
        <div className="chat-bubble chat-bubble--user">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="chat-message chat-message--assistant">
      <div className="chat-bubble chat-bubble--assistant">
        <Markdown
          components={{
            // Style links to open in new tab
            a: ({ children, href, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {formatContentWithCitations(message.content)}
        </Markdown>
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

/** Clean [Source: ...] markers from displayed text since we show them as badges */
function formatContentWithCitations(content: string): string {
  return content.replace(/\[Source:\s*[^\]]+\]/g, '');
}
