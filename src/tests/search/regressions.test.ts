import assert from "node:assert/strict";
import test from "node:test";
import { listings, type Listing } from "../../data/listings";
import { searchCatalogue } from "../../lib/search/catalogue";
import { getMatchReasons } from "../../lib/search/explanations";
import { parseLocally } from "../../lib/search/intent/local";
import { answerComparisonQuestion } from "../../lib/qa/comparison";
import { answerListingQuestion } from "../../lib/qa/listing";
import { answerCatalogueQuestion, parseGroundedAnswer } from "../../lib/qa/core";
import { rankBySimilarity, type ScoredListing } from "../../lib/search/retrieval/semantic";
import { searchWithFallback } from "../../lib/search/service";

const noModel = async () => { throw new Error("The model must not be called"); };
const noRetrieval = async (): Promise<ScoredListing[]> => { throw new Error("Retrieval must not be called"); };

function assertOrdered(values: number[], direction: "asc" | "desc", message: string) {
  const expected = [...values].sort((a, b) => direction === "asc" ? a - b : b - a);
  assert.deepEqual(values, expected, message);
}

test("numeric intent matrix preserves typed constraints, strictness, and price isolation", () => {
  const cases = [
    ["under $800", "maxPrice", 800, true],
    ["at least $500", "minPrice", 500, false],
    ["budget of 900", "maxPrice", 900, false],
    ["at least 16GB RAM", "minRamGB", 16, false],
    ["at most 16GB RAM", "maxRamGB", 16, false],
    ["more than 16GB RAM", "minRamGB", 16, true],
    ["under 16GB RAM", "maxRamGB", 16, true],
    ["at least 1TB RAM", "minRamGB", 1000, false],
    ["at least 1000TB RAM", "minRamGB", 1_000_000, false],
    ["at least 1TB storage", "minStorageGB", 1000, false],
    ["under 1TB storage", "maxStorageGB", 1000, true],
    ["at least 2TB storage", "minStorageGB", 2000, false],
    ["under 1.5kg", "maxWeightKg", 1.5, true],
    ["above 2kg", "minWeightKg", 2, true],
    ["at least 15 inch screen", "minScreenSizeInches", 15, false],
    ["at least 15-inch screen", "minScreenSizeInches", 15, false],
    ["at least 15.6in screen", "minScreenSizeInches", 15.6, false],
    ["screen at least 15 inches", "minScreenSizeInches", 15, false],
    ["battery health at least 85%", "minBatteryHealth", 85, false],
  ] as const;

  for (const [query, field, value, strict] of cases) {
    const intent = parseLocally(query);
    assert.equal(intent[field], value, query);
    assert.equal(intent.exclusiveBounds?.includes(field) ?? false, strict, `${query}: strictness`);
    if (!field.toLowerCase().includes("price")) {
      assert.equal(intent.minPrice, undefined, `${query}: minPrice collision`);
      assert.equal(intent.maxPrice, undefined, `${query}: maxPrice collision`);
    }
  }
});

test("historical capacity and measurement bugs cannot broaden the eligible catalogue", () => {
  for (const query of ["at least 1TB RAM", "at least 1000TB RAM", "at least 999999GB RAM"])
    assert.deepEqual(searchCatalogue(listings, parseLocally(query)), [], query);

  const compound = parseLocally("under $1000 with at least 15 inch screen");
  assert.deepEqual({ maxPrice: compound.maxPrice, minScreenSizeInches: compound.minScreenSizeInches }, { maxPrice: 1000, minScreenSizeInches: 15 });
  assert.equal(compound.minPrice, undefined);
  const results = searchCatalogue(listings, compound);
  assert.ok(results.length > 0);
  assert.ok(results.every((item) => item.price < 1000 && item.screenSizeInches >= 15));
});

