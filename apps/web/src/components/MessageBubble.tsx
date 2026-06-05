import { useState } from "react";
import { Badge } from "@prism/ui";
import type { BadgeProps } from "@prism/ui";
import type { ChatMessage, StoredToolCall } from "../lib/api";

type SourceVariant = BadgeProps["variant"];

const SOURCE_VARIANT: Record<string, SourceVariant> = {
  parametric: "source-parametric",
  embeddings: "source-document",
  web: "source-web",
  mixed: "source-mixed",
};

const SOURCE_LABEL: Record<string, string> = {
  parametric: "parametric",
  embeddings: "embeddings",
  web: "web",
  mixed: "mixed",
};

const TOOL_LABEL: Record<string, string> = {
  search_embeddings: "documents",
  search_web: "web",
};

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === "user";
  const toolCalls = message.toolCalls as StoredToolCall[] | null | undefined;
  const hasExpansion = Boolean(toolCalls?.length);

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-surface text-foreground rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
      {message.role === "assistant" && message.source && (
        <div className="flex flex-col gap-1.5 items-start">
          <button
            onClick={() => hasExpansion && setIsExpanded((v) => !v)}
            className={hasExpansion ? "cursor-pointer" : "cursor-default"}
            aria-expanded={hasExpansion ? isExpanded : undefined}
          >
            <Badge variant={SOURCE_VARIANT[message.source] ?? "outline"}>
              {SOURCE_LABEL[message.source] ?? message.source}
              {hasExpansion && (
                <span className="ml-1 opacity-60 text-[10px]">{isExpanded ? "▲" : "▼"}</span>
              )}
            </Badge>
          </button>
          {isExpanded && toolCalls && (
            <div className="flex flex-col gap-2 max-w-[80vw] md:max-w-lg">
              {toolCalls.map((tc) => {
                const args = JSON.parse(tc.function.arguments) as { query?: string };
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
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-surface text-foreground px-4 py-2.5 text-sm leading-relaxed">
        {content}
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse" />
      </div>
    </div>
  );
}
