# Functional Requirements: Chat Page & Navigation Integration

## Overview

Wire the chat UI components (Feature 6.4) into a dedicated `/chat` route, add navigation access from the existing app header, and build a SourcePanel for displaying full citation details. This feature makes the chatbot accessible to users within the existing Pheydrus Combined Calculator application.

## Dependencies

- **Feature 6.4** (Chat UI Components): ChatThread, ChatInput, CitationLink, useChat hook
- **Feature 6.3** (Chat Models & Knowledge Search): ChatMessage, Citation types
- **Existing app**: Layout.tsx with header/nav/footer, React Router, routes for `/`, `/calculator`, `/results`

## User Stories

### US-1: Chat Page View

**As a** user
**I want** a dedicated chat page where I can interact with the Pheydrus AI assistant
**So that** I have a focused, full-page experience for asking questions

**Acceptance Criteria:**

- [ ] ChatPage component renders at the `/chat` route
- [ ] Page uses the useChat hook for all chat state management
- [ ] Renders ChatThread component in the main content area
- [ ] Renders ChatInput component fixed at the bottom of the chat area
- [ ] Includes a "New Chat" button that calls `clearChat()` from the useChat hook
- [ ] "New Chat" button is positioned in the page header area (not inside the thread)
- [ ] "New Chat" button is only visible when there are existing messages (hidden on empty/welcome state)
- [ ] Page fills the available viewport height within the Layout wrapper (no unnecessary scrolling of the page itself)
- [ ] Chat thread area is the scrollable element (not the entire page)
- [ ] SourcePanel is rendered conditionally when a citation is selected
- [ ] Page is wrapped inside the existing Layout component (gets header, navigation, and footer)

**Example Layout:**

```
┌─────────────────────────────────────┐
│  Header / Navigation (from Layout)  │
├─────────────────────────────────────┤
│  [New Chat]                         │
│                                     │
│  ┌─────────────────────┐  ┌──────┐ │
│  │   ChatThread         │  │Source│ │
│  │   (scrollable)       │  │Panel │ │
│  │                      │  │      │ │
│  │                      │  │      │ │
│  ├──────────────────────┤  │      │ │
│  │   ChatInput (sticky) │  │      │ │
│  └──────────────────────┘  └──────┘ │
├─────────────────────────────────────┤
│  Footer (from Layout)               │
└─────────────────────────────────────┘
```

### US-2: SourcePanel - Citation Detail Display

**As a** user
**I want** to see the full details of a cited source when I click a citation badge
**So that** I can verify the information and read more context

**Acceptance Criteria:**

- [ ] SourcePanel appears as a slide-out panel on the right side of the chat area (desktop) or a bottom sheet (mobile)
- [ ] Panel displays when a CitationLink is clicked and a citation is selected
- [ ] Panel shows the following information:
  - Document title (filename or derived title)
  - Category badge (e.g., "Course Content", "Product Catalog", "Sales Training")
  - Full text excerpt from the cited chunk
- [ ] Text content is displayed with readable formatting (preserving paragraphs and line breaks)
- [ ] Panel includes a close button (X) to dismiss it
- [ ] Clicking a different citation updates the panel content (does not stack panels)
- [ ] Panel can be dismissed by clicking outside of it (on the chat thread area)
- [ ] Panel does not obstruct the ChatInput (user can still type while panel is open)
- [ ] On mobile, panel takes full width and overlays the chat thread
- [ ] On desktop, panel takes approximately 1/3 of the chat area width, pushing or overlaying the thread

### US-3: Navigation Integration

**As a** user
**I want** to access the chat page from the main navigation
**So that** I can easily find and use the AI assistant

**Acceptance Criteria:**

- [ ] "Chat" link added to the navigation header in Layout.tsx
- [ ] Link is positioned after existing navigation items (Home, Calculator)
- [ ] Link uses the same styling as existing navigation links (consistent typography, color, hover state)
- [ ] Active state is applied when on the `/chat` route (matches existing active link behavior)
- [ ] Navigation link is visible on both desktop and mobile views
- [ ] Mobile navigation menu (if hamburger/drawer exists) includes the "Chat" link
- [ ] Clicking "Chat" navigates to `/chat` without full page reload (client-side routing)