test("component-family queries remain field-specific and model-specific queries stay narrow", () => {
  const cases = [
    ["RTX laptops", "gpu", /\brtx\b/i],
    ["RTX 3060 laptops", "gpu", /\brtx\s+3060\b/i],
    ["GTX laptops", "gpu", /\bgtx\b/i],
    ["NVIDIA GPU", "gpu", /\bnvidia|geforce|rtx|gtx\b/i],
    ["Radeon laptops", "gpu", /\bradeon\b/i],
    ["AMD GPU", "gpu", /\bamd|radeon|\brx\b/i],
    ["Intel CPU", "cpu", /\bintel\b/i],
    ["i7 laptops", "cpu", /\bcore\s+i7\b/i],
    ["Ryzen laptops", "cpu", /\bryzen\b/i],
    ["Ryzen 7", "cpu", /\bryzen\s+7\b/i],
    ["AMD CPU", "cpu", /\bamd|ryzen\b/i],
  ] as const;
  for (const [query, field, pattern] of cases) {
    const results = searchCatalogue(listings, parseLocally(query));
    assert.ok(results.length > 0, query);
    assert.ok(results.every((item) => pattern.test(item[field])), query);
  }
  assert.ok(searchCatalogue(listings, parseLocally("RTX laptops")).every((item) => !/\bgtx\b/i.test(item.gpu)));
  assert.ok(searchCatalogue(listings, parseLocally("RTX 3060 laptops")).every((item) => !/rtx\s+(?:3050|4060)/i.test(item.gpu)));

  const arc = { ...listings[0], id: "arc-test", cpu: "AMD Ryzen 7 5800U", gpu: "Intel Arc A370M" };
  assert.deepEqual(searchCatalogue([arc], parseLocally("Intel CPU")), []);
  assert.equal(searchCatalogue([arc], parseLocally("Intel Arc"))[0]?.id, arc.id);
  const amdCpuNvidiaGpu = { ...listings[0], id: "amd-cpu-test", cpu: "AMD Ryzen 7 5800U", gpu: "NVIDIA GeForce RTX 3060" };
  assert.deepEqual(searchCatalogue([amdCpuNvidiaGpu], parseLocally("AMD GPU")), []);
});

test("deterministic sorting matrix and compound filters operate in filter-then-sort order", () => {
  const sorts = [
    ["cheapest", "price", "asc"], ["most expensive", "price", "desc"],
    ["lightest", "weightKg", "asc"], ["heaviest", "weightKg", "desc"],
    ["most RAM", "ramGB", "desc"], ["least RAM", "ramGB", "asc"],
    ["most storage", "storageGB", "desc"], ["largest screen", "screenSizeInches", "desc"],
    ["smallest screen", "screenSizeInches", "asc"], ["highest battery health", "batteryHealth", "desc"],
  ] as const;
  for (const [query, field, direction] of sorts) {
    const results = searchCatalogue(listings, parseLocally(query));
    assertOrdered(results.map((item) => item[field]), direction, query);
  }

  const compounds = [
    ["16GB RAM, cheapest first", (item: Listing) => item.ramGB >= 16, "price", "asc"],
    ["under $1000 with the most storage", (item: Listing) => item.price < 1000, "storageGB", "desc"],
    ["RTX under $1200, cheapest first", (item: Listing) => /\brtx\b/i.test(item.gpu) && item.price < 1200, "price", "asc"],
    ["Ryzen laptop with largest screen", (item: Listing) => /\bryzen\b/i.test(item.cpu), "screenSizeInches", "desc"],
  ] as const;
  for (const [query, eligible, field, direction] of compounds) {
    const results = searchCatalogue(listings, parseLocally(query));
    assert.ok(results.length > 0, query);
    assert.ok(results.every(eligible), query);
    assertOrdered(results.map((item) => item[field]), direction, query);
  }
});

test("qualitative requests create preferences without inventing hard thresholds", () => {
  for (const query of ["lightweight laptops", "low weight laptops", "portable laptop"]) {
    const intent = parseLocally(query);
    assert.deepEqual(intent.sort, { field: "weightKg", direction: "asc" }, query);
    assert.equal(intent.maxWeightKg, undefined, query);
  }
  assert.equal(parseLocally("good for programming").useCase, "programming");
  assert.equal(parseLocally("gaming laptop").useCase, "gaming");
  const student = parseLocally("university student who travels");
  assert.equal(student.useCase, "student");
  assert.deepEqual(student.preferences, ["lightweight"]);
  assert.equal(student.maxWeightKg, undefined);
});

test("semantic and fallback paths preserve identical hard-filter eligibility", async () => {
  const retrieve = async (_query: string, options: { catalogue: readonly Listing[]; intent: ReturnType<typeof parseLocally> }) => {
    const vectors = options.catalogue.map((_item, index) => [index + 1, 1]);
    return rankBySimilarity(options.catalogue, vectors, [1, 0], options.intent);
  };
  for (const query of ["under $800 with at least 16GB RAM", "RTX laptop under $1200", "at least 15-inch screen"]) {
    const semantic = await searchWithFallback(query, listings, retrieve, () => assert.fail("Unexpected semantic failure"));
    const fallback = await searchWithFallback(query, listings, async () => { throw new Error("offline"); }, () => "gateway-error");
    assert.deepEqual(new Set(semantic.listings.map((item) => item.id)), new Set(fallback.listings.map((item) => item.id)), query);
  }
});

