# Technical Requirements: Chat UI Components

## Tech Stack

- **Language**: TypeScript
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown
- **Build**: Vite
- **Testing**: Vitest + React Testing Library

## Architecture

```
src/
├── components/
│   └── chat/
│       ├── ChatMessage.tsx
│       ├── ChatThread.tsx
│       ├── ChatInput.tsx
│       └── CitationLink.tsx
├── hooks/
│   └── useChat.ts
└── __tests__/
    ├── useChat.test.ts
    ├── ChatMessage.test.tsx
    ├── ChatThread.test.tsx
    ├── ChatInput.test.tsx
    └── CitationLink.test.tsx
```

## Dependencies

### New Dependencies

```json
{
  "react-markdown": "^9.x"
}
```

### Existing Dependencies (already in project)

- React, ReactDOM
- Tailwind CSS
- TypeScript

### Dependencies from Feature 6.3 (consumed, not installed here)

- FlexSearch (used internally by search service)
- Chat type interfaces (ChatMessage, Citation, KnowledgeChunk)
- `searchKnowledgeBase()` function
- `chatApi.sendMessage()` SSE stream function

## Component Specifications

### useChat Hook

**File**: `src/hooks/useChat.ts`

```typescript
interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  clearChat: () => void;
}

function useChat(): UseChatReturn;
```

**Internal Flow:**

```
sendMessage(text)
  → setIsLoading(true)
  → append user ChatMessage to messages
  → searchKnowledgeBase(text) → relevantChunks[]
  → chatApi.sendMessage({ message: text, context: relevantChunks })
  → on first token: setIsLoading(false), setIsStreaming(true)
  → on each token: update assistant message content incrementally
  → on stream end: setIsStreaming(false), extractCitations(fullResponse)
  → on error: setError(message), setIsLoading(false), setIsStreaming(false)
```

**State Management:**

- Uses `useState` for messages, isLoading, isStreaming, error
- Uses `useRef` for abort controller (to cancel in-flight requests on clearChat)
- Uses `useCallback` for sendMessage and clearChat to maintain stable references
- Streaming update: appends tokens to the last message's content string (batch updates with requestAnimationFrame or React 18 automatic batching)

**Citation Extraction:**

```typescript
// Parse citation markers from completed assistant response
// Expected format in response: [1], [2], etc. or [Source: filename.txt]
function extractCitations(responseText: string, searchResults: KnowledgeChunk[]): Citation[];
```

- Maps citation markers in text to corresponding KnowledgeChunk entries from search results
- Returns Citation objects with document title, category, and text excerpt

### ChatMessage Component

**File**: `src/components/chat/ChatMessage.tsx`

```typescript
interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onCitationClick?: (citation: Citation) => void;
}

function ChatMessage({ message, isStreaming, onCitationClick }: ChatMessageProps): JSX.Element;
```

**Rendering Logic:**

- If `message.role === 'user'`: render right-aligned bubble with plain text
- If `message.role === 'assistant'`: render left-aligned bubble with react-markdown
- Replace citation patterns in markdown content with `<CitationLink>` components before rendering

**react-markdown Configuration:**

```typescript
import ReactMarkdown from 'react-markdown';

// Custom components override for react-markdown
const markdownComponents = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold underline">
      {children}
    </a>
  ),
  // Other overrides as needed for consistent styling
};
```

**Streaming Indicator:**

- When `isStreaming` is true, append a blinking cursor or pulsing dot after the last token
- Use CSS animation (Tailwind `animate-pulse`) for the indicator

### ChatThread Component

**File**: `src/components/chat/ChatThread.tsx`

```typescript
interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onCitationClick: (citation: Citation) => void;
  onRetry?: () => void;
}

function ChatThread({
  messages,
  isLoading,
  isStreaming,
  error,
  onSendMessage,
  onCitationClick,
  onRetry,
}: ChatThreadProps): JSX.Element;
```

**Auto-Scroll Implementation:**

```typescript
const threadRef = useRef<HTMLDivElement>(null);
const isUserScrolledUp = useRef(false);

// Track if user has scrolled up
const handleScroll = () => {
  const el = threadRef.current;
  if (!el) return;
  const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  isUserScrolledUp.current = !isAtBottom;
};

// Auto-scroll when new content arrives (unless user scrolled up)
useEffect(() => {
  if (!isUserScrolledUp.current && threadRef.current) {
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }
}, [messages, isStreaming]);
```

**Empty State (Welcome Message):**

```typescript
const STARTER_QUESTIONS = [
  'What programs does Pheydrus offer?',
  'Tell me about Life Path Numbers',
  "What is the Artist's Way?",
  'How do I choose a program?',
];
```

- Render welcome message with Pheydrus branding
- Render starter questions as clickable buttons styled in gold outline
- Clicking a starter question calls `onSendMessage(question)`

**Error State:**

- Render error inline as a system message (centered, red-tinted)
- Include "Try again" button that calls `onRetry`

### ChatInput Component

**File**: `src/components/chat/ChatInput.tsx`

```typescript
interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

function ChatInput({ onSend, disabled }: ChatInputProps): JSX.Element;
```

**Implementation Details:**

