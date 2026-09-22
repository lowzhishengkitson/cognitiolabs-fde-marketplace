import assert from "node:assert/strict";
import test from "node:test";
import { listings } from "../../data/listings";
import { searchCatalogue } from "../../lib/search/catalogue";
import { searchIntentSchema } from "../../lib/search/intent/schema";
import { parseLocally } from "../../lib/search/intent/local";
import { parseModelIntentResponse } from "../../lib/search/intent/model-response";
import { resolveSearchIntent } from "../../lib/search/intent/fallback";

test("rejects malformed and contradictory model output", () => {
  assert.equal(searchIntentSchema.safeParse({ maxPrice: "800" }).success, false);
  assert.equal(searchIntentSchema.safeParse({ minPrice: 1000, maxPrice: 800 }).success, false);
  assert.equal(searchIntentSchema.safeParse({ maxPrice: 800, hallucinatedField: true }).success, false);
  assert.equal(searchIntentSchema.safeParse({ minRamGB: 1_000_000 }).success, true);
  assert.equal(searchIntentSchema.safeParse({ minRamGB: 1_000_000_001 }).success, false);
  assert.equal(searchIntentSchema.safeParse({ minStorageGB: -1 }).success, false);
  assert.equal(searchIntentSchema.safeParse({ maxWeightKg: 0 }).success, false);
});

test("valid model JSON is parsed into SearchIntent", () => {
  const intent = parseModelIntentResponse({ choices: [{ message: { content: JSON.stringify({ maxPrice: 800, minRamGB: 16, useCase: "programming", preferences: ["lightweight", "student"] }) } }] });
  assert.deepEqual(intent, { maxPrice: 800, minRamGB: 16, useCase: "programming", preferences: ["lightweight", "student"] });
});

test("invalid provider response and invented fields are rejected", () => {
  assert.throws(() => parseModelIntentResponse({ choices: [{ message: { content: "not JSON" } }] }));
  assert.throws(() => parseModelIntentResponse({ choices: [{ message: { content: '{"maxPrice":-50}' } }] }));
  assert.throws(() => parseModelIntentResponse({ choices: [{ message: { content: '{"listingIds":["made-up"]}' } }] }));
});

test("model failure uses the existing local parser", async () => {
  let failures = 0;
  const result = await resolveSearchIntent("under $800, at least 16GB RAM", async () => { throw new Error("Mock gateway unavailable"); }, () => { failures += 1; });
  assert.equal(result.source, "local-fallback");
  assert.equal(result.intent.maxPrice, 800);
  assert.equal(result.intent.minRamGB, 16);
  assert.equal(failures, 1);
  const matches = searchCatalogue(listings, result.intent);
  assert.ok(matches.some(({ id }) => id === "envy-x360"));
  assert.ok(matches.every((item) => item.price <= 800 && item.ramGB >= 16));
});

test("valid model intent takes precedence over local interpretation", async () => {
  const result = await resolveSearchIntent("cheap laptop", async () => ({ maxPrice: 600 }), () => assert.fail("Unexpected fallback"));
  assert.equal(result.source, "llm");
  const matches = searchCatalogue(listings, result.intent);
  assert.ok(matches.some(({ id }) => id === "latitude-5420"));
  assert.ok(matches.every((item) => item.price <= 600));
});

test("local fallback extracts the example query without treating RAM as minimum price", () => {
  const intent = parseLocally("I need a lightweight laptop under $800 with at least 16GB RAM for programming");
  assert.equal(intent.maxPrice, 800);
  assert.equal(intent.minPrice, undefined);
  assert.equal(intent.minRamGB, 16);
  assert.equal(intent.useCase, "programming");
  assert.deepEqual(intent.preferences, ["lightweight"]);
  const matches = searchCatalogue(listings, intent);
  assert.ok(matches.some(({ id }) => id === "envy-x360"));
  assert.ok(matches.every((item) => item.price <= 800 && item.ramGB >= 16));
});

