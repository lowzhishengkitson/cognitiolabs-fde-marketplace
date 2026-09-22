import type { Listing } from "@/data/listings";
import type { SearchIntent } from "./search-intent";

function matchesHardConstraints(item: Listing, intent: SearchIntent): boolean 
{
  return (intent.minPrice === undefined || item.price >= intent.minPrice)
    && (intent.maxPrice === undefined || item.price <= intent.maxPrice)
    && (intent.minRamGB === undefined || item.ramGB >= intent.minRamGB)
    && (intent.minStorageGB === undefined || item.storageGB >= intent.minStorageGB)
    && (intent.maxWeightKg === undefined || item.weightKg <= intent.maxWeightKg)
    && (intent.brand === undefined || item.brand.toLowerCase() === intent.brand.toLowerCase())
    && (intent.condition === undefined || item.condition === intent.condition);
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
  return catalogue.map((item, index) => ({ item, index }))
    .filter(({ item }) => matchesHardConstraints(item, intent))
    .sort((a, b) => score(b.item, intent) - score(a.item, intent) || a.index - b.index)
    .map(({ item }) => item);
}