- Use `<textarea>` for multi-line support (not `<input>`)
- Auto-resize textarea based on content (min 1 row, max ~5 rows)
- Key handling:

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
  // Shift+Enter: default behavior (newline)
};
```

- Send function trims whitespace and validates non-empty before calling `onSend`
- After send, clear the textarea and reset height
- `autoFocus` on mount
- Refocus after `disabled` transitions from true to false

**Textarea Auto-Resize:**

```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null);

const adjustHeight = () => {
  const el = textareaRef.current;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px'; // max ~5 rows
};
```

### CitationLink Component

**File**: `src/components/chat/CitationLink.tsx`

```typescript
interface CitationLinkProps {
  citation: Citation;
  index: number;
  onClick: (citation: Citation) => void;
}

function CitationLink({ citation, index, onClick }: CitationLinkProps): JSX.Element;
```

**Rendering:**

- Inline `<button>` element styled as a small badge
- Display: `[{index + 1}]` or abbreviated source name
- Tailwind classes: `inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-gold/20 text-gold hover:bg-gold/30 cursor-pointer`
- Title attribute with full document name (tooltip on hover)
- onClick calls the provided callback with the citation data

## Tailwind CSS Custom Values

Extend `tailwind.config.js` if not already present:

```javascript
// These should already be defined from the existing app setup
module.exports = {
  theme: {
    extend: {
      colors: {
        gold: '#9a7d4e',
        'deep-purple': '#2d2a3e',
      },
    },
  },
};
```

## Data Flow

```
User types in ChatInput
        |
        v
ChatInput.onSend(text)
        |
        v
useChat.sendMessage(text)
        |
        ├── searchKnowledgeBase(text) → relevantChunks
        |
        └── chatApi.sendMessage({ message, context }) → SSE stream
                |
                v
        useChat updates messages[] incrementally
                |
                v
        ChatThread re-renders with new/updated messages
                |
                v
        ChatMessage renders markdown + CitationLink badges
                |
                v
        CitationLink.onClick → emits to parent (ChatPage)
```

## Citation Parsing Strategy

Assistant responses will contain citation markers baked into the text by the system prompt (Feature 6.2). The parsing approach:

1. After streaming completes, scan the full response for citation patterns: `[1]`, `[2]`, `[Source: filename]`
2. Match citation indices to the knowledge chunks that were sent as context
3. Create Citation objects with source metadata
4. For rendering: pre-process the markdown string to replace `[N]` patterns with custom React components via react-markdown's component override or a regex-based pre-processor

```typescript
// Pre-process markdown to insert citation components
function injectCitationMarkers(text: string): string {
  // Replace [1], [2], etc. with a custom markdown-safe marker
  // that react-markdown can render as CitationLink
  return text.replace(/\[(\d+)\]/g, '<citation data-index="$1"/>');
}
```

## Performance Considerations

- **Streaming re-renders**: Use React 18 automatic batching. Avoid calling setState on every single token — batch tokens arriving within the same frame
- **react-markdown**: Only re-render the currently streaming message. Use `React.memo` on ChatMessage for completed messages
- **Auto-scroll**: Use `scrollTop` assignment (not `scrollIntoView` with smooth behavior) during streaming to avoid scroll jank
- **Memoization**: Memoize `markdownComponents` object outside the render function to prevent react-markdown re-initialization

## Testing Strategy

### useChat Hook Tests

```typescript
// Test cases:
// - sendMessage appends user message and triggers API call
// - isLoading is true until first token
// - isStreaming is true during token receipt
// - error is set on network failure
// - clearChat resets all state
// - concurrent sendMessage calls are prevented while streaming
```

### Component Tests

```typescript
// ChatMessage:
// - Renders user message right-aligned with plain text
// - Renders assistant message left-aligned with markdown
// - Shows streaming indicator when isStreaming=true
// - Citation badges are clickable

// ChatThread:
// - Shows welcome message when messages array is empty
// - Starter questions call onSendMessage when clicked
// - Renders all messages in order
// - Shows error message with retry button

// ChatInput:
// - Enter key calls onSend with trimmed text
// - Shift+Enter inserts newline
// - Empty input does not call onSend
// - Disabled state prevents sending

// CitationLink:
// - Renders badge with correct index
// - Click calls onClick with citation data
// - Shows tooltip with document title
```

## Files to Create

1. `src/hooks/useChat.ts` - Chat state management hook
2. `src/components/chat/ChatMessage.tsx` - Individual message renderer
3. `src/components/chat/ChatThread.tsx` - Scrollable message list with welcome state
4. `src/components/chat/ChatInput.tsx` - Text input with send functionality
5. `src/components/chat/CitationLink.tsx` - Inline citation badge component

## Migration Checklist

- [ ] react-markdown installed and configured
- [ ] useChat hook implemented with full streaming lifecycle
- [ ] ChatMessage renders user and assistant messages correctly
- [ ] ChatThread displays welcome state and auto-scrolls
- [ ] ChatInput handles Enter/Shift+Enter and disabled states
- [ ] CitationLink renders and emits click events
- [ ] All components styled with existing Tailwind color scheme
- [ ] Unit tests passing for hook and all components
- [ ] Streaming performance verified (no jank during rapid token arrival)
- [ ] Accessibility attributes in place (aria-labels, keyboard navigation)

---

**Important Note**: These components are presentation-only and do not own any routing or page-level layout. They are composed by ChatPage (Feature 6.5) which handles the page structure and SourcePanel integration.
