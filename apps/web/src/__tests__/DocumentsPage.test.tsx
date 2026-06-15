import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DocumentsPage } from "../pages/DocumentsPage";
import * as api from "../lib/api";
import type { Document } from "../lib/api";

vi.mock("../lib/api");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

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

describe("DocumentsPage", () => {
  beforeEach(() => {
    vi.mocked(api.listDocuments).mockResolvedValue([]);
    vi.mocked(api.deleteDocument).mockResolvedValue(undefined);
  });

  it("renders the eyebrow label", async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Knowledge Base")).toBeInTheDocument());
  });

  it("renders the page heading", async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument()
    );
  });

  it("hides stats chip when no documents", async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.queryByTestId("stats-chip")).not.toBeInTheDocument());
  });

  it("shows stats chip with correct doc and chunk counts", async () => {
    vi.mocked(api.listDocuments).mockResolvedValue([
      makeDoc({ id: "1", chunkCount: 10 }),
      makeDoc({ id: "2", chunkCount: 5 }),
    ]);
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByTestId("stats-chip")).toBeInTheDocument();
      expect(screen.getByTestId("stat-docs-value")).toHaveTextContent("2");
      expect(screen.getByTestId("stat-chunks-value")).toHaveTextContent("15");
    });
  });

  it("counts only ready docs in total chunks", async () => {
    vi.mocked(api.listDocuments).mockResolvedValue([
      makeDoc({ id: "1", chunkCount: 10, status: "ready" }),
      makeDoc({ id: "2", chunkCount: 99, status: "processing" }),
    ]);
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByTestId("stat-docs-value")).toHaveTextContent("2");
      expect(screen.getByTestId("stat-chunks-value")).toHaveTextContent("10");
      expect(screen.getByTestId("stat-chunks-value")).not.toHaveTextContent("99");
    });
  });

  it("shows skeleton while loading", () => {
    // listDocuments never resolves — loading state persists
    vi.mocked(api.listDocuments).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    // 3 skeleton rows should be visible
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders DocumentList with onDelete when documents load", async () => {
    vi.mocked(api.listDocuments).mockResolvedValue([makeDoc()]);
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("test.pdf")).toBeInTheDocument());
    // delete button should be present
    expect(screen.getByRole("button", { name: /delete test\.pdf/i })).toBeInTheDocument();
  });
});
