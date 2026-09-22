import assert from "node:assert/strict";
import test from "node:test";
import { listings } from "../../data/listings";
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
