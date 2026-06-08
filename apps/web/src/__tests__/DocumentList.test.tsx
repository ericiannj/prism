import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentList } from "../components/DocumentList";
import type { Document } from "../lib/api";

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
  it("renders the empty state when no documents", () => {
    render(<DocumentList documents={[]} />);
    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
  });

  it("renders document name", () => {
    render(<DocumentList documents={[makeDoc()]} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("renders ready badge", () => {
    render(<DocumentList documents={[makeDoc()]} />);
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it("renders chunk and size pills for ready documents", () => {
    render(<DocumentList documents={[makeDoc({ chunkCount: 10, sizeBytes: 512000 })]} />);
    expect(screen.getByText("10 chunks")).toBeInTheDocument();
    expect(screen.getByText("500.0 KB")).toBeInTheDocument();
  });

  it("renders extracting pill for processing documents, not chunk pills", () => {
    render(<DocumentList documents={[makeDoc({ status: "processing", chunkCount: 0 })]} />);
    expect(screen.getByText("extracting & embedding…")).toBeInTheDocument();
    expect(screen.queryByText(/chunks/)).not.toBeInTheDocument();
  });

  it("renders section header with doc count and ready chunk total", () => {
    const docs = [
      makeDoc({ id: "1", chunkCount: 10, status: "ready" }),
      makeDoc({ id: "2", chunkCount: 5, status: "ready" }),
    ];
    render(<DocumentList documents={docs} />);
    expect(screen.getByText(/2 docs/)).toBeInTheDocument();
    expect(screen.getByText(/15 chunks/)).toBeInTheDocument();
  });

  it("excludes processing docs from chunk total in section header", () => {
    const docs = [
      makeDoc({ id: "1", chunkCount: 10, status: "ready" }),
      makeDoc({ id: "2", chunkCount: 99, status: "processing" }),
    ];
    render(<DocumentList documents={docs} />);
    const header = screen.getByTestId("section-count");
    expect(header).toHaveTextContent("10 chunks");
    expect(header).not.toHaveTextContent("99");
  });

  it("renders no pills for error status documents", () => {
    render(<DocumentList documents={[makeDoc({ status: "error", chunkCount: 0 })]} />);
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
    render(<DocumentList documents={docs} />);
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("MD")).toBeInTheDocument();
    expect(screen.getByText("TXT")).toBeInTheDocument();
  });
});
