import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble, StreamingBubble } from "../components/MessageBubble";
import type { ChatMessage } from "../lib/api";

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    sessionId: "session-1",
    role: "user",
    content: "Hello",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("MessageBubble", () => {
  it("renders user bubble with violet gradient style", () => {
    const { container } = render(<MessageBubble message={makeMessage({ role: "user" })} />);
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).not.toBeNull();
    expect(bubble).toHaveStyle({
      background: "linear-gradient(135deg, #7c3aed, #9b6dff)",
      borderRadius: "16px 16px 3px 16px",
    });
  });

  it("renders assistant bubble with parametric source tint", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: "assistant", source: "parametric" })} />
    );
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).not.toBeNull();
    expect(bubble).toHaveStyle({ background: "#9b6dff08", borderColor: "#9b6dff33" });
  });

  it("renders assistant bubble with embeddings source tint", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: "assistant", source: "embeddings" })} />
    );
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).toHaveStyle({ background: "#0ea5e908" });
  });

  it("renders assistant bubble with web source tint", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: "assistant", source: "web" })} />
    );
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).toHaveStyle({ background: "#fb923c08" });
  });

  it("renders assistant bubble with mixed source tint", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: "assistant", source: "mixed" })} />
    );
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).toHaveStyle({ background: "#c084fc08" });
  });

  it("renders assistant bubble with neutral fallback style when source is undefined", () => {
    const { container } = render(<MessageBubble message={makeMessage({ role: "assistant" })} />);
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain("bg-surface");
    expect(bubble?.className).toContain("border-border");
    expect(bubble).toHaveStyle({ borderRadius: "16px 16px 16px 3px" });
  });
});

describe("StreamingBubble", () => {
  it("renders with violet tint style and blinking cursor", () => {
    const { container } = render(<StreamingBubble content="hello" />);
    screen.getByText("hello");
    const bubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(bubble).not.toBeNull();
    expect(bubble).toHaveStyle({
      background: "#9b6dff08",
      border: "1px solid #9b6dff22",
    });
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).not.toBeNull();
  });
});
