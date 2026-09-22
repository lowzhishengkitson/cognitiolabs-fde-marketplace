import assert from "node:assert/strict";
import test from "node:test";
import { listings, type Listing } from "../../data/listings";
import { searchWithFallback } from "../../lib/search/service";
import { cosineSimilarity, createSemanticRetriever, listingToEmbeddingText, rankBySimilarity } from "../../lib/search/retrieval/semantic";
import { classifyEmbeddingFailure, InvalidEmbeddingError, MissingEmbeddingKeyError } from "../../lib/search/retrieval/errors";

test("listing embedding text serializes only catalogue fields", () => {
  const item = listings[0];
  const text = listingToEmbeddingText(item);
  for (const value of [item.title, item.brand, item.model, String(item.price), item.cpu, item.gpu, String(item.ramGB), String(item.storageGB), String(item.screenSizeInches), String(item.weightKg), item.condition, String(item.batteryHealth), item.sellerLocation, item.description]) {
    assert.ok(text.includes(value), `Missing ${value}`);
  }
  assert.equal(text.includes("recommended"), false);
});

test("cosine similarity ranks aligned vectors and rejects invalid vectors", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
  assert.throws(() => cosineSimilarity([1, 0], [1]));
  assert.throws(() => cosineSimilarity([0, 0], [1, 0]));
});

test("semantic scores rank matches while hard constraints exclude ineligible listings", () => {
  const subset = [listings[0], listings[3], listings[4]];
  const ranked = rankBySimilarity(subset, [[1, 0], [0.9, 0.1], [0.7, 0.7]], [1, 0], { maxPrice: 800, minRamGB: 8 });
  assert.deepEqual(ranked.map(({ listing }) => listing.id), ["latitude-5420", "envy-x360"]);
  assert.ok(ranked[0].score > ranked[1].score);
});

test("retriever batches catalogue embeddings once, reuses cache and embeds each query", async () => {
  const calls: string[][] = [];
  const embed = async (texts: string[]) => {
    calls.push(texts);
    return texts.map((text) => text.includes("gaming") ? [1, 0] : [0, 1]);
  };
  const retrieve = createSemanticRetriever(embed);
  const subset = [listings[2], listings[3]];
  await Promise.all([
    retrieve("gaming", { catalogue: subset, intent: {} }),
    retrieve("budget", { catalogue: subset, intent: {} }),
  ]);
  assert.deepEqual(calls.map((input) => input.length).sort(), [1, 1, 2]);
  assert.deepEqual((await retrieve("gaming", { catalogue: subset, intent: {} })).map(({ listing }) => listing.id), ["rog-g14", "latitude-5420"]);
  assert.equal(calls.filter((input) => input.length === 2).length, 1);
});

test("failed embedding request falls back to deterministic local search", async () => {
  let failures = 0;
  const result = await searchWithFallback("under $800 with at least 16GB RAM", listings, async () => { throw new Error("Mock embedding outage"); }, () => { failures += 1; return "gateway-error"; });
  assert.equal(result.retrieval, "local-fallback");
  assert.equal(result.interpretedIntent.maxPrice, 800);
  assert.ok(result.listings.some(({ id }) => id === "envy-x360"));
  assert.ok(result.listings.every((item) => item.price <= 800 && item.ramGB >= 16));
  assert.deepEqual(result.scores, []);
  assert.equal(result.fallbackReason, "gateway-error");
  assert.equal(failures, 1);
});

test("fallback diagnostics classify failures without exposing provider text", () => {
  assert.equal(classifyEmbeddingFailure(new MissingEmbeddingKeyError("secret")), "missing-key");
  assert.equal(classifyEmbeddingFailure({ status: 401, message: "secret" }), "gateway-auth");
  assert.equal(classifyEmbeddingFailure({ status: 429, message: "secret" }), "gateway-rate-limit");
  assert.equal(classifyEmbeddingFailure({ name: "APIConnectionError", message: "secret" }), "gateway-network");
  assert.equal(classifyEmbeddingFailure(new InvalidEmbeddingError("secret")), "invalid-embedding");
});