### US-4: Route Configuration

**As a** developer
**I want** the `/chat` route properly configured in the app router
**So that** the chat page is accessible and integrates with existing routing

**Acceptance Criteria:**

- [ ] `/chat` route added to App.tsx route configuration
- [ ] Route renders ChatPage inside the Layout wrapper (consistent with `/`, `/calculator`, `/results`)
- [ ] Direct URL navigation to `/chat` works (not just via nav link)
- [ ] Browser back/forward buttons work correctly between chat and other pages
- [ ] Chat state is preserved when navigating away and returning (within the same session, if React Router retains component state)
- [ ] 404/unknown routes continue to work as before

### US-5: End-to-End User Flow

**As a** user
**I want** a seamless experience from asking a question to viewing source details
**So that** I can trust the chatbot's answers and explore further

**Acceptance Criteria:**

- [ ] User clicks "Chat" in navigation → sees welcome message with starter questions
- [ ] User types a question or clicks a starter → message appears in thread
- [ ] Loading indicator displays while waiting for first response token
- [ ] Response streams in with markdown formatting, appearing token-by-token
- [ ] Citations appear as clickable badges within the response text
- [ ] User clicks a citation badge → SourcePanel slides open with document details
- [ ] User closes SourcePanel → returns to full chat view
- [ ] User clicks "New Chat" → conversation clears, welcome message returns
- [ ] User navigates away (e.g., to Calculator) and back → chat state depends on component lifecycle (acceptable to reset)

## Visual Design Requirements

### Styling Consistency

- All new elements must use the existing gold (#9a7d4e) / deep purple (#2d2a3e) / light gray color scheme
- "New Chat" button: gold outline or ghost button style, consistent with existing app buttons
- SourcePanel: deep purple background or light gray, with gold accent borders
- Category badges in SourcePanel: small colored chips matching category (use gold for generic)
- Navigation "Chat" link: matches existing link styles exactly

### Responsive Behavior

- **Desktop (>= 768px)**: Chat thread and SourcePanel side by side; thread takes 2/3 width when panel is open
- **Mobile (< 768px)**: SourcePanel overlays the thread as a bottom sheet or full-width slide-over; close button is prominent
- ChatInput remains accessible at all viewport sizes
- "New Chat" button repositions gracefully on small screens

## Error Scenarios

- Chat page loaded with no network: Show appropriate error when user tries to send a message (handled by useChat hook)
- SourcePanel opened with malformed citation data: Display "Source unavailable" fallback message
- Navigation to `/chat` when app is in error state: Chat page should still render independently

## Performance Requirements

- `/chat` route loads within 1 second (code-split if needed)
- SourcePanel open/close animation completes within 200ms
- Navigation link addition does not increase Layout bundle size meaningfully
- Chat page does not load knowledge base data until a message is sent (lazy initialization)

## Accessibility

- SourcePanel has appropriate ARIA attributes (role="complementary" or role="dialog")
- Close button in SourcePanel has aria-label="Close source panel"
- "New Chat" button has aria-label="Start new conversation"
- Navigation "Chat" link has aria-current="page" when active
- SourcePanel focus is managed: focus moves into panel on open, returns to trigger on close
- Escape key closes the SourcePanel

## Testing Strategy

- Integration test: ChatPage renders with useChat hook, ChatThread, and ChatInput
- Component test: SourcePanel displays citation details correctly
- Component test: SourcePanel open/close behavior
- Route test: `/chat` route renders ChatPage inside Layout
- Navigation test: "Chat" link appears in header and navigates correctly
- End-to-end test: Full flow from question to citation click to SourcePanel display
- Responsive test: Layout adapts correctly at mobile and desktop breakpoints

---

**Important:** This feature is primarily a wiring/integration task. Most logic lives in the useChat hook (Feature 6.4) and the search/API services (Feature 6.3). The focus here is on page composition, routing, navigation, and the SourcePanel component.
