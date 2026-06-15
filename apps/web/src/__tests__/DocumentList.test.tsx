import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentList } from "../components/DocumentList";
import type { Document } from "../lib/api";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-1",
    name: "test.pdf",
    type: "pdf",
    sizeBytes: 512000,
    status: "ready",
    chunkCount: 10,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe("DocumentList", () => {
  const noop = vi.fn().mockResolvedValue(undefined);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the empty state when no documents", () => {
    render(<DocumentList documents={[]} onDelete={noop} />);
    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
  });

  it("renders document name", () => {
    render(<DocumentList documents={[makeDoc()]} onDelete={noop} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("renders ready badge", () => {
    render(<DocumentList documents={[makeDoc()]} onDelete={noop} />);
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it("renders chunk and size pills for ready documents", () => {
    render(
      <DocumentList documents={[makeDoc({ chunkCount: 10, sizeBytes: 512000 })]} onDelete={noop} />
    );
    expect(screen.getByText("10 chunks")).toBeInTheDocument();
    expect(screen.getByText("500.0 KB")).toBeInTheDocument();
  });

  it("renders extracting pill for processing documents, not chunk pills", () => {
    render(
      <DocumentList
        documents={[makeDoc({ status: "processing", chunkCount: 0 })]}
        onDelete={noop}
      />
    );
    expect(screen.getByText("extracting & embedding…")).toBeInTheDocument();
    expect(screen.queryByText(/chunks/)).not.toBeInTheDocument();
  });

  it("renders section header with doc count and ready chunk total", () => {
    const docs = [
      makeDoc({ id: "1", chunkCount: 10, status: "ready" }),
      makeDoc({ id: "2", chunkCount: 5, status: "ready" }),
    ];
    render(<DocumentList documents={docs} onDelete={noop} />);
    expect(screen.getByText(/2 docs/)).toBeInTheDocument();
    expect(screen.getByText(/15 chunks/)).toBeInTheDocument();
  });

  it("excludes processing docs from chunk total in section header", () => {
    const docs = [
      makeDoc({ id: "1", chunkCount: 10, status: "ready" }),
      makeDoc({ id: "2", chunkCount: 99, status: "processing" }),
    ];
    render(<DocumentList documents={docs} onDelete={noop} />);
    const header = screen.getByTestId("section-count");
    expect(header).toHaveTextContent("10 chunks");
    expect(header).not.toHaveTextContent("99");
  });

  it("renders no pills for error status documents", () => {
    render(
      <DocumentList documents={[makeDoc({ status: "error", chunkCount: 0 })]} onDelete={noop} />
    );
    expect(screen.queryByText(/chunks/)).not.toBeInTheDocument();
    expect(screen.queryByText(/extracting/)).not.toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("renders type label for each file type", () => {
    const docs = [
      makeDoc({ id: "1", name: "a.pdf", type: "pdf" }),
      makeDoc({ id: "2", name: "b.md", type: "md" }),
      makeDoc({ id: "3", name: "c.txt", type: "txt" }),
    ];
    render(<DocumentList documents={docs} onDelete={noop} />);
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("MD")).toBeInTheDocument();
    expect(screen.getByText("TXT")).toBeInTheDocument();
  });

  it("renders a delete button for each document", () => {
    const docs = [makeDoc({ id: "1" }), makeDoc({ id: "2", name: "b.pdf" })];
    render(<DocumentList documents={docs} onDelete={noop} />);
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
  });

  it("opens delete dialog when trash button is clicked", async () => {
    const user = userEvent.setup();
    render(<DocumentList documents={[makeDoc()]} onDelete={noop} />);
    await user.click(screen.getByRole("button", { name: /delete test\.pdf/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete document?")).toBeInTheDocument();
  });

  it("calls onDelete with the document id when confirm is clicked", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<DocumentList documents={[makeDoc({ id: "doc-42" })]} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: /delete test\.pdf/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("doc-42"));
  });

  it("closes dialog when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<DocumentList documents={[makeDoc()]} onDelete={noop} />);
    await user.click(screen.getByRole("button", { name: /delete test\.pdf/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows error toast when onDelete rejects", async () => {
    const { toast } = await import("sonner");
    const onDelete = vi.fn().mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    render(<DocumentList documents={[makeDoc()]} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: /delete test\.pdf/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to delete document"));
  });
});
