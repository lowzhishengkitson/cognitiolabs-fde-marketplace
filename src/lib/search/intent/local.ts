import { searchIntentSchema, type SearchIntent } from "./schema";

// Useful before model credentials are available. Only recognizes explicit patterns.
export function parseLocally(query: string): SearchIntent 
{
  const text = query.toLowerCase();
  const amount = String.raw`(?:s\$|\$|sgd\s*)?(\d+(?:\.\d+)?)(?![\d.])`;
  const numberAfter = (pattern: RegExp) => {
    const match = text.match(pattern);
    return match ? Number(match[1]) : undefined;
  };
  const minPrice = numberAfter(new RegExp(String.raw`(?:over|above|more than|at least|minimum|min)\s+${amount}(?!\s*(?:gb|tb|kg|[a-z]+\s+ram\b))`, "i"));
  const maxPrice = numberAfter(new RegExp(String.raw`(?:under|below|less than|up to|maximum|max|budget of)\s+${amount}(?!\s*(?:gb|tb|kg))`, "i"));
  const ram = text.match(/(?:at least|minimum|min|over|more than)\s+(\d+(?:\.\d+)?)\s*(gb|tb)\s*(?:of\s*)?(?:ram|memory)/i);
  const minRamGB = ram ? Number(ram[1]) * (ram[2].toLowerCase() === "tb" ? 1000 : 1)
    : numberAfter(/(?:at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*gb\b(?!\s*(?:storage|ssd))/i)
    ?? numberAfter(/\b(\d+)\s*gb\s*(?:ram\s*)?laptops?\b/i);
  const storage = text.match(/(?:at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*(tb|gb)\s*(?:of\s*)?(?:storage|ssd|disk)/i);
  const maxWeightKg = numberAfter(/(?:under|below|less than|up to|max(?:imum)?)\s+(\d+(?:\.\d+)?)\s*kg/i);
  const brand = ["Apple", "Lenovo", "ASUS", "Dell", "HP", "Acer"].find((name) => new RegExp(String.raw`\b${name}\b`, "i").test(query));
  const condition = /like.new/i.test(query) ? "Like new" as const : /\bfair\s+condition\b/i.test(query) ? "Fair" as const : /\bgood\s+condition\b/i.test(query) ? "Good" as const : undefined;
  const useCase = /unity|game development|3d/i.test(query) ? "Unity development" : /gam(?:e|ing)/i.test(query) ? "gaming" : /programm|cod(?:e|ing)|developer/i.test(query) ? "programming" : /student|university|school/i.test(query) ? "student" : undefined;
  const lightweightPreference = /\b(?:low[- ]?weight|light[- ]?weight|lightweight)\b|\b(?:light|lighter)\s+(?:laptops?|notebooks?)\b/i.test(query)
    || (/\bportable\b/i.test(query) && /\b(?:laptops?|notebooks?|computer)\b/i.test(query));
  const preferences = lightweightPreference || /\btravel(?:ling|ing)?\b/i.test(query) ? ["lightweight"] : undefined;
  const sortPhrase = text.match(/\b(?:sort(?:ed)?\s+(?:by|in)?\s*|(?:in\s+)?)(ascending|descending|asc|desc)(?:\s+(?:order|by))?\s*(?:by\s+)?(price|cost|weight|ram|memory|storage|battery(?:\s+health)?)?\b|\b(?:sort(?:ed)?\s+by\s+)(price|cost|weight|ram|memory|storage|battery(?:\s+health)?)\s+(ascending|descending|asc|desc)\b/i);
  const namedSort = text.match(/\b(cheapest|most expensive|lightest|heaviest|lowest weight|highest weight|best battery health)\s+first\b|\b(lowest|highest)\s+weight\b/i);
  const explicitSortField = namedSort ? (/cheap|expensive/.test(namedSort[0]) ? "price" : /battery/.test(namedSort[0]) ? "batteryHealth" : "weightKg")
    : sortPhrase ? (/price|cost/.test(sortPhrase[2] ?? sortPhrase[3] ?? "") ? "price" : /ram|memory/.test(sortPhrase[2] ?? sortPhrase[3] ?? "") ? "ramGB" : /storage/.test(sortPhrase[2] ?? sortPhrase[3] ?? "") ? "storageGB" : /battery/.test(sortPhrase[2] ?? sortPhrase[3] ?? "") ? "batteryHealth" : /weight/.test(sortPhrase[2] ?? sortPhrase[3] ?? "") || maxWeightKg !== undefined ? "weightKg" : undefined) : undefined;
  const explicitDirection = namedSort ? (/expensive|heaviest|highest|best/.test(namedSort[0]) ? "desc" : "asc") : sortPhrase ? (/desc/.test(sortPhrase[1] ?? sortPhrase[4] ?? "") ? "desc" : "asc") : undefined;
  const implicitSort = lightweightPreference || maxWeightKg !== undefined ? { field: "weightKg" as const, direction: "asc" as const }
    : /\b(?:high|good|best)\s+battery health\b/i.test(query) ? { field: "batteryHealth" as const, direction: "desc" as const }
    : /\b(?:lots? of|high|more)\s+(?:ram|memory)\b/i.test(query) ? { field: "ramGB" as const, direction: "desc" as const }
    : /\b(?:lots? of|high|large)\s+storage\b/i.test(query) ? { field: "storageGB" as const, direction: "desc" as const }
    : /\b(?:cheap|inexpensive|affordable)\b|\blow price\b/i.test(query) ? { field: "price" as const, direction: "asc" as const }
    : undefined;
  const sort = explicitSortField && explicitDirection ? { field: explicitSortField, direction: explicitDirection } : implicitSort;
  const parsed = searchIntentSchema.safeParse({ minPrice, maxPrice, minRamGB, minStorageGB: storage ? Number(storage[1]) * (storage[2].toLowerCase() === "tb" ? 1000 : 1) : undefined, maxWeightKg, brand, condition, useCase, preferences, sort });
  if (!parsed.success) 
    throw new Error("Could not interpret the search constraints.");
  return parsed.data;
}
