import assert from "node:assert/strict";
import test from "node:test";
import { listings } from "../../data/listings";
import { searchCatalogue } from "../../lib/search/catalogue";

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

