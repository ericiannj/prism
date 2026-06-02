import { describe, it, expect, afterAll } from "vitest";
import { pool } from "../index.js";

describe("database connection", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("connects and pgvector extension is active", async () => {
    const result = await pool.query<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname = 'vector'"
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.extname).toBe("vector");
  });
});
