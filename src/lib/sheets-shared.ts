/** Shared, runtime-safe constants/types for the Google Sheets backend. */

export const SHEET_TABLES = [
  "sellers",
  "products",
  "categories",
  "customers",
  "enquiries",
  "reviews",
] as const;

export type SheetTable = (typeof SHEET_TABLES)[number];

export type SheetCell = string | number | boolean | null;
export type SheetRow = Record<string, SheetCell>;

export const SHEETS_API_BASE_FALLBACK =
  "https://script.google.com/macros/s/AKfycbxb7xpvnV6-ZGETWYVAm4boNPvhNdfDKeqsNcUjh9AySIN0qKd3OQS9Jzp-62-HLbUG9w/exec";
