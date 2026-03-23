import { useState, useEffect, Suspense, lazy } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatThread } from '../components/chat/ChatThread';
import { ChatInput } from '../components/chat/ChatInput';
import { SourcePanel } from '../components/chat/SourcePanel';
import type { Citation } from '../models/chat';
import { PRIVATE_PROMPT_OPTIONS } from '../models/chat';
import { loadMediaManifest } from '../services/chat/mediaAssets';

const DocumentViewer = lazy(() => import('../components/chat/DocumentViewer'));

const PRIVATE_ACCESS_KEY = 'PheydrusChat123';
const SESSION_KEY = 'pheydrus_private_chat_auth';

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PRIVATE_ACCESS_KEY) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onUnlock();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="private-gate">
      <div className="private-gate-card">
        <h2 className="private-gate-title">Internal CMO Access</h2>
        <p className="private-gate-subtitle">Enter the access code to continue.</p>
        <form onSubmit={handleSubmit} className="private-gate-form">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Access code"
            className={`private-gate-input ${error ? 'private-gate-input--error' : ''}`}
            autoFocus
          />
          {error && <p className="private-gate-error">Incorrect access code</p>}
          <button type="submit" className="private-gate-btn">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

export function PrivateChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [selectedPromptId, setSelectedPromptId] = useState('general');
  const selectedOption = PRIVATE_PROMPT_OPTIONS.find((o) => o.id === selectedPromptId)!;

  const { messages, isStreaming, error, sendMessage, clearChat } = useChat(
    'private',
    selectedPromptId
  );
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [viewerFile, setViewerFile] = useState<{
    publicUrl: string;
    fileName: string;
    fileType: 'pdf' | 'image' | 'text';
  } | null>(null);

  // Pre-load media manifest so lookupAsset works in ChatMessage
  useEffect(() => {
    loadMediaManifest().catch(() => {});
  }, []);

  const handleViewDocument = (
    publicUrl: string,
    fileName: string,
    fileType: 'pdf' | 'image' | 'text'
  ) => {
    setViewerFile({ publicUrl, fileName, fileType });
  };

  const handlePromptChange = (newPromptId: string) => {
    setSelectedPromptId(newPromptId);
    clearChat();
  };

  if (!isAuthenticated) {
    return <PasswordGate onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`chat-page ${selectedCitation ? 'chat-page--with-panel' : ''}`}>
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-left">
            <h1 className="chat-header-title">Knowledge Assistant</h1>
            <span className="private-badge">Internal CMO</span>
          </div>
          <div className="chat-header-right">
            <div className="prompt-selector">
              <label htmlFor="prompt-select">Mode:</label>
              <select
                id="prompt-select"
                value={selectedPromptId}
                onChange={(e) => handlePromptChange(e.target.value)}
                disabled={isStreaming}
              >
                {PRIVATE_PROMPT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {messages.length > 0 && (
              <button className="chat-new-btn" onClick={clearChat}>
                New Chat
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="chat-error">
            <span>{error}</span>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <ChatThread
          messages={messages}
          isStreaming={isStreaming}
          onCitationClick={setSelectedCitation}
          onViewDocument={handleViewDocument}
          starterQuestions={selectedOption.starterQuestions}
        />

        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>

      <SourcePanel citation={selectedCitation} onClose={() => setSelectedCitation(null)} />

      {viewerFile && (
        <Suspense
          fallback={
            <div className="doc-viewer-backdrop">
              <div className="doc-viewer-loading">Loading viewer...</div>
            </div>
          }
        >
          <DocumentViewer
            filePath={viewerFile.publicUrl}
            fileName={viewerFile.fileName}
            fileType={viewerFile.fileType}
            onClose={() => setViewerFile(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