test("local parser recognizes explicit sorting and numerical constraints", () => {
  assert.deepEqual(parseLocally("laptops below 1.6kg, sorted by weight ascending").sort, { field: "weightKg", direction: "asc" });
  assert.equal(parseLocally("laptops below 1.6kg, sorted by weight ascending").maxWeightKg, 1.6);
  assert.deepEqual(parseLocally("laptops under $800, cheapest first").sort, { field: "price", direction: "asc" });
  assert.equal(parseLocally("16GB laptops, most expensive first").minRamGB, 16);
  assert.deepEqual(parseLocally("16GB laptops, most expensive first").sort, { field: "price", direction: "desc" });
  assert.deepEqual(parseLocally("laptops below 1.6kg, sorted in ascending order").sort, { field: "weightKg", direction: "asc" });
  for (const [query, field, direction] of [
    ["lightest first", "weightKg", "asc"], ["heaviest first", "weightKg", "desc"],
    ["lowest weight", "weightKg", "asc"], ["highest weight", "weightKg", "desc"],
    ["ascending by price", "price", "asc"], ["descending by price", "price", "desc"],
    ["sort by RAM descending", "ramGB", "desc"], ["best battery health first", "batteryHealth", "desc"],
    ["sort by storage ascending", "storageGB", "asc"],
  ] as const) assert.deepEqual(parseLocally(query).sort, { field, direction }, query);
  assert.deepEqual(parseLocally("lightweight laptop for Unity").sort, { field: "weightKg", direction: "asc" });
});

test("qualitative numeric preferences create deterministic sorts without thresholds", () => {
  for (const [query, field, direction] of [
    ["Laptops which are low weight", "weightKg", "asc"],
    ["light laptops", "weightKg", "asc"],
    ["lighter laptops", "weightKg", "asc"],
    ["lightweight laptops", "weightKg", "asc"],
    ["portable laptops", "weightKg", "asc"],
    ["laptops with high battery health", "batteryHealth", "desc"],
    ["laptops with good battery health", "batteryHealth", "desc"],
    ["laptops with lots of RAM", "ramGB", "desc"],
    ["laptops with high RAM", "ramGB", "desc"],
    ["laptops with more RAM", "ramGB", "desc"],
    ["laptops with lots of storage", "storageGB", "desc"],
    ["laptops with large storage", "storageGB", "desc"],
    ["cheap laptops", "price", "asc"],
    ["inexpensive laptops", "price", "asc"],
    ["affordable laptops", "price", "asc"],
  ] as const) {
    const intent = parseLocally(query);
    assert.deepEqual(intent.sort, { field, direction }, query);
    assert.equal(intent.maxWeightKg, undefined, query);
    assert.equal(intent.maxPrice, undefined, query);
  }
  assert.deepEqual(parseLocally("Laptops which are low weight").preferences, ["lightweight"]);
});

test("explicit sorts override qualitative sorts while numeric filters remain separate", () => {
  assert.deepEqual(parseLocally("lightweight laptops, most expensive first").sort, { field: "price", direction: "desc" });
  const light = parseLocally("laptops under 1.6kg");
  assert.equal(light.maxWeightKg, 1.6);
  assert.deepEqual(light.sort, { field: "weightKg", direction: "asc" });
  const heaviest = parseLocally("laptops under 1.6kg, heaviest first");
  assert.equal(heaviest.maxWeightKg, 1.6);
  assert.deepEqual(heaviest.sort, { field: "weightKg", direction: "desc" });
});

test("sort schema rejects invalid fields and directions", () => {
  assert.equal(searchIntentSchema.safeParse({ sort: { field: "cpu", direction: "asc" } }).success, false);
  assert.equal(searchIntentSchema.safeParse({ sort: { field: "price", direction: "up" } }).success, false);
  assert.equal(searchIntentSchema.safeParse({ sort: { field: "price", direction: "asc", extra: true } }).success, false);
});

test("RAM and storage capacities preserve explicit GB/TB constraints", () => {
  assert.equal(parseLocally("at least 16GB RAM").minRamGB, 16);
  assert.equal(parseLocally("at least 1TB RAM").minRamGB, 1000);
  assert.equal(parseLocally("at least 1000TB RAM").minRamGB, 1_000_000);
  assert.equal(parseLocally("at least 999999GB RAM").minRamGB, 999_999);
  assert.equal(parseLocally("at least 2TB storage").minStorageGB, 2000);
  const malformed = parseLocally("at least 20 bananas RAM");
  assert.equal(malformed.minRamGB, undefined);
  assert.equal(malformed.minPrice, undefined);
});
