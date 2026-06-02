import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://prism:prism@localhost:5432/prism";

export const pool = new Pool({ connectionString });

export const db = drizzle(pool);
