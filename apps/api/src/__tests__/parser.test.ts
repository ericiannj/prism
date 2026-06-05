import { describe, it, expect, vi } from "vitest";
import { extractText } from "../lib/parser.js";

vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "extracted pdf text" }),
}));

describe("extractText", () => {
  it("returns raw string for .txt buffer", async () => {
    const buffer = Buffer.from("hello world");
    expect(await extractText(buffer, "notes.txt")).toBe("hello world");
  });

  it("returns raw string for .md buffer", async () => {
    const buffer = Buffer.from("# Title\n\nContent.");
    expect(await extractText(buffer, "readme.md")).toBe("# Title\n\nContent.");
  });

  it("calls pdf-parse for .pdf files and returns extracted text", async () => {
    const buffer = Buffer.from("%PDF-fake");
    const text = await extractText(buffer, "doc.pdf");
    expect(text).toBe("extracted pdf text");
  });

  it("throws for unsupported file extensions", async () => {
    const buffer = Buffer.from("data");
    await expect(extractText(buffer, "photo.jpg")).rejects.toThrow("Unsupported file type");
  });
});
