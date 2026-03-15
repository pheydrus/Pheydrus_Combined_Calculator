import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType, Citation } from '../../models/chat';

interface ChatThreadProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  onCitationClick?: (citation: Citation) => void;
}

const STARTER_QUESTIONS = [
  'What programs does Pheydrus offer?',
  "What's the difference between Artist's Way and Hero's Journey?",
  'How do I find my Life Path number?',
  'What course is right for someone feeling stuck?',
];

export function ChatThread({ messages, isStreaming, onCitationClick }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="chat-thread">
        <div className="chat-welcome">
          <h2 className="chat-welcome-title">Pheydrus Knowledge Assistant</h2>
          <p className="chat-welcome-subtitle">
            Ask me anything about Pheydrus courses, astrology, numerology, or personal development
            programs.
          </p>
          <div className="chat-starters">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                className="chat-starter-btn"
                onClick={() => {
                  // Dispatch custom event for ChatInput to pick up
                  window.dispatchEvent(new CustomEvent('chat:starter', { detail: q }));
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="chat-thread">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} onCitationClick={onCitationClick} />
      ))}
      {isStreaming && messages[messages.length - 1]?.content === '' && (
        <div className="chat-typing">
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
