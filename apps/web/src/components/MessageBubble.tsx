import { Badge } from "@prism/ui";
import type { BadgeProps } from "@prism/ui";
import type { ChatMessage } from "../lib/api";

type SourceVariant = BadgeProps["variant"];

const SOURCE_VARIANT: Record<string, SourceVariant> = {
  parametric: "source-parametric",
  embeddings: "source-document",
  web: "source-web",
};

const SOURCE_LABEL: Record<string, string> = {
  parametric: "parametric",
  embeddings: "embeddings",
  web: "web",
  mixed: "mixed",
};

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

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
        <Badge variant={SOURCE_VARIANT[message.source] ?? "outline"}>
          {SOURCE_LABEL[message.source] ?? message.source}
        </Badge>
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
