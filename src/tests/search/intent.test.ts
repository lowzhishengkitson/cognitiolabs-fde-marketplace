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
  assert.equal(searchIntentSchema.safeParse({ minRamGB: 1000 }).success, false);
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
  assert.deepEqual(searchCatalogue(listings, result.intent).map((item) => item.id), ["envy-x360"]);
});

test("valid model intent takes precedence over local interpretation", async () => {
  const result = await resolveSearchIntent("cheap laptop", async () => ({ maxPrice: 600 }), () => assert.fail("Unexpected fallback"));
  assert.equal(result.source, "llm");
  assert.deepEqual(searchCatalogue(listings, result.intent).map((item) => item.id), ["latitude-5420", "swift-3"]);
});

test("local fallback extracts the example query without treating RAM as minimum price", () => {
  const intent = parseLocally("I need a lightweight laptop under $800 with at least 16GB RAM for programming");
  assert.equal(intent.maxPrice, 800);
  assert.equal(intent.minPrice, undefined);
  assert.equal(intent.minRamGB, 16);
  assert.equal(intent.useCase, "programming");
  assert.deepEqual(intent.preferences, ["lightweight"]);
  assert.deepEqual(searchCatalogue(listings, intent).map((item) => item.id), ["envy-x360"]);
});
