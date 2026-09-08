import { SHEETS_API_BASE_FALLBACK, type SheetRow, type SheetTable } from "@/lib/sheets-shared";

/**
 * Server-side memo for the Apps Script Web App.
 *
 * Apps Script runs one request at a time per user and can take several seconds,
 * so responses are cached in the server runtime and shared by every visitor.
 */

interface Entry {
  at: number;
  rows: SheetRow[];
}

const TTL = 3 * 60 * 1000;
const store = new Map<string, Entry>();

async function fetchTable(table: SheetTable): Promise<SheetRow[]> {
  const base = process.env["SHEETS_API_BASE"] ?? SHEETS_API_BASE_FALLBACK;
  const res = await fetch(`${base}?action=${table}`, {
    redirect: "follow",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const parsed = JSON.parse(text) as { success?: boolean; data?: SheetRow[]; error?: string };
  if (!parsed.success || !Array.isArray(parsed.data)) {
    throw new Error(parsed.error ?? "Unexpected response");
  }
  return parsed.data;
}

/** Reads tables sequentially, serving anything still fresh from memory. */
export async function readTables(
  tables: SheetTable[],
): Promise<{ rows: Record<string, SheetRow[]>; error?: string | undefined }> {
  const rows: Record<string, SheetRow[]> = {};
  let error: string | undefined;

  for (const table of tables) {
    const hit = store.get(table);
    if (hit && Date.now() - hit.at < TTL) {
      rows[table] = hit.rows;
      continue;
    }
    try {
      const fresh = await fetchTable(table);
      store.set(table, { at: Date.now(), rows: fresh });
      rows[table] = fresh;
    } catch (err) {
      // Serve stale data rather than an empty page.
      rows[table] = hit?.rows ?? [];
      error = `${table}: ${String(err)}`;
    }
  }

  return { rows, error };
}
