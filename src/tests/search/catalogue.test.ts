import assert from "node:assert/strict";
import test from "node:test";
import { listings } from "../../data/listings";
import { searchCatalogue } from "../../lib/search/catalogue";

test("hard constraints are inclusive and combine as AND", () => {
  const results = searchCatalogue(listings, { maxPrice: 900, minRamGB: 16, minStorageGB: 512, maxWeightKg: 1.5, brand: "lenovo", condition: "Good" });
  assert.ok(results.some(({ id }) => id === "thinkpad-t14"));
  assert.ok(results.every((item) => item.price <= 900 && item.ramGB >= 16 && item.storageGB >= 512 && item.weightKg <= 1.5 && item.brand.toLowerCase() === "lenovo" && item.condition === "Good"));
});

test("minimum price and condition narrow results", () => {
  const results = searchCatalogue(listings, { minPrice: 1000, condition: "Like new" });
  assert.ok(results.some(({ id }) => id === "macbook-air-m2"));
  assert.ok(results.every((item) => item.price >= 1000 && item.condition === "Like new"));
});

test("impossible constraints return no matches", () => {
  assert.deepEqual(searchCatalogue(listings, { maxPrice: 400, minRamGB: 32 }), []);
});

test("impossible capacity constraints remain hard filters", () => {
  assert.deepEqual(searchCatalogue(listings, { minRamGB: 1000 }), []);
  assert.deepEqual(searchCatalogue(listings, { minRamGB: 1_000_000 }), []);
  assert.deepEqual(searchCatalogue(listings, { minRamGB: 999_999 }), []);
  assert.ok(searchCatalogue(listings, { minStorageGB: 2000 }).every((item) => item.storageGB >= 2000));
  assert.deepEqual(searchCatalogue(listings, { minRamGB: 16 }).every((item) => item.ramGB >= 16), true);
});

test("gaming favors dedicated GPU while programming favors 16GB RAM", () => {
  assert.match(searchCatalogue(listings, { useCase: "Unity development" })[0].gpu, /radeon rx|geforce|rtx|gtx/i);
  assert.ok(searchCatalogue(listings, { useCase: "programming" }).slice(0, 3).every((item) => item.ramGB >= 16));
});

test("lightweight and student preferences affect order without excluding results", () => {
  const lightweight = searchCatalogue(listings, { preferences: ["lightweight"] });
  assert.equal(lightweight[0].weightKg, Math.min(...listings.map((item) => item.weightKg)));
  assert.equal(lightweight.length, listings.length);
  assert.ok(searchCatalogue(listings, { useCase: "student" })[0].weightKg <= 1.5);
});

test("unspecified preferences preserve seed order", () => {
  assert.deepEqual(searchCatalogue(listings, {}).map((item) => item.id), listings.map((item) => item.id));
});

test("expanded numeric bounds filter inclusively and strict markers preserve inequalities", () => {
  assert.ok(searchCatalogue(listings, { maxRamGB: 16 }).every((item) => item.ramGB <= 16));
  assert.ok(searchCatalogue(listings, { maxStorageGB: 1000, exclusiveBounds: ["maxStorageGB"] }).every((item) => item.storageGB < 1000));
  assert.ok(searchCatalogue(listings, { minScreenSizeInches: 15 }).every((item) => item.screenSizeInches >= 15));
  assert.ok(searchCatalogue(listings, { maxScreenSizeInches: 14, exclusiveBounds: ["maxScreenSizeInches"] }).every((item) => item.screenSizeInches < 14));
  assert.ok(searchCatalogue(listings, { minBatteryHealth: 85 }).every((item) => item.batteryHealth >= 85));
});

test("component matching is normalized, case-insensitive, and exact to the named identifier", () => {
  const rtx4060 = searchCatalogue(listings, { gpuQuery: "RTX 4060" });
  assert.ok(rtx4060.every((item) => /rtx\s*4060/i.test(item.gpu)));
  assert.ok(rtx4060.every((item) => !/rtx\s*4070/i.test(item.gpu)));
  const ryzen7 = searchCatalogue(listings, { cpuQuery: "Ryzen 7" });
  assert.ok(ryzen7.length > 0);
  assert.ok(ryzen7.every((item) => /ryzen\s*7/i.test(item.cpu)));
  assert.ok(searchCatalogue(listings, { cpuQuery: "Intel i7" }).every((item) => /intel core i7/i.test(item.cpu)));
});

test("combined hard constraints apply before deterministic final sorting", () => {
  const gpu = searchCatalogue(listings, { gpuQuery: "RTX 4060", maxPrice: 1200, sort: { field: "price", direction: "asc" } });
  assert.ok(gpu.every((item) => /rtx\s*4060/i.test(item.gpu) && item.price <= 1200));
  assert.deepEqual(gpu.map((item) => item.price), [...gpu.map((item) => item.price)].sort((a, b) => a - b));
  const screens = searchCatalogue(listings, { minRamGB: 16, sort: { field: "screenSizeInches", direction: "desc" } });
  assert.ok(screens.every((item) => item.ramGB >= 16));
  assert.deepEqual(screens.map((item) => item.screenSizeInches), [...screens.map((item) => item.screenSizeInches)].sort((a, b) => b - a));
});
