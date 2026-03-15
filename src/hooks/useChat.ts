import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, Citation } from '../models/chat';
import { searchKnowledge } from '../services/chat/knowledgeSearch';
import { streamChatResponse } from '../services/chat/chatApi';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function extractCitations(text: string): Citation[] {
  const regex = /\[Source:\s*([^\]]+)\]/g;
  const citations: Citation[] = [];
  const seen = new Set<string>();
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fileName = match[1].trim();
    if (seen.has(fileName)) continue;
    seen.add(fileName);

    citations.push({
      documentId: fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
      category: '',
      fileName,
    });
  }

  return citations;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      setError(null);
      abortRef.current = false;

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
        citations: [],
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Create placeholder assistant message
      const assistantId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        citations: [],
        timestamp: Date.now(),
      };

      setMessages([...updatedMessages, assistantMessage]);
      setIsStreaming(true);

      try {
        // Search knowledge base for relevant context
        const context = await searchKnowledge(text);

        // Build message history for API (without IDs/citations)
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Stream response
        let fullContent = '';
        for await (const event of streamChatResponse(apiMessages, context)) {
          if (abortRef.current) break;

          if (event.error) {
            setError(event.error);
            break;
          }

          if (event.text) {
            fullContent += event.text;
            const citations = extractCitations(fullContent);

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: fullContent, citations } : m
              )
            );
          }
        }

        // If no content was generated, remove the empty assistant message
        if (!fullContent) {
          setMessages(updatedMessages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        // Remove empty assistant message on error
        setMessages(updatedMessages);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    abortRef.current = true;
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
  };
}
