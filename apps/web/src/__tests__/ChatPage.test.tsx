import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPage } from "../pages/ChatPage";
import * as api from "../lib/api";
import type { Document } from "../lib/api";

vi.mock("../lib/api");

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-1",
    name: "test.pdf",
    type: "pdf",
    sizeBytes: 1024,
    status: "ready",
    chunkCount: 5,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  // Default mocks: sessions = [], docs = [], sendMessage never resolves
  vi.mocked(api.listSessions).mockResolvedValue([]);
  vi.mocked(api.listDocuments).mockResolvedValue([]);
  vi.mocked(api.sendMessage).mockReturnValue(new Promise(() => {}));
});

describe("ChatPage empty state", () => {
  it("shows the empty state source map when no messages", async () => {
    render(<ChatPage />);
    await waitFor(() =>
      expect(screen.getByText("What do you want to explore?")).toBeInTheDocument()
    );
    expect(screen.getByText("Model knowledge")).toBeInTheDocument();
    expect(screen.getByText("Your documents")).toBeInTheDocument();
    expect(screen.getByText("Live web search")).toBeInTheDocument();
  });

  it("shows doc count sub-line when listDocuments returns docs", async () => {
    vi.mocked(api.listDocuments).mockResolvedValue([
      makeDoc({ id: "1", chunkCount: 10 }),
      makeDoc({ id: "2", chunkCount: 5 }),
    ]);
    render(<ChatPage />);
    await waitFor(() => expect(screen.getByText("2 docs · 15 chunks indexed")).toBeInTheDocument());
  });

  it("omits doc count sub-line when listDocuments returns empty array", async () => {
    vi.mocked(api.listDocuments).mockResolvedValue([]);
    render(<ChatPage />);
    await waitFor(() => expect(screen.getByText("Your documents")).toBeInTheDocument());
    expect(screen.queryByText(/\d+ (doc|chunk)/)).not.toBeInTheDocument();
  });

  it("omits doc count sub-line when listDocuments fails", async () => {
    vi.mocked(api.listDocuments).mockRejectedValue(new Error("Network error"));
    render(<ChatPage />);
    await waitFor(() =>
      expect(screen.getByText("What do you want to explore?")).toBeInTheDocument()
    );
    expect(screen.queryByText(/chunks indexed/)).not.toBeInTheDocument();
  });
});

describe("ChatPage input chips", () => {
  it("shows chip row when input is empty", async () => {
    render(<ChatPage />);
    await waitFor(() =>
      expect(screen.getByText("What do you want to explore?")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "summarize my docs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "search the web" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "explain a concept" })).toBeInTheDocument();
  });

  it("hides chip row when input has text", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "summarize my docs" })).toBeInTheDocument()
    );
    const input = screen.getByPlaceholderText("Ask something…");
    await user.type(input, "hello");
    expect(screen.queryByRole("button", { name: "summarize my docs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "search the web" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "explain a concept" })).not.toBeInTheDocument();
  });

  it("clicking a chip pre-fills the input", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "summarize my docs" })).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "summarize my docs" }));
    const input = screen.getByPlaceholderText("Ask something…");
    expect(input).toHaveValue("summarize my docs");
    expect(screen.queryByRole("button", { name: "summarize my docs" })).not.toBeInTheDocument();
  });
});
