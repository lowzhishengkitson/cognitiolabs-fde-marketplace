import { searchIntentSchema, type NumericBoundField, type SearchIntent } from "./schema";

type Direction = "min" | "max";
type Bound = { value: number; strict: boolean; span: readonly [number, number] };
const MIN_WORDS = String.raw`at\s+least|minimum|min(?:imum)?(?:\s+of)?|over|above|more\s+than`;
const MAX_WORDS = String.raw`at\s+most|maximum|max(?:imum)?(?:\s+of)?|under|below|less\s+than|up\s+to|no\s+more\s+than`;

function isStrict(phrase: string): boolean {
  return /^(?:over|above|more\s+than|under|below|less\s+than)$/i.test(phrase.trim());
}

function capacity(value: string, unit: string): number {
  return Number(value) * (unit.toLowerCase() === "tb" ? 1000 : 1);
}

function capacityBound(text: string, subject: string, direction: Direction): Bound | undefined {
  const words = direction === "min" ? MIN_WORDS : MAX_WORDS;
  const before = text.match(new RegExp(String.raw`\b(${words})\s+(\d+(?:\.\d+)?)\s*(gb|tb)\s*(?:of\s*)?(?:${subject})\b`, "i"));
  const after = text.match(new RegExp(String.raw`\b(?:${subject})\s*(?:of\s*)?(${words})\s+(\d+(?:\.\d+)?)\s*(gb|tb)\b`, "i"));
  const match = before ?? after;
  return match ? { value: capacity(match[2], match[3]), strict: isStrict(match[1]), span: [match.index!, match.index! + match[0].length] } : undefined;
}

function scalarBound(text: string, subject: string, unit: string, direction: Direction): Bound | undefined {
  const words = direction === "min" ? MIN_WORDS : MAX_WORDS;
  const before = text.match(new RegExp(String.raw`\b(${words})\s+(\d+(?:\.\d+)?)\s*${unit}\s*(?:${subject})?(?!\w)`, "i"));
  const after = text.match(new RegExp(String.raw`\b(?:${subject})\s*(?:of\s*)?(${words})\s+(\d+(?:\.\d+)?)\s*${unit}(?!\w)`, "i"));
  const match = before ?? after;
  return match ? { value: Number(match[2]), strict: isStrict(match[1]), span: [match.index!, match.index! + match[0].length] } : undefined;
}

function screenBound(text: string, direction: Direction): Bound | undefined {
  const words = direction === "min" ? MIN_WORDS : MAX_WORDS;
  const symbol = direction === "min" ? String.raw`>=|>` : String.raw`<=|<`;
  const unit = String.raw`(?:inch(?:es)?|in|\")`;
  const patterns = [
    new RegExp(String.raw`\b(${words})\s+(\d+(?:\.\d+)?)\s*-?\s*${unit}(?:\s+screen(?:\s+size)?)?(?!\w)`, "i"),
    new RegExp(String.raw`\bscreen(?:\s+size)?\s*(?:(${words})|(${symbol}))\s*(\d+(?:\.\d+)?)\s*${unit}(?!\w)`, "i"),
    new RegExp(String.raw`\b(\d+(?:\.\d+)?)\s*-?\s*${unit}\s+screen(?:\s+size)?\s+(${direction === "min" ? "minimum|min" : "maximum|max"})\b`, "i"),
  ];
  for (let index = 0; index < patterns.length; index++) {
    const match = text.match(patterns[index]);
    if (!match) continue;
    const value = index === 0 ? Number(match[2]) : index === 1 ? Number(match[3]) : Number(match[1]);
    const qualifier = index === 0 ? match[1] : index === 1 ? (match[1] ?? match[2]) : match[2];
    return { value, strict: isStrict(qualifier) || qualifier === ">" || qualifier === "<", span: [match.index!, match.index! + match[0].length] };
  }
  return undefined;
}