test("match explanations use only requested values and keep semantic relevance soft", () => {
  const budget = listings.find((item) => item.price < 800)!;
  assert.deepEqual(getMatchReasons(budget, parseLocally("under $800")), ["Within your S$800 budget"]);
  const ram = listings.find((item) => item.ramGB >= 16)!;
  assert.match(getMatchReasons(ram, parseLocally("at least 16GB RAM")).join(" "), /16GB minimum/);
  assert.doesNotMatch(getMatchReasons(ram, parseLocally("at least 16GB RAM")).join(" "), /32GB minimum/);
  const rtx = listings.find((item) => /\brtx\b/i.test(item.gpu))!;
  assert.match(getMatchReasons(rtx, parseLocally("RTX laptop"))[0], new RegExp(rtx.gpu.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  const programming = getMatchReasons(listings[0], parseLocally("programming laptop"));
  assert.deepEqual(programming, ["Relevant to your programming search"]);
  assert.doesNotMatch(programming.join(" "), /guaranteed|excellent|smoothly/i);
});

test("global extrema ignore misleading semantic top-k and use the full catalogue", async () => {
  const misleading = async () => [{ listing: listings.find((item) => item.weightKg === 1)!, score: 1 }];
  const result = await answerCatalogueQuestion("Which laptop is the lightest and which is the heaviest?", listings, misleading, noModel);
  const extrema = result.facts.extrema;
  assert.equal(extrema.find((fact) => fact.direction === "min")?.value, Math.min(...listings.map((item) => item.weightKg)));
  assert.equal(extrema.find((fact) => fact.direction === "max")?.value, Math.max(...listings.map((item) => item.weightKg)));
  assert.ok(result.sources.every((source) => extrema.some((fact) => fact.listingIds.includes(source.id))));
});

test("catalogue comparisons cannot reverse battery values and expose all named relationships", async () => {
  const result = await answerCatalogueQuestion("Compare the Lifebook U9311 and Zenbook 13", listings, noRetrieval, noModel);
  assert.deepEqual(result.facts.computed.higherBatteryHealthIds, ["zenbook-13-ux325"]);
  assert.deepEqual(result.facts.computed.lighterIds, ["lifebook-u9311"]);
  assert.deepEqual(result.facts.computed.cheaperIds, ["zenbook-13-ux325"]);
  assert.deepEqual(result.facts.computed.higherRamIds, ["lifebook-u9311"]);
  assert.deepEqual(result.facts.computed.higherStorageIds.sort(), ["lifebook-u9311", "zenbook-13-ux325"]);
  assert.match(result.answer, /76%/);
  assert.match(result.answer, /84%/);
  assert.match(result.answer, /Zenbook 13.*higher-battery-health|Zenbook 13.*higher battery health/i);

  const ambiguous = await answerCatalogueQuestion("Compare the XPS 13 and MacBook Air M2", listings, noRetrieval, noModel);
  assert.match(ambiguous.answer, /multiple catalogue listings|specify the exact model/i);
});

test("catalogue-absent facts fail closed without retrieval or chat", async () => {
  for (const [question, expected] of [
    ["Which has the longest battery life?", /battery runtime|battery life/i],
    ["How many hours does the battery last?", /battery runtime|battery life/i],
    ["Which has the best warranty?", /warranty information is not available/i],
    ["Which has Thunderbolt?", /port and Thunderbolt information is not available/i],
  ] as const) {
    const result = await answerCatalogueQuestion(question, listings, noRetrieval, noModel);
    assert.match(result.answer, expected, question);
    assert.deepEqual(result.sources, [], question);
  }
});

test("source boundaries reject unknown IDs in every Q&A scope", async () => {
  assert.throws(() => parseGroundedAnswer({ answer: "Invented", sourceIds: ["unknown"] }, [listings[0]]));
  await assert.rejects(answerListingQuestion("Would this suit programming?", listings[0], async () => ({ answer: "Invented", sourceIds: [listings[1].id] })));
  await assert.rejects(answerComparisonQuestion("What are the trade-offs?", [listings[0], listings[1]], async () => ({ answer: "Invented", sourceIds: [listings[2].id] })));
});
