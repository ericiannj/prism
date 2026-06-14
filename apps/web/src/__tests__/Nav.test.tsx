import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Nav } from "../components/Nav";

vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}));

function renderNav(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Nav />
    </MemoryRouter>
  );
}

describe("Nav", () => {
  it("renders the PRISM wordmark", () => {
    renderNav();
    expect(screen.getByText("Prism")).toBeInTheDocument();
  });

  it("logo is a link to /", () => {
    renderNav();
    const logo = screen.getByRole("link", { name: /prism/i });
    expect(logo).toHaveAttribute("href", "/");
  });

  it("renders Home, Documents, and Chat links", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chat" })).toBeInTheDocument();
  });

  it("Home link has aria-current=page when at /", () => {
    renderNav("/");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("Documents link has aria-current=page when at /documents", () => {
    renderNav("/documents");
    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute("aria-current", "page");
  });
});