function unqualifiedScreenBound(text: string): Bound | undefined {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*-?\s*(?:inch(?:es)?|in|\")\s+screen(?:\s+size)?\b/i);
  return match ? { value: Number(match[1]), strict: false, span: [match.index!, match.index! + match[0].length] } : undefined;
}

function componentQueries(query: string): Pick<SearchIntent, "cpuQuery" | "gpuQuery"> {
  const gpuSpecific = query.match(/\b(?:(?:nvidia\s+)?(?:geforce\s+)?(?:rtx|gtx)\s*[a-z]?\d{3,4}(?:\s*ti)?|(?:amd\s+)?radeon\s+rx\s*\d{3,4}[a-z]*|intel\s+arc\s+a\d{3,4})\b/i)?.[0];
  const gpuFamily = query.match(/\b(?:intel\s+arc|nvidia(?=\s+(?:gpu|graphics|laptops?))|geforce|rtx|gtx|radeon|amd(?=\s+(?:gpu|graphics))|intel(?=\s+(?:gpu|graphics)))\b/i)?.[0];
  const cpuSpecific = query.match(/\b(?:intel\s+(?:core\s+)?i[3579](?:[- ]?\d{4,5}[a-z]{0,2})?|(?:core\s+)?i[3579](?:[- ]?\d{4,5}[a-z]{0,2})?|(?:amd\s+)?ryzen(?:\s+[3579](?:\s+pro)?(?:\s+\d{4}[a-z]{0,2})?)?|apple\s+m[1-9](?:\s+(?:pro|max|ultra))?)\b/i)?.[0];
  const cpuVendor = query.match(/\b(?:intel(?=\s+(?:cpu|processor))|amd(?=\s+(?:cpu|processor)))\b/i)?.[0];
  return { cpuQuery: cpuSpecific ?? cpuVendor, gpuQuery: gpuSpecific ?? gpuFamily };
}

// Deterministic fallback for common explicit catalogue constraints and sorts.
export function parseLocally(query: string): SearchIntent {
  const text = query.toLowerCase();
  const exclusiveBounds: NumericBoundField[] = [];
  const values: Partial<Record<NumericBoundField, number>> = {};
  const claimedSpans: Array<readonly [number, number]> = [];
  const setBound = (field: NumericBoundField, bound: Bound | undefined) => {
    if (!bound) return;
    values[field] = bound.value;
    claimedSpans.push(bound.span);
    if (bound.strict) exclusiveBounds.push(field);
  };

  // Typed measurements are parsed first and their spans are removed before
  // generic price parsing, so hardware numbers can never become prices.
  setBound("minRamGB", capacityBound(text, String.raw`ram|memory`, "min"));
  setBound("maxRamGB", capacityBound(text, String.raw`ram|memory`, "max"));
  setBound("minStorageGB", capacityBound(text, String.raw`storage|ssd|disk`, "min"));
  setBound("maxStorageGB", capacityBound(text, String.raw`storage|ssd|disk`, "max"));
  setBound("minWeightKg", scalarBound(text, String.raw`weight`, String.raw`kg`, "min"));
  setBound("maxWeightKg", scalarBound(text, String.raw`weight`, String.raw`kg`, "max"));
  const maximumScreen = screenBound(text, "max");
  const minimumScreen = screenBound(text, "min") ?? (maximumScreen ? undefined : unqualifiedScreenBound(text));
  setBound("minScreenSizeInches", minimumScreen);
  setBound("maxScreenSizeInches", maximumScreen);
  setBound("minBatteryHealth", scalarBound(text, String.raw`battery\s+health`, String.raw`%`, "min"));
  setBound("maxBatteryHealth", scalarBound(text, String.raw`battery\s+health`, String.raw`%`, "max"));

  // A malformed unit attached to a known hardware field is still hardware
  // context. Reserve it so "20 bananas RAM" is rejected as RAM rather than
  // silently becoming a price constraint.
  const malformedHardware = new RegExp(String.raw`\b(?:${MIN_WORDS}|${MAX_WORDS})\s+\d+(?:\.\d+)?\s+\S+(?:\s+(?:ram|memory|storage|ssd|screen|battery\s+health|weight))\b`, "gi");
  for (const match of text.matchAll(malformedHardware)) claimedSpans.push([match.index, match.index + match[0].length]);

  const priceText = [...text].map((character, index) => claimedSpans.some(([start, end]) => index >= start && index < end) ? " " : character).join("");
  const priceAmount = String.raw`(?:s\$|\$|sgd\s*)?(?<amount>\d+(?:\.\d+)?)(?![\d.])`;
  const priceBound = (direction: Direction): Bound | undefined => {
    const words = direction === "min" ? MIN_WORDS : String.raw`${MAX_WORDS}|budget\s+of`;
    const before = priceText.match(new RegExp(String.raw`\b(?<qualifier>${words})\s+${priceAmount}`, "i"));
    const after = priceText.match(new RegExp(String.raw`\bprice\s+(?<qualifier>${words})\s+${priceAmount}`, "i"));
    const match = after ?? before;
    return match ? { value: Number(match.groups!.amount), strict: isStrict(match.groups!.qualifier), span: [match.index!, match.index! + match[0].length] } : undefined;
  };
  setBound("minPrice", priceBound("min")); setBound("maxPrice", priceBound("max"));

  if (values.minRamGB === undefined && values.maxRamGB === undefined) {
    const shorthand = text.match(/\b(\d+(?:\.\d+)?)\s*(gb|tb)\s*(?:ram\b|(?:ram\s*)?laptops?\b)/i);
    if (shorthand) values.minRamGB = capacity(shorthand[1], shorthand[2]);
  }

  const brand = ["Apple", "Lenovo", "ASUS", "Dell", "HP", "Acer", "MSI", "LG", "Fujitsu", "Microsoft", "Huawei", "Samsung", "Framework", "Gigabyte"].find((name) => new RegExp(String.raw`\b${name}\b`, "i").test(query));
  const condition = /like.new/i.test(query) ? "Like new" as const : /\bfair\s+condition\b/i.test(query) ? "Fair" as const : /\bgood\s+condition\b/i.test(query) ? "Good" as const : undefined;
  const useCase = /unity|game development|3d/i.test(query) ? "Unity development" : /gam(?:e|ing)/i.test(query) ? "gaming" : /programm|cod(?:e|ing)|developer/i.test(query) ? "programming" : /student|university|school/i.test(query) ? "student" : undefined;
  const lightweight = /\b(?:low[- ]?weight|light[- ]?weight|lightweight)\b|\b(?:light|lighter)\s+(?:laptops?|notebooks?)\b/i.test(query) || (/\bportable\b/i.test(query) && /\b(?:laptops?|notebooks?|computer)\b/i.test(query));
  const preferences = lightweight || /\btravel(?:s|ling|ing)?\b/i.test(query) ? ["lightweight"] : undefined;

  const sortPhrase = text.match(/\b(?:sort(?:ed)?\s+(?:by|in)?\s*|(?:in\s+)?)(ascending|descending|asc|desc)(?:\s+(?:order|by))?\s*(?:by\s+)?(price|cost|weight|ram|memory|storage|screen(?:\s+size)?|battery(?:\s+health)?)?\b|\b(?:sort(?:ed)?\s+by\s+)(price|cost|weight|ram|memory|storage|screen(?:\s+size)?|battery(?:\s+health)?)\s+(ascending|descending|asc|desc)\b/i);
  const superlatives: Array<[RegExp, NonNullable<SearchIntent["sort"]>]> = [
    [/\b(?:cheapest|lowest price)(?:\s+first)?\b/i, { field: "price", direction: "asc" }],
    [/\b(?:most expensive|highest price)(?:\s+first)?\b/i, { field: "price", direction: "desc" }],
    [/\b(?:lightest|lowest weight)(?:\s+first)?\b/i, { field: "weightKg", direction: "asc" }],
    [/\b(?:heaviest|highest weight)(?:\s+first)?\b/i, { field: "weightKg", direction: "desc" }],
    [/\b(?:most|highest) ram\b/i, { field: "ramGB", direction: "desc" }],
    [/\b(?:least|lowest) ram\b/i, { field: "ramGB", direction: "asc" }],
    [/\b(?:most|largest|highest) storage\b/i, { field: "storageGB", direction: "desc" }],
    [/\b(?:least|smallest|lowest) storage\b/i, { field: "storageGB", direction: "asc" }],
    [/\b(?:largest|biggest) screen\b/i, { field: "screenSizeInches", direction: "desc" }],
    [/\b(?:smallest|small) screen\b/i, { field: "screenSizeInches", direction: "asc" }],
    [/\b(?:best|highest) battery health(?:\s+first)?\b/i, { field: "batteryHealth", direction: "desc" }],
    [/\b(?:worst|lowest) battery health(?:\s+first)?\b/i, { field: "batteryHealth", direction: "asc" }],
  ];
  const namedSort = superlatives.find(([pattern]) => pattern.test(query))?.[1];
  const sortToken = sortPhrase?.[2] ?? sortPhrase?.[3] ?? "";
  const phraseSort = sortPhrase ? {
    field: (/price|cost/.test(sortToken) ? "price" : /ram|memory/.test(sortToken) ? "ramGB" : /storage/.test(sortToken) ? "storageGB" : /screen/.test(sortToken) ? "screenSizeInches" : /battery/.test(sortToken) ? "batteryHealth" : "weightKg") as NonNullable<SearchIntent["sort"]>["field"],
    direction: (/desc/.test(sortPhrase[1] ?? sortPhrase[4] ?? "") ? "desc" : "asc") as "asc" | "desc",
  } : undefined;
  const implicitSort: SearchIntent["sort"] = lightweight || values.maxWeightKg !== undefined ? { field: "weightKg", direction: "asc" }
    : /\b(?:high|good|best)\s+battery health\b/i.test(query) ? { field: "batteryHealth", direction: "desc" }
    : /\b(?:lots? of|high|more)\s+(?:ram|memory)\b/i.test(query) ? { field: "ramGB", direction: "desc" }
    : /\b(?:lots? of|high|large)\s+storage\b/i.test(query) ? { field: "storageGB", direction: "desc" }
    : /\b(?:cheap|inexpensive|affordable)\b|\blow price\b/i.test(query) ? { field: "price", direction: "asc" }
    : undefined;
  const components = componentQueries(query);
  const parsed = searchIntentSchema.safeParse({ ...values, ...components, brand, condition, useCase, preferences, sort: namedSort ?? phraseSort ?? implicitSort, exclusiveBounds: exclusiveBounds.length ? exclusiveBounds : undefined });
  if (!parsed.success) throw new Error("Could not interpret the search constraints.");
  return parsed.data;
}
