import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the DB module — Drizzle's fluent API is tested through integration tests.
// Here we verify tool logic, not DB wiring.
vi.mock("@prism/db", () => {
  const mockSelect = vi.fn();
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: mockSelect,
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  mockSelect.mockResolvedValue([
    { content: "Paris is the capital of France." },
    { content: "France is a country in Western Europe." },
  ]);

  return {
    db: { select: vi.fn().mockReturnValue(chain) },
    documentChunks: { userId: "user_id", content: "content", embedding: "embedding" },
    eq: vi.fn(),
    sql: vi.fn(),
  };
});

// Mock embedder — we don't want real HTTP calls
vi.mock("../lib/embedder.js", () => ({
  embedTexts: vi.fn().mockResolvedValue([Array<number>(1536).fill(0.1)]),
}));

describe("executeSearchEmbeddings", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  it("returns formatted chunk content joined by double newline", async () => {
    const { executeSearchEmbeddings } = await import("../lib/tools.js");
    const result = await executeSearchEmbeddings("capital of France", "user-1", 2);
    expect(result).toContain("[1]");
    expect(result).toContain("Paris is the capital of France.");
    expect(result).toContain("[2]");
  });

  it("returns a fallback string when no chunks found", async () => {
    const { db } = await import("@prism/db");
    const chain = (db.select as ReturnType<typeof vi.fn>)();
    // Override the last step to return empty array
    chain.limit.mockResolvedValueOnce([]);

    const { executeSearchEmbeddings } = await import("../lib/tools.js");
    const result = await executeSearchEmbeddings("something obscure", "user-1", 5);
    expect(result).toBe("No relevant documents found.");
  });
});
