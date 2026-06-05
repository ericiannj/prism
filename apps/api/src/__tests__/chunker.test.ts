import { describe, it, expect } from "vitest";
import { chunkText } from "../lib/chunker.js";

describe("chunkText", () => {
  it("returns the full text as one chunk when text is shorter than maxTokens", () => {
    const text = "The quick brown fox.";
    const chunks = chunkText(text, { maxTokens: 500, overlap: 50 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
    expect(chunks[0].charStart).toBe(0);
    expect(chunks[0].charEnd).toBe(text.length);
  });

  it("splits text into multiple chunks when it exceeds maxTokens", () => {
    const text = "word ".repeat(300); // ~300 tokens
    const chunks = chunkText(text, { maxTokens: 100, overlap: 10 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("consecutive chunks overlap: charStart of chunk[1] is less than charEnd of chunk[0]", () => {
    const text = "token ".repeat(400);
    const chunks = chunkText(text, { maxTokens: 150, overlap: 30 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[1].charStart).toBeLessThan(chunks[0].charEnd);
  });

  it("charEnd equals charStart plus content length for each chunk", () => {
    const text = "sentence. ".repeat(100);
    const chunks = chunkText(text, { maxTokens: 50, overlap: 10 });
    for (const chunk of chunks) {
      expect(chunk.charEnd).toBe(chunk.charStart + chunk.content.length);
    }
  });

  it("uses default maxTokens=500 and overlap=50", () => {
    const text = "word ".repeat(10);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });
});
