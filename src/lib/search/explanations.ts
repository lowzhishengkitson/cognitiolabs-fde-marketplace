import type { Listing } from "@/data/listings";
import { formatStorage } from "@/lib/listings/format";
import { matchesComponentQuery } from "./components";
import type { SearchIntent } from "./intent/schema";

function formatSgd(value: number): string {
  return `S$${new Intl.NumberFormat("en-SG", { maximumFractionDigits: 2 }).format(value)}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-SG", { maximumFractionDigits: 2 }).format(value);
}

/** Returns at most three grounded reasons in explicit-constraint priority order. */
export function getMatchReasons(listing: Listing, intent: SearchIntent): string[] {
  const reasons: string[] = [];
  const add = (reason: string | undefined) => { if (reason && reasons.length < 3) reasons.push(reason); };

  if (intent.gpuQuery && matchesComponentQuery(listing.gpu, intent.gpuQuery, "gpu")) add(`${listing.gpu} graphics matches your ${intent.gpuQuery} requirement`);
  if (intent.cpuQuery && matchesComponentQuery(listing.cpu, intent.cpuQuery, "cpu")) add(`${listing.cpu} processor matches your ${intent.cpuQuery} CPU request`);

  if (intent.minRamGB !== undefined) add(`${formatNumber(listing.ramGB)}GB RAM meets your ${formatNumber(intent.minRamGB)}GB minimum`);
  if (intent.maxRamGB !== undefined) add(`${formatNumber(listing.ramGB)}GB RAM is within your ${formatNumber(intent.maxRamGB)}GB limit`);
  if (intent.minStorageGB !== undefined) add(`${formatStorage(listing.storageGB)} storage meets your ${formatStorage(intent.minStorageGB)} minimum`);
  if (intent.maxStorageGB !== undefined) add(`${formatStorage(listing.storageGB)} storage is within your ${formatStorage(intent.maxStorageGB)} limit`);
  if (intent.minWeightKg !== undefined) add(`${formatNumber(listing.weightKg)}kg meets your ${formatNumber(intent.minWeightKg)}kg minimum`);
  if (intent.maxWeightKg !== undefined) add(`${formatNumber(listing.weightKg)}kg is within your weight limit`);
  if (intent.minScreenSizeInches !== undefined) add(`${formatNumber(listing.screenSizeInches)}-inch screen meets your minimum`);
  if (intent.maxScreenSizeInches !== undefined) add(`${formatNumber(listing.screenSizeInches)}-inch screen is within your size limit`);
  if (intent.minBatteryHealth !== undefined) add(`${formatNumber(listing.batteryHealth)}% battery health meets your ${formatNumber(intent.minBatteryHealth)}% minimum`);
  if (intent.maxBatteryHealth !== undefined) add(`${formatNumber(listing.batteryHealth)}% battery health is within your ${formatNumber(intent.maxBatteryHealth)}% limit`);
  if (intent.minPrice !== undefined) add(`${formatSgd(listing.price)} meets your minimum price of ${formatSgd(intent.minPrice)}`);
  if (intent.maxPrice !== undefined) add(`Within your ${formatSgd(intent.maxPrice)} budget`);

  if (intent.brand && listing.brand.toLowerCase() === intent.brand.toLowerCase()) add(`${listing.brand} matches your brand request`);
  if (intent.condition && listing.condition === intent.condition) add(`${listing.condition} condition matches your request`);

  if ((intent.preferences ?? []).some((preference) => /lightweight|portable|travel|light/i.test(preference))) add(`${formatNumber(listing.weightKg)}kg supports your lightweight preference`);
  if (intent.useCase) add(`Relevant to your ${intent.useCase.toLowerCase()} search`);
  for (const preference of intent.preferences ?? []) {
    if (!/lightweight|portable|travel|light/i.test(preference)) add(`Relevant to your ${preference.toLowerCase()} preference`);
  }
  return reasons;
}

export function getMatchReasonsById(listings: readonly Listing[], intent: SearchIntent): Record<string, string[]> {
  return Object.fromEntries(listings.map((listing) => [listing.id, getMatchReasons(listing, intent)]));
}
