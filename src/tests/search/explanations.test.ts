import assert from "node:assert/strict";
import test from "node:test";
import { getListing } from "../../data/listings";
import { getMatchReasons } from "../../lib/search/explanations";
import { parseLocally } from "../../lib/search/intent/local";

function reasons(id: string, query: string): string[] {
  const listing = getListing(id);
  assert.ok(listing);
  return getMatchReasons(listing, parseLocally(query));
}

test("numeric hard constraints produce grounded field-specific reasons", () => {
  assert.deepEqual(reasons("envy-x360", "under $800"), ["Within your S$800 budget"]);
  assert.deepEqual(reasons("envy-x360", "at least 16GB RAM"), ["16GB RAM meets your 16GB minimum"]);
  assert.deepEqual(reasons("envy-x360", "at least 15-inch screen"), ["15.6-inch screen meets your minimum"]);
});

test("CPU and GPU explanations reuse actual catalogue component values", () => {
  assert.deepEqual(reasons("legion-5-15ach6", "RTX laptop"), ["NVIDIA GeForce RTX 3060 graphics matches your RTX requirement"]);
  assert.deepEqual(reasons("thinkpad-t14", "Intel CPU"), ["Intel Core i5-1245U processor matches your Intel CPU request"]);
});

test("brand, condition, and price reasons describe only requested constraints", () => {
  const result = reasons("thinkpad-t14", "Good condition Lenovo under $1000");
  assert.deepEqual(result, ["Within your S$1,000 budget", "Lenovo matches your brand request", "Good condition matches your request"]);
  assert.equal(result.some((reason) => /RAM|weight|battery|screen/i.test(reason)), false);
});

test("qualitative reasons remain explicitly soft and avoid capability claims", () => {
  assert.deepEqual(reasons("x1-carbon-g9", "lightweight laptop"), ["1.13kg supports your lightweight preference"]);
  const programming = reasons("thinkpad-t14", "programming laptop");
  assert.deepEqual(programming, ["Relevant to your programming search"]);
  assert.equal(programming.some((reason) => /excellent|smoothly|performance/i.test(reason)), false);
});

test("compound explanations prioritize component and numeric requirements", () => {
  assert.deepEqual(reasons("legion-5-15ach6", "RTX laptop under $1200 with at least 16GB RAM"), [
    "NVIDIA GeForce RTX 3060 graphics matches your RTX requirement",
    "16GB RAM meets your 16GB minimum",
    "Within your S$1,200 budget",
  ]);
});

test("explanation numbers come directly from the listing and intent", () => {
  const result = getMatchReasons(getListing("macbook-air-m2")!, { minRamGB: 8, maxWeightKg: 1.5 });
  assert.deepEqual(result, ["8GB RAM meets your 8GB minimum", "1.24kg is within your weight limit"]);
  assert.equal(result.join(" ").includes("32GB minimum"), false);
});
