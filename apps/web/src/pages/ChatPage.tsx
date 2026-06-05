import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@prism/ui";
import {
  listSessions,
  getMessages,
  sendMessage,
  type ChatSession,
  type ChatMessage,
} from "../lib/api";
import { MessageBubble, StreamingBubble } from "../components/MessageBubble";

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadSessions() {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      // Non-critical; sidebar just stays empty
    }
  }

  async function selectSession(id: string) {
    setCurrentSessionId(id);
    setError(null);
    try {
      const data = await getMessages(id);
      setMessages(data);
    } catch {
      setError("Failed to load messages");
    }
  }

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    setError(null);

    const optimisticUser: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sessionId: currentSessionId ?? "",
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    let accumulatedContent = "";

    try {
      await sendMessage(text, currentSessionId ?? undefined, {
        onToken(token) {
          accumulatedContent += token;
          setStreamingContent(accumulatedContent);
        },
        onDone({ sessionId, source }) {
          const assistantMessage: ChatMessage = {
            id: `tmp-asst-${Date.now()}`,
            sessionId,
            role: "assistant",
            content: accumulatedContent,
            source: source as ChatMessage["source"],
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent("");
          setIsStreaming(false);

          if (!currentSessionId) {
            setCurrentSessionId(sessionId);
            void loadSessions();
          }
        },
        onError(err) {
          setError(err);
          setIsStreaming(false);
          setStreamingContent("");
        },
      });
    } catch {
      setError("Request failed");
      setIsStreaming(false);
      setStreamingContent("");
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background shrink-0">
        <div className="p-3 border-b border-border">
          <Button variant="outline" className="w-full justify-start" onClick={startNewChat}>
            + New chat
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3">No conversations yet.</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => void selectSession(s.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                s.id === currentSessionId
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <span className="w-3 h-3 rounded-full bg-primary opacity-60" />
              <p className="text-sm text-muted-foreground">
                Ask anything. Prism searches your documents when relevant.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isStreaming && streamingContent && <StreamingBubble content={streamingContent} />}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && <p className="px-4 pb-2 text-xs text-destructive">{error}</p>}

        {/* Input */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="border-t border-border px-4 py-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something…"
            disabled={isStreaming}
            className="flex-1"
          />
          <Button type="submit" disabled={isStreaming || !input.trim()}>
            {isStreaming ? "…" : "Send"}
          </Button>
        </form>
      </main>
    </div>
  );
}
