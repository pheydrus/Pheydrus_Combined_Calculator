import type { ContextChunk, ChatStreamEvent } from '../../models/chat';

interface MessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export async function* streamChatResponse(
  messages: MessagePayload[],
  context: ContextChunk[]
): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to get response';
    try {
      const errorBody = await response.json();
      errorMsg = errorBody.error || errorMsg;
    } catch {
      // ignore parse errors
    }
    yield { error: errorMsg };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { error: 'No response stream available' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6); // Remove 'data: '

        if (data === '[DONE]') return;

        try {
          const event: ChatStreamEvent = JSON.parse(data);
          if (event.error) {
            yield { error: event.error };
            return;
          }
          if (event.text) {
            yield { text: event.text };
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
