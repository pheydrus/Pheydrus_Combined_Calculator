# Technical Requirements: Chat Page & Navigation Integration

## Tech Stack

- **Language**: TypeScript
- **Framework**: React 18+
- **Routing**: React Router (already configured in project)
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Testing**: Vitest + React Testing Library

## Architecture

```
src/
├── components/
│   └── chat/
│       ├── ChatPage.tsx          ← NEW
│       └── SourcePanel.tsx       ← NEW
├── components/
│   └── layout/
│       └── Layout.tsx            ← MODIFIED (add Chat nav link)
├── App.tsx                       ← MODIFIED (add /chat route)
└── __tests__/
    ├── ChatPage.test.tsx
    ├── SourcePanel.test.tsx
    └── Navigation.test.tsx
```

## Component Specifications

### ChatPage Component

**File**: `src/components/chat/ChatPage.tsx`

```typescript
function ChatPage(): JSX.Element;
```

**Internal Structure:**

```typescript
function ChatPage() {
  const { messages, sendMessage, isLoading, isStreaming, error, clearChat } = useChat();
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
  };

  const handleClosePanel = () => {
    setSelectedCitation(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-HEADER_HEIGHT-FOOTER_HEIGHT)]">
      {/* New Chat button - visible only when messages exist */}
      {messages.length > 0 && (
        <div className="flex justify-end p-2">
          <button onClick={clearChat}>New Chat</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area: thread + input */}
        <div className="flex flex-col flex-1">
          <ChatThread
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            error={error}
            onSendMessage={sendMessage}
            onCitationClick={handleCitationClick}
          />
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>

        {/* Source panel - conditionally rendered */}
        {selectedCitation && (
          <SourcePanel
            citation={selectedCitation}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </div>
  );
}
```

**Layout Integration:**

- ChatPage must calculate available height by accounting for the Layout header and footer
- Use Tailwind's `h-[calc(100vh-Xpx)]` or a CSS custom property for dynamic height
- The chat area itself should never cause the outer page to scroll — all scrolling happens within ChatThread

### SourcePanel Component

**File**: `src/components/chat/SourcePanel.tsx`

```typescript
interface SourcePanelProps {
  citation: Citation;
  onClose: () => void;
}

function SourcePanel({ citation, onClose }: SourcePanelProps): JSX.Element;
```

**Desktop Layout (>= 768px):**

- Rendered as a side panel on the right
- Width: `w-80` or `w-96` (320px or 384px)
- Slides in from the right with a CSS transition (`transform` + `transition-transform`)
- Has a subtle left border or shadow to separate from chat thread

**Mobile Layout (< 768px):**

- Rendered as a full-width overlay or bottom sheet
- Uses `fixed inset-0` or `fixed bottom-0 left-0 right-0` positioning
- Semi-transparent backdrop behind the panel
- Dismiss by clicking backdrop or close button

**Panel Content Structure:**

```typescript
<aside className="border-l border-gray-700 bg-deep-purple/50 flex flex-col">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-gray-700">
    <h3 className="text-gold font-semibold text-sm">Source</h3>
    <button onClick={onClose} aria-label="Close source panel">
      {/* X icon */}
    </button>
  </div>

  {/* Document Title */}
  <div className="p-4">
    <h4 className="text-white font-medium">{citation.documentTitle}</h4>
    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gold/20 text-gold">
      {citation.category}
    </span>
  </div>

  {/* Content */}
  <div className="flex-1 overflow-y-auto p-4">
    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
      {citation.textContent}
    </p>
  </div>
</aside>
```

**Keyboard Handling:**

