import assert from "node:assert/strict";
import test from "node:test";
import { listings } from "../../data/listings";
import { buildComparisonRows, buildComparisonSummary, clearComparison, parseComparisonIds, resolveComparisonListings, toggleComparisonId } from "../../lib/listings/comparison";

test("comparison selection adds one, adds two, and prevents a third", () => {
  const one = toggleComparisonId([], "thinkpad-t14");
  assert.deepEqual(one, { ids: ["thinkpad-t14"], limitReached: false });
  const two = toggleComparisonId(one.ids, "macbook-air-m2");
  assert.deepEqual(two, { ids: ["thinkpad-t14", "macbook-air-m2"], limitReached: false });
  const third = toggleComparisonId(two.ids, "rog-g14");
  assert.deepEqual(third, { ids: two.ids, limitReached: true });
});

test("comparison selection removes either item and clears explicitly", () => {
  const selected = ["thinkpad-t14", "macbook-air-m2"];
  assert.deepEqual(toggleComparisonId(selected, "thinkpad-t14").ids, ["macbook-air-m2"]);
  assert.deepEqual(toggleComparisonId(selected, "macbook-air-m2").ids, ["thinkpad-t14"]);
  assert.deepEqual(clearComparison(), []);
});

test("comparison route IDs resolve two valid distinct catalogue listings", () => {
  const ids = parseComparisonIds("thinkpad-t14,macbook-air-m2");
  const result = resolveComparisonListings(listings, ids);
  assert.deepEqual(result.listings.map((item) => item.id), ids);
  assert.deepEqual(result.invalidIds, []);
  assert.deepEqual(result.duplicateIds, []);
  assert.deepEqual(result.excessIds, []);
});

test("invalid, duplicate, and excess route IDs are handled without substitution", () => {
  const result = resolveComparisonListings(listings, parseComparisonIds("missing,thinkpad-t14,thinkpad-t14,macbook-air-m2,rog-g14"));
  assert.deepEqual(result.listings.map((item) => item.id), ["thinkpad-t14", "macbook-air-m2"]);
  assert.deepEqual(result.invalidIds, ["missing"]);
  assert.deepEqual(result.duplicateIds, ["thinkpad-t14"]);
  assert.deepEqual(result.excessIds, ["rog-g14"]);
});

test("numeric comparison rows highlight only deterministic differences and handle ties", () => {
  const first = listings.find((item) => item.id === "thinkpad-t14")!;
  const second = listings.find((item) => item.id === "macbook-air-m2")!;
  const rows = buildComparisonRows(first, second);
  assert.equal(rows.find((row) => row.key === "price")?.preferredIndex, 0);
  assert.equal(rows.find((row) => row.key === "weight")?.preferredIndex, 1);
  assert.equal(rows.find((row) => row.key === "ram")?.preferredIndex, 0);
  assert.equal(rows.find((row) => row.key === "storage")?.preferredIndex, 0);

  const tied = buildComparisonRows(first, { ...second, ramGB: first.ramGB }).find((row) => row.key === "ram")!;
  assert.equal(tied.tied, true);
  assert.equal(tied.preferredIndex, undefined);
});

test("comparison summaries use arithmetic facts without declaring a winner", () => {
  const first = listings.find((item) => item.id === "thinkpad-t14")!;
  const second = listings.find((item) => item.id === "macbook-air-m2")!;
  const summary = buildComparisonSummary(first, second);
  assert.deepEqual(summary, [
    "MacBook Air 13-inch M2 costs $200 more.",
    "MacBook Air 13-inch M2 is 0.12kg lighter.",
    "ThinkPad T14 Gen 3 has 8GB more RAM.",
  ]);
  assert.equal(summary.some((statement) => /winner|better|best|recommended/i.test(statement)), false);
});

test("comparison helpers never mutate seeded catalogue objects", () => {
  const before = JSON.stringify(listings);
  const first = listings[0], second = listings[1];
  buildComparisonRows(first, second);
  buildComparisonSummary(first, second);
  resolveComparisonListings(listings, [first.id, second.id]);
  assert.equal(JSON.stringify(listings), before);
});