test("successful embedding retrieval reports safe scores", async () => {
  const retrieve = createSemanticRetriever(async (texts) => texts.map((text) => text.includes("gaming") ? [1, 0] : [0, 1]));
  const result = await searchWithFallback("gaming", [listings[2], listings[3]], retrieve, () => assert.fail("Unexpected fallback"));
  assert.equal(result.retrieval, "embedding");
  assert.equal(result.listings[0].id, "rog-g14");
  assert.deepEqual(result.scores.map(({ id }) => id), result.listings.map(({ id }) => id));
});

test("hard filters and explicit sorting override semantic scores", async () => {
  const subset = [listings[0], listings[2], listings[3], listings[4]];
  const retrieve = createSemanticRetriever(async (texts) => texts.map((text) => text.includes("Unity") ? [1, 0] : [0, 1]));
  const cases = [
    ["laptops below 1.6kg, sorted by weight ascending", "weightKg", "asc", 1.6],
    ["laptops under $800, cheapest first", "price", "asc", 800],
    ["16GB laptops, most expensive first", "price", "desc", 16],
    ["portable programming laptop under $900, cheapest first", "price", "asc", 900],
  ] as const;
  for (const [query, field, direction, limit] of cases) {
    const result = await searchWithFallback(query, subset, retrieve, () => assert.fail("Unexpected fallback"));
    assert.equal(result.retrieval, "embedding");
    const values = result.listings.map((item) => item[field]);
    assert.deepEqual(values, [...values].sort((a, b) => (a - b) * (direction === "asc" ? 1 : -1)));
    assert.deepEqual(result.scores.map(({ id }) => id), result.listings.map(({ id }) => id));
    if (query.includes("1.6kg")) assert.ok(values.every((value) => value <= limit));
    if (query.includes("$")) assert.ok(result.listings.every((item) => item.price <= limit));
    if (query.includes("16GB")) assert.ok(result.listings.every((item) => item.ramGB >= limit));
  }
});

test("explicit ordering wins even when similarity strongly favors a different listing", () => {
  const subset = [listings[3], listings[4]]; // SGD 420 and SGD 760
  const vectors = [[0.1, 0.99], [1, 0]];
  const ranked = rankBySimilarity(subset, vectors, [1, 0], { sort: { field: "price", direction: "asc" } });
  assert.deepEqual(ranked.map(({ listing }) => listing.price), [420, 760]);
  assert.ok(ranked[0].score < ranked[1].score);
});

test("fallback also honors explicit sort; unsorted semantic results retain similarity order", async () => {
  const subset = [listings[0], listings[2], listings[3], listings[4]];
  const fallback = await searchWithFallback("laptops under $800, cheapest first", subset, async () => { throw Error("offline"); }, () => "gateway-error");
  assert.deepEqual(fallback.listings.map((item) => item.price), [420, 760]);
  const semantic = rankBySimilarity(subset, [[0.9, 0.1], [0.8, 0.2], [1, 0], [0.7, 0.3]], [1, 0], { useCase: "Unity development" });
  assert.deepEqual(semantic.map(({ listing }) => listing.id), ["latitude-5420", "thinkpad-t14", "rog-g14", "envy-x360"]);
});

test("semantic and fallback paths apply the same qualitative deterministic ordering", async () => {
  const retrieve = async (_query: string, options: { catalogue: readonly Listing[] }) =>
    [...options.catalogue].reverse().map((listing, index) => ({ listing, score: 1 - index / 100 }));
  const cases = [
    ["Laptops which are low weight", "weightKg", "asc"],
    ["lightweight laptops", "weightKg", "asc"],
    ["cheap laptops", "price", "asc"],
    ["laptops with high battery health", "batteryHealth", "desc"],
    ["laptops with lots of RAM", "ramGB", "desc"],
    ["lightweight laptops, most expensive first", "price", "desc"],
  ] as const;
  for (const [query, field, direction] of cases) {
    const semantic = await searchWithFallback(query, listings, retrieve, () => assert.fail("Unexpected fallback"));
    const fallback = await searchWithFallback(query, listings, async () => { throw Error("offline"); }, () => "gateway-error");
    const expected = [...listings].sort((a, b) => (a[field] - b[field]) * (direction === "asc" ? 1 : -1)).map((item) => item[field]);
    assert.deepEqual(semantic.listings.map((item) => item[field]), expected, `semantic: ${query}`);
    assert.deepEqual(fallback.listings.map((item) => item[field]), expected, `fallback: ${query}`);
  }
});