```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

**Focus Management:**

- On open: focus the close button or the panel container
- On close: return focus to the CitationLink that triggered the panel (pass ref or use `document.activeElement` tracking)

### Layout.tsx Modification

**File**: `src/components/layout/Layout.tsx` (existing file — MODIFY, do not recreate)

**Changes Required:**

1. Add "Chat" to the navigation items array/JSX
2. Use the same `<NavLink>` or `<Link>` component as existing navigation items
3. Position after existing links: Home | Calculator | **Chat**

```typescript
// Example of what to add (matching existing nav link pattern):
<NavLink
  to="/chat"
  className={({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`
  }
>
  Chat
</NavLink>
```

- Match the exact className pattern used by existing nav links
- If there is a mobile hamburger menu, add "Chat" there too

### App.tsx Route Addition

**File**: `src/App.tsx` (existing file — MODIFY)

**Changes Required:**

Add the `/chat` route alongside existing routes:

```typescript
import ChatPage from './components/chat/ChatPage';

// Inside router configuration:
<Route path="/chat" element={<Layout><ChatPage /></Layout>} />
```

- Follow the exact same pattern used for `/calculator` and `/results` routes
- If Layout wraps routes at a higher level, just add: `<Route path="/chat" element={<ChatPage />} />`

## Data Flow

```
User clicks "Chat" in nav
        |
        v
React Router renders ChatPage inside Layout
        |
        v
ChatPage initializes useChat hook (empty state)
        |
        v
ChatThread shows welcome message + starter questions
        |
        v
User sends message (via ChatInput or starter question)
        |
        v
useChat.sendMessage() → search → API → stream → update messages
        |
        v
ChatThread renders messages with CitationLink badges
        |
        v
User clicks CitationLink
        |
        v
ChatPage sets selectedCitation state
        |
        v
SourcePanel renders with citation details
        |
        v
User clicks close / Escape / clicks outside
        |
        v
ChatPage clears selectedCitation → SourcePanel unmounts
```

## CSS/Tailwind Patterns

### Chat Page Container

```css
/* Full height minus header/footer */
.chat-page {
  @apply flex flex-col;
  height: calc(100vh - var(--header-height, 64px) - var(--footer-height, 48px));
}
```

If CSS custom properties are not set, use a fixed estimate or measure dynamically.

### SourcePanel Transition (Desktop)

```css
/* Slide-in from right */
.source-panel-enter {
  @apply transform translate-x-full transition-transform duration-200 ease-out;
}
.source-panel-enter-active {
  @apply translate-x-0;
}
```

Alternatively, use Tailwind's built-in transition utilities with conditional classes:

```typescript
className={`transform transition-transform duration-200 ${
  isOpen ? 'translate-x-0' : 'translate-x-full'
}`}
```

### Responsive Breakpoints

- Mobile: `< md` (< 768px) — SourcePanel overlays
- Desktop: `>= md` (768px+) — SourcePanel side-by-side

```typescript
// SourcePanel container classes
className = 'fixed inset-0 z-50 md:relative md:inset-auto md:z-auto md:w-96';
```

## Performance Considerations

- **Code Splitting**: Consider lazy-loading ChatPage with `React.lazy()` + `Suspense` since not all users will visit `/chat`

```typescript
const ChatPage = React.lazy(() => import('./components/chat/ChatPage'));

// In route config:
<Route path="/chat" element={
  <Suspense fallback={<div>Loading...</div>}>
    <ChatPage />
  </Suspense>
} />
```

- **SourcePanel Mount/Unmount**: Use conditional rendering (not `display: none`) to avoid keeping DOM nodes for hidden panel
- **Layout re-renders**: Adding a nav link should not cause re-renders of Layout children — nav links are static

## Testing Strategy

### ChatPage Integration Tests

```typescript
// Test cases:
// - Renders ChatThread and ChatInput on mount
// - "New Chat" button hidden when no messages
// - "New Chat" button visible after first message
// - clearChat resets to welcome state
// - Citation click opens SourcePanel with correct data
// - SourcePanel close returns to chat-only view
```

### SourcePanel Component Tests

```typescript
// Test cases:
// - Renders document title, category badge, and text content
// - Close button calls onClose
// - Escape key calls onClose
// - Displays fallback message for malformed citation
// - Content area is scrollable for long excerpts
```

### Route & Navigation Tests

```typescript
// Test cases:
// - /chat route renders ChatPage
// - "Chat" link appears in navigation
// - "Chat" link has active state on /chat route
// - Navigation between /chat and other routes works
// - Direct URL access to /chat renders correctly
```

## Files to Create

1. `src/components/chat/ChatPage.tsx` - Main chat page view
2. `src/components/chat/SourcePanel.tsx` - Citation detail side panel

## Files to Modify

1. `src/components/layout/Layout.tsx` - Add "Chat" navigation link
2. `src/App.tsx` - Add `/chat` route

## Migration Checklist

- [ ] ChatPage component created with useChat integration
- [ ] SourcePanel component created with citation display
- [ ] "Chat" link added to Layout navigation (desktop and mobile)
- [ ] `/chat` route added to App.tsx router configuration
- [ ] ChatPage fills viewport height correctly within Layout
- [ ] SourcePanel slide-in/out animation working
- [ ] SourcePanel responsive behavior (side panel on desktop, overlay on mobile)
- [ ] "New Chat" button clears conversation
- [ ] Escape key and outside click dismiss SourcePanel
- [ ] Focus management on SourcePanel open/close
- [ ] All components styled consistently with gold/purple theme
- [ ] Code splitting configured for ChatPage (lazy loading)
- [ ] Integration tests passing
- [ ] Route navigation verified (direct URL, nav links, back/forward)

---

**Important Note**: This feature is the final wiring step that makes the chatbot user-accessible. Minimize new logic here — delegate to useChat (Feature 6.4) for state and to search/API services (Feature 6.3) for data operations.
