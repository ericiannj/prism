import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { embedTexts } from "../lib/embedder.js";

const fakeEmbedding = (val: number) => Array<number>(1536).fill(val);

function mockFetch(ok: boolean, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

describe("embedTexts", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      mockFetch(true, {
        data: [
          { embedding: fakeEmbedding(0.1), index: 0 },
          { embedding: fakeEmbedding(0.2), index: 1 },
        ],
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENROUTER_API_KEY;
  });

  it("returns one embedding array per input text", async () => {
    const result = await embedTexts(["hello", "world"]);
    expect(result).toHaveLength(2);
  });

  it("each embedding has 1536 dimensions", async () => {
    const result = await embedTexts(["hello"]);
    expect(result[0]).toHaveLength(1536);
  });

  it("returns embeddings in index order", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(true, {
        data: [
          { embedding: fakeEmbedding(0.9), index: 1 },
          { embedding: fakeEmbedding(0.1), index: 0 },
        ],
      })
    );
    const result = await embedTexts(["first", "second"]);
    expect(result[0][0]).toBeCloseTo(0.1);
    expect(result[1][0]).toBeCloseTo(0.9);
  });

  it("throws if OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(embedTexts(["test"])).rejects.toThrow("OPENROUTER_API_KEY");
  });

  it("throws on non-ok API response", async () => {
    vi.stubGlobal("fetch", mockFetch(false, {}));
    process.env.OPENROUTER_API_KEY = "test-key";
    await expect(embedTexts(["test"])).rejects.toThrow("OpenRouter embeddings failed");
  });
});
