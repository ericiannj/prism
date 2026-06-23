import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import * as schema from "./schema.js";

export * from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://prism:prism@localhost:5432/prism";

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations(): Promise<void> {
  await migrate(db, {
    migrationsFolder: resolve(__dirname, "../drizzle"),
  });
}
