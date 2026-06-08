import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadForm } from "../components/UploadForm";

vi.mock("../lib/api", () => ({
  ingest: vi.fn().mockResolvedValue({ id: "1", name: "test.pdf" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("UploadForm", () => {
  it("renders the drop zone with title and button", () => {
    render(<UploadForm onSuccess={vi.fn()} />);
    expect(screen.getByText("Drop files here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /browse files/i })).toBeInTheDocument();
  });

  it("renders the accepted file types hint", () => {
    render(<UploadForm onSuccess={vi.fn()} />);
    expect(screen.getByText("PDF, .txt or .md · Max 10 MB")).toBeInTheDocument();
  });

  it("applies dragging class on drag over", () => {
    render(<UploadForm onSuccess={vi.fn()} />);
    const dropZone = screen.getByTestId("drop-zone");
    fireEvent.dragOver(dropZone);
    expect(dropZone.className).toContain("border-primary/60");
  });

  it("removes dragging class on drag leave", () => {
    render(<UploadForm onSuccess={vi.fn()} />);
    const dropZone = screen.getByTestId("drop-zone");
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain("border-primary/60");
  });
});
