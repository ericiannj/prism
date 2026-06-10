import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "../pages/HomePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  it("renders the hero headline", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /questions\. answers\./i })).toBeInTheDocument();
  });

  it("renders the What is Prism section", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /a rag platform built for clarity/i })
    ).toBeInTheDocument();
  });

  it("renders the Three Sources section", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /every answer has a home/i })).toBeInTheDocument();
  });

  it("renders the How it Works section", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /simple by design/i })).toBeInTheDocument();
  });

  it("renders the final CTA section", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /ready to try it/i })).toBeInTheDocument();
  });

  it("hero CTA links to /documents", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /get started with documents/i })).toHaveAttribute(
      "href",
      "/documents"
    );
  });

  it("final CTA links to /documents", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /go to documents/i })).toHaveAttribute(
      "href",
      "/documents"
    );
  });
});
