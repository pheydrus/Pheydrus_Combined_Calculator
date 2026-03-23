import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, Citation, ChatMode } from '../models/chat';
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
    // Claude sometimes puts multiple filenames in one [Source: a, b] tag — split them
    const fileNames = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const fileName of fileNames) {
      const key = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (seen.has(key)) continue;
      seen.add(key);

      citations.push({
        documentId: key,
        title: fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
        category: '',
        fileName,
      });
    }
  }

  return citations;
}

export function useChat(mode: ChatMode = 'public', promptId?: string) {
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
        // Search knowledge base using full conversation context, not just latest message
        // This ensures product data is available when user says "yes" to a recommendation
        const searchQuery = updatedMessages
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .join(' ');
        const context = await searchKnowledge(searchQuery, mode);

        // Build message history for API (without IDs/citations)
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Stream response with character-level buffering for smooth typing
        let fullContent = '';
        let displayedContent = '';
        let pendingChars = '';
        let streamDone = false;

        // Typing interval: emit 1-2 chars every 10ms for smooth effect
        const typingInterval = setInterval(() => {
          if (pendingChars.length === 0) {
            if (streamDone) clearInterval(typingInterval);
            return;
          }
          if (abortRef.current) {
            clearInterval(typingInterval);
            return;
          }

          const batch = pendingChars.slice(0, 2);
          pendingChars = pendingChars.slice(2);
          displayedContent += batch;

          const citations = extractCitations(displayedContent);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: displayedContent, citations } : m
            )
          );
        }, 10);

        for await (const event of streamChatResponse(apiMessages, context, mode, promptId)) {
          if (abortRef.current) break;

          if (event.error) {
            setError(event.error);
            break;
          }

          if (event.text) {
            fullContent += event.text;
            pendingChars += event.text;
          }
        }

        streamDone = true;

        // Wait for typing to finish flushing
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (pendingChars.length === 0 || abortRef.current) {
              clearInterval(check);
              clearInterval(typingInterval);
              resolve();
            }
          }, 20);
        });

        // Ensure final state is complete
        if (fullContent) {
          const citations = extractCitations(fullContent);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent, citations } : m))
          );
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
    [messages, isStreaming, mode, promptId]
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
