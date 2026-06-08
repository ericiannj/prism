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
});
