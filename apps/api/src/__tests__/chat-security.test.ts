import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock the DB before any import of chat.ts
const mockSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};
const mockInsertChain = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

vi.mock("@prism/db", () => ({
  db: {
    select: vi.fn().mockReturnValue(mockSelectChain),
    insert: vi.fn().mockReturnValue(mockInsertChain),
  },
  chatSessions: { id: "id", userId: "userId", title: "title" },
  messages: { sessionId: "sessionId", createdAt: "createdAt" },
  eq: vi.fn((col, val) => ({ col, val })),
  and: vi.fn((...args) => args),
  asc: vi.fn(),
}));

describe("getOrCreateSession — ownership enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the sessionId when DB confirms the session belongs to the requesting user", async () => {
    mockSelectChain.limit.mockResolvedValue([{ id: "session-abc" }]);

    const { getOrCreateSession } = await import("../services/chat.js");
    const result = await getOrCreateSession("session-abc", "user-1", "hello");

    expect(result).toBe("session-abc");
  });

  it("throws when the session does not belong to the requesting user", async () => {
    // DB returns empty — session doesn't belong to this user
    mockSelectChain.limit.mockResolvedValue([]);

    const { getOrCreateSession } = await import("../services/chat.js");
    await expect(getOrCreateSession("other-users-session", "user-1", "hello")).rejects.toThrow(
      "Session not found or access denied"
    );
  });

  it("creates a new session when sessionId is undefined", async () => {
    mockInsertChain.returning.mockResolvedValue([{ id: "new-session-id" }]);

    const { getOrCreateSession } = await import("../services/chat.js");
    const result = await getOrCreateSession(undefined, "user-1", "hello");

    expect(result).toBe("new-session-id");
  });
});
