import assert from "node:assert/strict";
import test from "node:test";
import { listings } from "../data/listings";
import { searchCatalogue } from "./search-catalogue";
import { searchIntentSchema } from "./search-intent";
import { parseLocally } from "./local-intent";
import { parseModelIntentResponse } from "./model-intent-response";
import { resolveSearchIntent } from "./intent-fallback";

test("hard constraints are inclusive and combine as AND", () => {
  const results = searchCatalogue(listings, { maxPrice: 900, minRamGB: 16, minStorageGB: 512, maxWeightKg: 1.5, brand: "lenovo", condition: "Good" });
  assert.deepEqual(results.map(({ id }) => id), ["thinkpad-t14"]);
});

test("minimum price and condition narrow results", () => {
  const results = searchCatalogue(listings, { minPrice: 1000, condition: "Like new" });
  assert.deepEqual(results.map(({ id }) => id), ["macbook-air-m2"]);
});

test("impossible constraints return no matches", () => {
  assert.deepEqual(searchCatalogue(listings, { maxPrice: 400, minRamGB: 32 }), []);
});

test("gaming favors dedicated GPU while programming favors 16GB RAM", () => {
  assert.equal(searchCatalogue(listings, { useCase: "Unity development" })[0].id, "rog-g14");
  assert.ok(searchCatalogue(listings, { useCase: "programming" }).slice(0, 3).every((item) => item.ramGB >= 16));
});

test("lightweight and student preferences affect order without excluding results", () => {
  const lightweight = searchCatalogue(listings, { preferences: ["lightweight"] });
  assert.equal(lightweight[0].id, "swift-3");
  assert.equal(lightweight.length, listings.length);
  assert.equal(searchCatalogue(listings, { useCase: "student" })[0].id, "swift-3");
});

test("unspecified preferences preserve seed order", () => {
  assert.deepEqual(searchCatalogue(listings, {}).map((item) => item.id), listings.map((item) => item.id));
});

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
