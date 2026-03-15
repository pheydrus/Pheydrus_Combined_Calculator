# Functional Requirements: Chat UI Components

## Overview

Build the React components and state management hook that form the chat interface for the Pheydrus AI Chatbot. Users interact with these components to ask questions, see streamed AI responses rendered as markdown, and click citation badges to view source material.

## Dependencies

- **Feature 6.3** (Chat Models & Knowledge Search Service): TypeScript interfaces (ChatMessage, Citation, KnowledgeChunk) and search/API services must be defined
- **react-markdown**: Markdown rendering library for assistant responses
- **Existing app**: Tailwind CSS configured, gold (#9a7d4e) / deep purple (#2d2a3e) / light gray color scheme

## User Stories

### US-1: useChat Hook - Chat State Management

**As a** developer
**I want** a custom React hook that manages the entire chat lifecycle
**So that** chat state, streaming, and error handling are encapsulated in one reusable unit

**Acceptance Criteria:**

- [ ] Exposes a `messages` array of ChatMessage objects (user and assistant messages)
- [ ] Provides `sendMessage(text: string)` function that:
  1. Appends user message to messages array
  2. Searches the knowledge base via the search service (Feature 6.3)
  3. Calls the chat API (POST /api/chat) with user message + relevant knowledge chunks
  4. Streams the response token-by-token, updating the assistant message incrementally
  5. Extracts citations from the completed response and attaches them to the message
- [ ] Exposes `isLoading` boolean (true from send until first token arrives)
- [ ] Exposes `isStreaming` boolean (true while tokens are being received)
- [ ] Exposes `error` state (string or null) for API/network failures
- [ ] Provides `clearChat()` function that resets messages array to empty and clears errors
- [ ] Handles network errors gracefully (sets error state, does not crash)
- [ ] Handles streaming interruptions (partial responses preserved with error indicator)
- [ ] Does not persist chat history across page reloads (session-only)

**Example:**

```
const { messages, sendMessage, isLoading, isStreaming, error, clearChat } = useChat();
await sendMessage("What is the Hero's Journey program?");
// messages now contains user message + streaming assistant response
```

### US-2: ChatMessage Component - Message Rendering

**As a** user
**I want** my messages and the assistant's responses displayed in a clear, visually distinct format
**So that** I can easily follow the conversation

**Acceptance Criteria:**

- [ ] User messages are right-aligned with a distinct background color (gold-tinted)
- [ ] Assistant messages are left-aligned with a contrasting background (dark/purple-tinted)
- [ ] Assistant message content is rendered as markdown using react-markdown
- [ ] Markdown rendering supports: headings, bold, italic, lists (ordered and unordered), inline code, code blocks, links, and paragraphs
- [ ] Links in markdown open in a new tab (`target="_blank"`)
- [ ] Citation references in assistant text (e.g., `[1]`, `[Source: filename]`) are rendered as clickable CitationLink badges
- [ ] Messages display a timestamp or relative time indicator
- [ ] Long messages are fully displayed (no truncation)
- [ ] Streaming messages show content as it arrives (incremental rendering)
- [ ] A typing/streaming indicator is shown while the assistant message is still being received

### US-3: ChatThread Component - Message List Display

**As a** user
**I want** to see the full conversation history in a scrollable thread
**So that** I can review previous questions and answers

**Acceptance Criteria:**

- [ ] Renders all messages in chronological order (oldest at top, newest at bottom)
- [ ] Thread is vertically scrollable when messages exceed the viewport height
- [ ] Auto-scrolls to the bottom when a new message is added (user or assistant)
- [ ] Auto-scroll does not interfere when user has manually scrolled up to review history
- [ ] When no messages exist (empty state), displays:
  - A welcome message introducing the Pheydrus AI assistant
  - 3-4 starter question buttons (e.g., "What programs does Pheydrus offer?", "Tell me about my Life Path Number", "What is the Artist's Way?", "How do I choose a program?")
  - Clicking a starter question sends it as a user message
- [ ] Loading state: shows a skeleton or pulsing indicator while waiting for first response token
- [ ] Error state: displays error message inline in the thread with a retry option

**Example (empty state):**

```
Welcome to the Pheydrus AI Assistant! I can help you explore
courses, understand your life path, and find the right program.

[What programs does Pheydrus offer?]  [Tell me about Life Path Numbers]
[What is the Artist's Way?]          [How do I choose a program?]
```

### US-4: ChatInput Component - Message Composition

**As a** user
**I want** a text input where I can type and send messages
**So that** I can ask the chatbot questions

**Acceptance Criteria:**

- [ ] Text input field with placeholder text (e.g., "Ask about Pheydrus courses...")
- [ ] Send button (icon or text) to the right of the input
- [ ] Pressing Enter sends the message (if not empty)
- [ ] Pressing Shift+Enter inserts a newline (multi-line input support)
- [ ] Input field expands vertically for multi-line text (up to a reasonable max height)
- [ ] Send button and Enter key are disabled while streaming is in progress
- [ ] Input field is visually disabled (but retains typed text) while streaming
- [ ] Empty/whitespace-only messages cannot be sent
- [ ] Input field auto-focuses when the chat page loads
- [ ] Input field refocuses after a response is complete
- [ ] Send button has a visual affordance (e.g., arrow icon) styled in the app's gold color

### US-5: CitationLink Component - Source Reference Badges

**As a** user
**I want** clickable citation references within assistant responses
**So that** I can see where the information came from

**Acceptance Criteria:**

- [ ] Renders as an inline badge/chip within the message text (e.g., `[1]` or `[Source Name]`)
- [ ] Visually distinct from regular text (e.g., gold background, rounded, slightly smaller font)
- [ ] Hovering shows a tooltip with the source document title
- [ ] Clicking emits an event (callback prop or custom event) to trigger the SourcePanel (Feature 6.5) to display the full citation details
- [ ] Multiple citation badges can appear in a single message
- [ ] Badge styling is consistent regardless of citation count

## Visual Design Requirements

### Color Scheme (must match existing app)

- **Primary gold**: #9a7d4e (accents, buttons, citation badges)
- **Deep purple**: #2d2a3e (backgrounds, assistant message bubbles)
- **Light gray**: Background tones, borders
- **White**: User message text on dark backgrounds, or dark text on light message bubbles
- **Error red**: For error states and indicators

### Layout

- Chat thread occupies the main content area (flexible height)
- Input bar is fixed/sticky at the bottom of the chat area
- Messages have comfortable padding and spacing
- Mobile-responsive: full-width on small screens, centered with max-width on large screens

## Error Scenarios

- Network failure during API call: Show error message in thread, allow retry
- Streaming interrupted mid-response: Display partial response with "Response interrupted" indicator
- Knowledge base search fails: Proceed with API call without context (degrade gracefully)
- Empty response from API: Show "I couldn't generate a response. Please try again." message

## Performance Requirements

- Chat input responds to keystrokes with zero perceptible lag
- Streaming tokens render within 16ms of receipt (single frame)
- Auto-scroll is smooth (no jank during rapid token arrival)
- react-markdown re-renders efficiently during streaming (no full message re-parse per token)
- Welcome state renders instantly (no loading spinner for empty chat)

## Accessibility

- Input field has appropriate aria-label
- Send button has aria-label for screen readers
- Messages are in a region with role="log" or similar for screen reader announcement
- Citation badges are keyboard-focusable and activatable with Enter/Space
- Color contrast meets WCAG AA standards for all text

## Testing Strategy

- Unit tests for useChat hook (message flow, loading states, error handling, clearChat)
- Component tests for ChatMessage (user vs assistant rendering, markdown output)
- Component tests for ChatThread (empty state, auto-scroll behavior, starter questions)
- Component tests for ChatInput (Enter/Shift+Enter, disabled states, empty input prevention)
- Component tests for CitationLink (click events, tooltip display)

---

**Important:** All components must use Tailwind CSS classes consistent with the existing application. No new CSS frameworks or component libraries should be introduced.
