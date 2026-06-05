import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock tools so the loop doesn't need a real DB for the search step
vi.mock("../lib/tools.js", () => ({
  TOOL_DEFINITIONS: [],
  executeSearchEmbeddings: vi.fn().mockResolvedValue("Paris is the capital of France."),
}));

describe("runAgentLoop", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    vi.unstubAllGlobals();
  });

  it("returns source=parametric when LLM responds without calling any tool", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: "assistant", content: "Paris", tool_calls: undefined },
              finish_reason: "stop",
            },
          ],
        }),
      })
    );

    const { runAgentLoop } = await import("../services/chat.js");
    const result = await runAgentLoop(
      [{ role: "user", content: "What is the capital of France?" }],
      "user-1"
    );

    expect(result.source).toBe("parametric");
    expect(result.toolCalls).toHaveLength(0);
    expect(result.content).toBe("Paris");
  });

  it("returns source=embeddings when LLM calls search_embeddings", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // First call: LLM requests tool
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: "call_1",
                      type: "function",
                      function: {
                        name: "search_embeddings",
                        arguments: JSON.stringify({ query: "capital of France" }),
                      },
                    },
                  ],
                },
                finish_reason: "tool_calls",
              },
            ],
          }),
        })
        // Second call: LLM provides final answer after seeing tool result
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Based on your documents, Paris is the capital of France.",
                  tool_calls: undefined,
                },
                finish_reason: "stop",
              },
            ],
          }),
        })
    );

    const { runAgentLoop } = await import("../services/chat.js");
    const result = await runAgentLoop(
      [{ role: "user", content: "What does my doc say about France?" }],
      "user-1"
    );

    expect(result.source).toBe("embeddings");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].function.name).toBe("search_embeddings");
    expect(result.content).toBe("Based on your documents, Paris is the capital of France.");
  });
});
