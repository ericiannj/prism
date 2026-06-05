import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock tools so the loop doesn't need a real DB for the search step
vi.mock("../lib/tools.js", () => ({
  TOOL_DEFINITIONS: [],
  executeSearchEmbeddings: vi.fn().mockResolvedValue("Paris is the capital of France."),
  executeSearchWeb: vi
    .fn()
    .mockResolvedValue("[1] AI News\nhttps://example.com/ai\nLatest developments in AI."),
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

  it("returns source=web when LLM calls only search_web", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
                      id: "call_web_1",
                      type: "function",
                      function: {
                        name: "search_web",
                        arguments: JSON.stringify({ query: "AI news this week" }),
                      },
                    },
                  ],
                },
                finish_reason: "tool_calls",
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Here is the latest AI news.",
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
      [{ role: "user", content: "What happened in AI this week?" }],
      "user-1"
    );

    expect(result.source).toBe("web");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].function.name).toBe("search_web");
    expect(result.toolCalls[0].result).toBe(
      "[1] AI News\nhttps://example.com/ai\nLatest developments in AI."
    );
  });

  it("returns source=mixed when LLM calls both tools in the same turn", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
                      id: "call_emb_1",
                      type: "function",
                      function: {
                        name: "search_embeddings",
                        arguments: JSON.stringify({ query: "project details" }),
                      },
                    },
                    {
                      id: "call_web_1",
                      type: "function",
                      function: {
                        name: "search_web",
                        arguments: JSON.stringify({ query: "project latest news" }),
                      },
                    },
                  ],
                },
                finish_reason: "tool_calls",
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Here is the combined answer.",
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
      [{ role: "user", content: "Tell me about the project and its latest news." }],
      "user-1"
    );

    expect(result.source).toBe("mixed");
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls.map((tc) => tc.function.name)).toContain("search_embeddings");
    expect(result.toolCalls.map((tc) => tc.function.name)).toContain("search_web");
  });

  it("includes the tool execution result in each returned toolCall", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
                        arguments: JSON.stringify({ query: "France" }),
                      },
                    },
                  ],
                },
                finish_reason: "tool_calls",
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { role: "assistant", content: "Answer.", tool_calls: undefined },
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

    expect(result.toolCalls[0].result).toBe("Paris is the capital of France.");
  });
});
