import { useState } from "react";
import { Badge } from "@prism/ui";
import type { BadgeProps } from "@prism/ui";
import type { ChatMessage } from "../lib/api";

type SourceVariant = BadgeProps["variant"];

const SOURCE_VARIANT: Record<string, SourceVariant> = {
  parametric: "source-parametric",
  embeddings: "source-document",
  web: "source-web",
  mixed: "source-mixed",
};

const TOOL_LABEL: Record<string, string> = {
  search_embeddings: "documents",
  search_web: "web",
};

const ASSISTANT_BUBBLE_STYLE = { borderRadius: "16px 16px 16px 3px" } as const;

const SOURCE_COLORS: Record<string, { bg: string; border: string }> = {
  parametric: { bg: "#9b6dff08", border: "#9b6dff33" },
  embeddings: { bg: "#0ea5e908", border: "#0ea5e933" },
  web: { bg: "#fb923c08", border: "#fb923c33" },
  mixed: { bg: "#c084fc08", border: "#c084fc33" },
};

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === "user";
  const toolCalls = message.toolCalls;
  const hasExpansion = Boolean(toolCalls?.length);

  const sourceTint =
    message.role === "assistant" && message.source ? SOURCE_COLORS[message.source] : undefined;

  const assistantBubbleStyle = sourceTint
    ? { ...ASSISTANT_BUBBLE_STYLE, background: sourceTint.bg, borderColor: sourceTint.border }
    : ASSISTANT_BUBBLE_STYLE;

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 ${
          isUser
            ? "text-xs leading-[1.5] text-white"
            : sourceTint
              ? "text-xs leading-[1.55] border text-foreground"
              : "text-xs leading-[1.55] bg-surface border border-border text-foreground"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #7c3aed, #9b6dff)",
                borderRadius: "16px 16px 3px 16px",
              }
            : assistantBubbleStyle
        }
      >
        {message.content}
      </div>
      {message.role === "assistant" && message.source && (
        <div className="flex flex-col gap-1.5 items-start">
          {hasExpansion ? (
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              aria-expanded={isExpanded}
            >
              <Badge variant={SOURCE_VARIANT[message.source] ?? "outline"}>
                {message.source}
                <span className="ml-1 opacity-60 text-[10px]">{isExpanded ? "▲" : "▼"}</span>
              </Badge>
            </button>
          ) : (
            <span>
              <Badge variant={SOURCE_VARIANT[message.source] ?? "outline"}>{message.source}</Badge>
            </span>
          )}
          {isExpanded && toolCalls && (
            <div className="flex flex-col gap-2 max-w-[80vw] md:max-w-lg">
              {toolCalls.map((tc) => {
                let args: { query?: string } = {};
                try {
                  const parsed: unknown = JSON.parse(tc.function.arguments);
                  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
                    args = parsed as { query?: string };
                  }
                } catch {
                  // malformed arguments — render without query label
                }
                return (
                  <div
                    key={tc.id}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                  >
                    <p className="font-semibold text-muted-foreground mb-1.5">
                      {TOOL_LABEL[tc.function.name] ?? tc.function.name}
                      {args.query ? `: "${args.query}"` : ""}
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-foreground leading-snug">
                      {tc.result}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StreamingBubbleProps {
  content: string;
}

export function StreamingBubble({ content }: StreamingBubbleProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="max-w-[80%] text-foreground px-4 py-2.5 text-xs leading-[1.55]"
        style={{
          background: "#9b6dff08",
          border: "1px solid #9b6dff22",
          borderRadius: "16px 16px 16px 3px",
        }}
      >
        {content}
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse" />
      </div>
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="flex flex-col items-start gap-1" data-testid="thinking-bubble">
      <div
        className="px-4 py-3.5 text-foreground"
        style={{
          background: "#9b6dff08",
          border: "1px solid #9b6dff22",
          borderRadius: "16px 16px 16px 3px",
        }}
      >
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
