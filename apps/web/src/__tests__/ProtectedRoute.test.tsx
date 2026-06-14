import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";

vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

import { authClient } from "../lib/auth-client";

const mockUseSession = authClient.useSession as ReturnType<typeof vi.fn>;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading when session is pending", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected content")).toBeNull();
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("redirects to /login when not authenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });

    render(
      <MemoryRouter initialEntries={["/documents"]}>
        <Routes>
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected content")).toBeNull();
    expect(screen.getByText("Login page")).toBeTruthy();
  });

  it("renders children when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", email: "a@b.com" } },
      isPending: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected content")).toBeTruthy();
  });
});
