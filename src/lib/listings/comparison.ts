import type { Listing } from "@/data/listings";
import { formatPrice, formatStorage } from "./format";

export const MAX_COMPARISON_ITEMS = 2;

export type ComparisonSelectionResult = { ids: string[]; limitReached: boolean };

export function toggleComparisonId(current: readonly string[], id: string): ComparisonSelectionResult {
  if (current.includes(id)) return { ids: current.filter((selected) => selected !== id), limitReached: false };
  if (current.length >= MAX_COMPARISON_ITEMS) return { ids: [...current], limitReached: true };
  return { ids: [...current, id], limitReached: false };
}

export function clearComparison(): string[] { return []; }

export type ComparisonResolution = {
  listings: Listing[];
  invalidIds: string[];
  duplicateIds: string[];
  excessIds: string[];
};

export function parseComparisonIds(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

export function resolveComparisonListings(catalogue: readonly Listing[], ids: readonly string[]): ComparisonResolution {
  const byId = new Map(catalogue.map((listing) => [listing.id, listing]));
  const seen = new Set<string>();
  const valid: Listing[] = [], invalidIds: string[] = [], duplicateIds: string[] = [], excessIds: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) { duplicateIds.push(id); continue; }
    seen.add(id);
    const listing = byId.get(id);
    if (!listing) { invalidIds.push(id); continue; }
    if (valid.length >= MAX_COMPARISON_ITEMS) { excessIds.push(id); continue; }
    valid.push(listing);
  }
  return { listings: valid, invalidIds, duplicateIds, excessIds };
}

export type ComparisonRow = {
  key: string;
  label: string;
  values: readonly [string, string];
  preferredIndex?: 0 | 1;
  advantage?: "Lower" | "Higher";
  tied?: boolean;
};

function numericRow(key: string, label: string, values: readonly [number, number], display: (value: number) => string, preferred: "lower" | "higher"): ComparisonRow {
  const tied = values[0] === values[1];
  const preferredIndex = tied ? undefined : (preferred === "lower" ? (values[0] < values[1] ? 0 : 1) : (values[0] > values[1] ? 0 : 1));
  return { key, label, values: [display(values[0]), display(values[1])], preferredIndex, advantage: preferred === "lower" ? "Lower" : "Higher", tied };
}

export function buildComparisonRows(first: Listing, second: Listing): ComparisonRow[] {
  return [
    numericRow("price", "Price", [first.price, second.price], formatPrice, "lower"),
    { key: "condition", label: "Condition", values: [first.condition, second.condition] },
    { key: "cpu", label: "CPU", values: [first.cpu, second.cpu] },
    { key: "gpu", label: "GPU", values: [first.gpu, second.gpu] },
    numericRow("ram", "RAM", [first.ramGB, second.ramGB], (value) => `${value}GB`, "higher"),
    numericRow("storage", "Storage", [first.storageGB, second.storageGB], formatStorage, "higher"),
    numericRow("screen", "Screen size", [first.screenSizeInches, second.screenSizeInches], (value) => `${value}″`, "higher"),
    numericRow("weight", "Weight", [first.weightKg, second.weightKg], (value) => `${value}kg`, "lower"),
    numericRow("battery", "Battery health", [first.batteryHealth, second.batteryHealth], (value) => `${value}%`, "higher"),
    { key: "location", label: "Seller location", values: [first.sellerLocation, second.sellerLocation] },
  ];
}

export function buildComparisonSummary(first: Listing, second: Listing): string[] {
  const statements: string[] = [];
  const difference = (a: number, b: number) => Math.abs(a - b);
  if (first.price !== second.price) {
    const costlier = first.price > second.price ? first : second;
    statements.push(`${costlier.model} costs ${formatPrice(difference(first.price, second.price))} more.`);
  }
  if (first.weightKg !== second.weightKg) {
    const lighter = first.weightKg < second.weightKg ? first : second;
    statements.push(`${lighter.model} is ${difference(first.weightKg, second.weightKg).toFixed(2).replace(/\.00$/, "")}kg lighter.`);
  }
  if (first.ramGB !== second.ramGB) {
    const moreRam = first.ramGB > second.ramGB ? first : second;
    statements.push(`${moreRam.model} has ${difference(first.ramGB, second.ramGB)}GB more RAM.`);
  }
  if (statements.length < 3 && first.storageGB !== second.storageGB) {
    const moreStorage = first.storageGB > second.storageGB ? first : second;
    statements.push(`${moreStorage.model} has ${formatStorage(difference(first.storageGB, second.storageGB))} more storage.`);
  }
  if (statements.length < 3 && first.batteryHealth !== second.batteryHealth) {
    const higherBattery = first.batteryHealth > second.batteryHealth ? first : second;
    statements.push(`${higherBattery.model} has ${difference(first.batteryHealth, second.batteryHealth)} percentage points higher battery health.`);
  }
  return statements.slice(0, 3);
}
