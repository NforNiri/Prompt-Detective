// In-memory stand-in for the parts of the Supabase client that src/lib/puzzle-repo.ts uses:
// from().select(cols, { count, head }).eq().gte().maybeSingle() | await, and from().insert().
// It records every select so tests can assert which columns a route read.

type Row = Record<string, unknown>;

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
}

export interface FakeSupabase {
  client: { from: (table: string) => unknown };
  tables: Record<string, Row[]>;
  selects: { table: string; columns: string[] }[];
  /** When set, every call returns this error. */
  failWith: string | null;
  /** When set, only inserts return this error. */
  failInsertsWith: string | null;
}

export function createFakeSupabase(initial: Record<string, Row[]> = {}): FakeSupabase {
  const fake: FakeSupabase = {
    client: { from },
    tables: structuredClone(initial),
    selects: [],
    failWith: null,
    failInsertsWith: null,
  };

  function rows(table: string): Row[] {
    return (fake.tables[table] ??= []);
  }

  function error(): QueryResult["error"] {
    return fake.failWith ? { message: fake.failWith } : null;
  }

  function from(table: string) {
    return {
      select(columnList: string, options: { count?: string; head?: boolean } = {}) {
        const columns = columnList.split(",").map((c) => c.trim());
        fake.selects.push({ table, columns });
        const filters: ((row: Row) => boolean)[] = [];
        const pick = (row: Row) => Object.fromEntries(columns.map((c) => [c, row[c]]));
        const matches = () => rows(table).filter((row) => filters.every((f) => f(row)));

        const query = {
          eq(column: string, value: unknown) {
            filters.push((row) => row[column] === value);
            return query;
          },
          gte(column: string, value: string) {
            filters.push((row) => String(row[column]) >= value);
            return query;
          },
          maybeSingle(): Promise<QueryResult> {
            if (fake.failWith) return Promise.resolve({ data: null, error: error() });
            const found = matches();
            if (found.length > 1) return Promise.resolve({ data: null, error: { message: "multiple rows" } });
            return Promise.resolve({ data: found[0] ? pick(found[0]) : null, error: null });
          },
          then<T>(resolve: (value: QueryResult) => T, reject?: (reason: unknown) => T) {
            const found = fake.failWith ? [] : matches();
            const result: QueryResult = options.head
              ? { data: null, count: fake.failWith ? null : found.length, error: error() }
              : { data: found.map(pick), error: error() };
            return Promise.resolve(result).then(resolve, reject);
          },
        };
        return query;
      },
      insert(row: Row): Promise<QueryResult> {
        const insertError = fake.failWith ?? fake.failInsertsWith;
        if (insertError) return Promise.resolve({ data: null, error: { message: insertError } });
        rows(table).push({ ...row, created_at: new Date().toISOString() });
        return Promise.resolve({ data: null, error: null });
      },
    };
  }

  return fake;
}
