import type { Listing } from "@/data/listings";
import type { SearchIntent } from "./intent/schema";
import { sortListings } from "./sort";

function matchesHardConstraints(item: Listing, intent: SearchIntent): boolean 
{
  const exclusive = new Set(intent.exclusiveBounds ?? []);
  const minimum = (field: Parameters<typeof exclusive.has>[0], actual: number, expected: number | undefined) => expected === undefined || (exclusive.has(field) ? actual > expected : actual >= expected);
  const maximum = (field: Parameters<typeof exclusive.has>[0], actual: number, expected: number | undefined) => expected === undefined || (exclusive.has(field) ? actual < expected : actual <= expected);
  const component = (actual: string, expected: string | undefined) => {
    if (!expected) return true;
    const normalize = (value: string) => value.toLowerCase().replace(/\b(?:core|processor|cpu|gpu|nvidia|geforce|amd)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    return ` ${normalize(actual)} `.includes(` ${normalize(expected)} `);
  };
  return minimum("minPrice", item.price, intent.minPrice)
    && maximum("maxPrice", item.price, intent.maxPrice)
    && minimum("minRamGB", item.ramGB, intent.minRamGB)
    && maximum("maxRamGB", item.ramGB, intent.maxRamGB)
    && minimum("minStorageGB", item.storageGB, intent.minStorageGB)
    && maximum("maxStorageGB", item.storageGB, intent.maxStorageGB)
    && minimum("minWeightKg", item.weightKg, intent.minWeightKg)
    && maximum("maxWeightKg", item.weightKg, intent.maxWeightKg)
    && minimum("minScreenSizeInches", item.screenSizeInches, intent.minScreenSizeInches)
    && maximum("maxScreenSizeInches", item.screenSizeInches, intent.maxScreenSizeInches)
    && minimum("minBatteryHealth", item.batteryHealth, intent.minBatteryHealth)
    && maximum("maxBatteryHealth", item.batteryHealth, intent.maxBatteryHealth)
    && (intent.brand === undefined || item.brand.toLowerCase() === intent.brand.toLowerCase())
    && (intent.condition === undefined || item.condition === intent.condition)
    && component(item.cpu, intent.cpuQuery)
    && component(item.gpu, intent.gpuQuery);
}

export function filterCatalogue(catalogue: readonly Listing[], intent: SearchIntent): Listing[] 
{
  return catalogue.filter((item) => matchesHardConstraints(item, intent));
}

function score(item: Listing, intent: SearchIntent): number 
{
  const terms = [intent.useCase, ...(intent.preferences ?? [])].filter((term): term is string => Boolean(term)).join(" ").toLowerCase();
  let points = 0;
  if (/lightweight|portable|travel|light/.test(terms)) 
    points += Math.max(0, 3 - item.weightKg) * 3;
  if (/gaming|game|unity|3d/.test(terms)) 
  {
    const dedicatedGpu = /radeon rx|geforce|rtx|gtx|arc a[0-9]/i.test(item.gpu);
    points += dedicatedGpu ? 8 : 0;
    points += Math.min(item.ramGB, 32) / 8 + Math.min(item.storageGB, 1000) / 500;
  }
  if (/student|university|school|study/.test(terms)) 
  {
    points += Math.max(0, 3 - item.weightKg) * 2;
    points += Math.max(0, 1500 - item.price) / 300;
  }
  if (/programming|coding|developer|software/.test(terms)) 
  {
    points += item.ramGB >= 16 ? 4 : 0;
    points += Math.min(item.ramGB, 32) / 8;
  }
  return points;
}

// Stable tie break avoids changing catalogue order for unspecified preferences.
export function searchCatalogue(catalogue: readonly Listing[], intent: SearchIntent): Listing[] 
{
  const ranked = catalogue.map((item, index) => ({ item, index }))
    .filter(({ item }) => matchesHardConstraints(item, intent))
    .sort((a, b) => score(b.item, intent) - score(a.item, intent) || a.index - b.index)
    .map(({ item }) => item);
  return sortListings(ranked, intent.sort, (item) => item);
}
