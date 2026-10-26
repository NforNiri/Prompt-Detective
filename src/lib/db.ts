import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// The only module that creates a database connection. Import it from route handlers only.

if (typeof window !== "undefined") {
  throw new Error("db was imported in the browser. It must only run in route handlers.");
}

let _sql: NeonQueryFunction<false, false> | null = null;

export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...params: unknown[]) => {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL must be set");
    }
    _sql = neon(connectionString);
  }
  return _sql(strings, ...params);
}) as NeonQueryFunction<false, false>;