test("weight constraints filter before implicit or explicit weight ordering", async () => {
  const retrieve = createSemanticRetriever(async (texts) => texts.map((_text, index) => [index + 1, 1]));
  for (const [query, direction] of [["laptops under 1.6kg", "asc"], ["laptops under 1.6kg, heaviest first", "desc"]] as const) {
    const result = await searchWithFallback(query, listings, retrieve, () => assert.fail("Unexpected fallback"));
    assert.ok(result.listings.every((item) => item.weightKg <= 1.6));
    const weights = result.listings.map((item) => item.weightKg);
    assert.deepEqual(weights, [...weights].sort((a, b) => (a - b) * (direction === "asc" ? 1 : -1)));
  }
});

test("new structured constraints filter before semantic ranking and explicit sorting", () => {
  const subset = listings.filter((item) => /rtx 30/i.test(item.gpu)).slice(0, 5);
  const vectors = subset.map((_item, index) => [index + 1, 1]);
  const ranked = rankBySimilarity(subset, vectors, [1, 0], {
    gpuQuery: "RTX 3060", maxPrice: 1200,
    sort: { field: "price", direction: "asc" },
  });
  assert.ok(ranked.every(({ listing }) => /rtx\s*3060/i.test(listing.gpu) && listing.price <= 1200));
  assert.deepEqual(ranked.map(({ listing }) => listing.price), [...ranked.map(({ listing }) => listing.price)].sort((a, b) => a - b));
});

test("screen constraints remain authoritative through semantic retrieval", async () => {
  const retrieve = createSemanticRetriever(async (texts) => texts.map((_text, index) => [index + 1, 1]));
  const result = await searchWithFallback("at least 15 inch screen", listings, retrieve, () => assert.fail("Unexpected fallback"));
  assert.equal(result.interpretedIntent.minScreenSizeInches, 15);
  assert.equal(result.interpretedIntent.minPrice, undefined);
  assert.ok(result.listings.length > 0);
  assert.ok(result.listings.every((item) => item.screenSizeInches >= 15));
});

test("embedding and fallback paths enforce identical partial component eligibility", async () => {
  const retrieve = createSemanticRetriever(async (texts) => texts.map((_text, index) => [index + 1, 1]));
  for (const query of ["RTX laptops", "NVIDIA GPU laptops", "Radeon laptops", "Intel CPU laptops", "i7 laptops", "Ryzen 7 laptops"]) {
    const semantic = await searchWithFallback(query, listings, retrieve, () => assert.fail("Unexpected fallback"));
    const fallback = await searchWithFallback(query, listings, async () => { throw Error("offline"); }, () => "gateway-error");
    assert.deepEqual(new Set(semantic.listings.map((item) => item.id)), new Set(fallback.listings.map((item) => item.id)), query);
  }
});

test("partial component constraints remain hard filters in compound semantic queries", async () => {
  const retrieve = createSemanticRetriever(async (texts) => texts.map((_text, index) => [index + 1, 1]));
  const result = await searchWithFallback("RTX under 1.8kg, cheapest first", listings, retrieve, () => assert.fail("Unexpected fallback"));
  assert.ok(result.listings.every((item) => /\brtx\b/i.test(item.gpu) && item.weightKg < 1.8));
  assert.deepEqual(result.listings.map((item) => item.price), [...result.listings.map((item) => item.price)].sort((a, b) => a - b));
});
