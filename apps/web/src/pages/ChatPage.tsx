import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Input } from "@prism/ui";
import {
  listSessions,
  getMessages,
  sendMessage,
  listDocuments,
  type ChatSession,
  type ChatMessage,
  type Document,
} from "../lib/api";
import { MessageBubble, StreamingBubble } from "../components/MessageBubble";

const VALID_SOURCES: ReadonlyArray<string> = ["parametric", "embeddings", "web", "mixed"];

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [docStats, setDocStats] = useState<{ count: number; chunks: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isInputEmpty = input.trim().length === 0;
  const showChips = isInputEmpty;

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
        onDone({ sessionId, source, toolCalls }) {
          const validSource = VALID_SOURCES.includes(source ?? "")
            ? (source as NonNullable<ChatMessage["source"]>)
            : undefined;
          const assistantMessage: ChatMessage = {
            id: `tmp-asst-${Date.now()}`,
            sessionId,
            role: "assistant",
            content: accumulatedContent,
            ...(validSource !== undefined ? { source: validSource } : {}),
            ...(toolCalls !== undefined ? { toolCalls } : {}),
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
    void listDocuments()
      .then((docs: Document[]) => {
        setDocStats({
          count: docs.length,
          chunks: docs.reduce((sum, d) => sum + d.chunkCount, 0),
        });
      })
      .catch(() => {
        /* silent fail */
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background shrink-0">
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center">
            <span className="text-[9px] font-semibold text-primary uppercase tracking-widest">
              CONVERSATIONS
            </span>
            <span className="text-[9px] bg-surface-elevated border border-border rounded-full px-1.5 py-0.5 ml-auto">
              {sessions.length}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-foreground mt-1">History</p>
          <button
            type="button"
            onClick={startNewChat}
            className="w-full text-primary text-xs h-8 rounded-lg border mt-2"
            style={{ background: "#9b6dff18", borderColor: "#9b6dff44" }}
          >
            ＋ New conversation
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3">No conversations yet.</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void selectSession(s.id)}
              aria-current={s.id === currentSessionId ? "page" : undefined}
              className={`relative w-full text-left pl-4 pr-3 py-2 rounded-md transition-colors text-[11px] truncate ${
                s.id === currentSessionId
                  ? "text-foreground bg-surface-elevated"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {s.id === currentSessionId && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{ background: "linear-gradient(to bottom, #9b6dff, #7c3aed)" }}
                />
              )}
              {s.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Session header */}
        {currentSessionId !== null && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: "radial-gradient(circle, #b084fc, #7c3aed)",
                boxShadow: "0 0 8px #9b6dff66",
              }}
            />
            <span className="text-[13px] font-semibold text-foreground truncate flex-1">
              {sessions.find((s) => s.id === currentSessionId)?.title ?? "Conversation"}
            </span>
            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <p className="text-[15px] font-semibold text-foreground text-center">
                  What do you want to explore?
                </p>
                <p className="text-[12px] text-muted-foreground text-center mb-1">
                  Prism searches across three sources
                </p>

                {/* Source cards */}
                <div className="flex flex-col gap-2">
                  {/* Parametric */}
                  <div
                    className="border rounded-xl px-4 py-3 flex items-start gap-3"
                    style={{ background: "#9b6dff08", borderColor: "#9b6dff33" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#9b6dff15" }}
                    >
                      <span className="text-[13px]">✦</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-semibold text-foreground">
                        Model knowledge
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Training data up to Aug 2025
                      </span>
                    </div>
                  </div>

                  {/* Documents */}
                  <div
                    className="border rounded-xl px-4 py-3 flex items-start gap-3"
                    style={{ background: "#0ea5e908", borderColor: "#0ea5e933" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#0ea5e915" }}
                    >
                      <span className="text-[13px]">⊟</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-semibold text-foreground">
                        Your documents
                      </span>
                      {docStats !== null && docStats.count > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {docStats.count} doc{docStats.count === 1 ? "" : "s"} · {docStats.chunks}{" "}
                          chunks indexed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Web */}
                  <div
                    className="border rounded-xl px-4 py-3 flex items-start gap-3"
                    style={{ background: "#fb923c08", borderColor: "#fb923c33" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#fb923c15" }}
                    >
                      <span className="text-[13px]">◎</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-semibold text-foreground">
                        Live web search
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Real-time results via Tavily
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
        <div className="px-4 pb-3 pt-2">
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div
              className="rounded-[12px] border p-3 flex flex-col gap-0"
              style={{
                background: "hsl(222 20% 11%)",
                borderColor: "#9b6dff55",
                boxShadow: "0 0 24px #9b6dff15, 0 4px 20px rgba(0,0,0,0.35)",
              }}
            >
              {/* Input row */}
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something…"
                  disabled={isStreaming}
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-xs"
                />
                <button
                  type="submit"
                  disabled={isStreaming || isInputEmpty}
                  className="w-7 h-7 rounded-lg border-0 flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #9b6dff)",
                    opacity: isStreaming || isInputEmpty ? 0.4 : 1,
                  }}
                >
                  <ArrowUp size={14} color="white" />
                </button>
              </div>

              {/* Chip row */}
              {showChips && (
                <div className="border-t border-border pt-2 mt-1 flex flex-wrap gap-1.5">
                  {(["summarize my docs", "search the web", "explain a concept"] as const).map(
                    (chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setInput(chip)}
                        className="text-[10px] text-muted-foreground border border-border rounded-full px-2.5 py-1 hover:text-foreground hover:border-primary transition-colors bg-transparent"
                      >
                        {chip}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
