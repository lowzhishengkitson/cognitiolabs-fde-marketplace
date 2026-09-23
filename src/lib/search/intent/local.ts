import { searchIntentSchema, type NumericBoundField, type SearchIntent } from "./schema";

type Direction = "min" | "max";
type Bound = { value: number; strict: boolean; span: readonly [number, number] };
type ComponentQueries = Pick<SearchIntent, "cpuQuery" | "gpuQuery"> & { spans: Array<readonly [number, number]> };
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

function componentQueries(query: string): ComponentQueries {
  const gpuSpecific = query.match(/\b(?:(?:nvidia\s+)?(?:geforce\s+)?(?:rtx|gtx)\s*[a-z]?\d{3,4}(?:\s*ti)?|(?:amd\s+)?radeon\s+rx\s*\d{3,4}[a-z]*|intel\s+arc\s+a\d{3,4})\b/i);
  const gpuFamily = query.match(/\b(?:intel\s+arc|nvidia(?=\s+(?:gpu|graphics|laptops?))|geforce|rtx|gtx|radeon|amd(?=\s+(?:gpu|graphics))|intel(?=\s+(?:gpu|graphics)))\b/i);
  const cpuSpecific = query.match(/\b(?:intel\s+(?:core\s+)?i[3579](?:[- ]?\d{4,5}[a-z]{0,2})?|(?:core\s+)?i[3579](?:[- ]?\d{4,5}[a-z]{0,2})?|(?:amd\s+)?ryzen(?:\s+[3579](?:\s+pro)?(?:\s+\d{4}[a-z]{0,2})?)?|apple\s+m[1-9](?:\s+(?:pro|max|ultra))?)\b/i);
  const cpuVendor = query.match(/\b(?:intel(?=\s+(?:cpu|processor))|amd(?=\s+(?:cpu|processor)))\b/i);
  const cpu = cpuSpecific ?? cpuVendor;
  const gpu = gpuSpecific ?? gpuFamily;
  const spans = [
    componentSpan(query, cpu, "cpu"),
    componentSpan(query, gpu, "gpu"),
  ].filter((span): span is readonly [number, number] => Boolean(span));
  return { cpuQuery: cpu?.[0], gpuQuery: gpu?.[0], spans };
}

function componentSpan(query: string, match: RegExpMatchArray | null, kind: "cpu" | "gpu"): readonly [number, number] | undefined {
  if (!match || match.index === undefined) return undefined;
  const start = match.index;
  let end = start + match[0].length;
  const context = query.slice(end).match(kind === "cpu" ? /^\s+(?:cpu|processor)\b/i : /^\s+(?:gpu|graphics)\b/i);
  if (context) end += context[0].length;
  return [start, end];
}

function buildSemanticQuery(query: string, spans: readonly (readonly [number, number])[]): string {
  const withoutStructuredTerms = query.split("").map((character, index) =>
    spans.some(([start, end]) => index >= start && index < end) ? " " : character,
  ).join("");
  let cleaned = withoutStructuredTerms.replace(/[,;:()[\]{}]+/g, " ").replace(/\s+/g, " ").trim();
  const connector = /^(?:(?:with|and|or|for|of|by|in)\b\s*)+|(?:\s*\b(?:with|and|or|for|of|by|in))+$/gi;
  // Removing adjacent structured spans can strand conjunctions at either edge.
  cleaned = cleaned.replace(connector, "").replace(/\s+/g, " ").trim();
  return cleaned || "laptop";
}

// Deterministic fallback for common explicit catalogue constraints and sorts.
export function parseLocalQuery(query: string): { intent: SearchIntent; semanticQuery: string } {
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

  const priceText = text.split("").map((character, index) => claimedSpans.some(([start, end]) => index >= start && index < end) ? " " : character).join("");
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
    if (shorthand) {
      values.minRamGB = capacity(shorthand[1], shorthand[2]);
      claimedSpans.push([shorthand.index!, shorthand.index! + shorthand[0].length]);
    }
  }

  const brand = ["Apple", "Lenovo", "ASUS", "Dell", "HP", "Acer", "MSI", "LG", "Fujitsu", "Microsoft", "Huawei", "Samsung", "Framework", "Gigabyte"].find((name) => new RegExp(String.raw`\b${name}\b`, "i").test(query));
  const brandMatch = brand ? query.match(new RegExp(String.raw`\b${brand}\b`, "i")) : null;
  if (brandMatch?.index !== undefined) claimedSpans.push([brandMatch.index, brandMatch.index + brandMatch[0].length]);
  const conditionMatch = query.match(/\blike.new\s+condition\b|\bfair\s+condition\b|\bgood\s+condition\b/i);
  const condition = conditionMatch && /like.new/i.test(conditionMatch[0]) ? "Like new" as const : conditionMatch && /fair/i.test(conditionMatch[0]) ? "Fair" as const : conditionMatch ? "Good" as const : undefined;
  if (conditionMatch?.index !== undefined) claimedSpans.push([conditionMatch.index, conditionMatch.index + conditionMatch[0].length]);
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
  const namedSortEntry = superlatives.find(([pattern]) => pattern.test(query));
  const namedSort = namedSortEntry?.[1];
  const namedSortMatch = namedSortEntry ? query.match(namedSortEntry[0]) : null;
  if (namedSortMatch?.index !== undefined) claimedSpans.push([namedSortMatch.index, namedSortMatch.index + namedSortMatch[0].length]);
  if (sortPhrase?.index !== undefined) claimedSpans.push([sortPhrase.index, sortPhrase.index + sortPhrase[0].length]);
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
  claimedSpans.push(...components.spans);
  const parsed = searchIntentSchema.safeParse({ ...values, cpuQuery: components.cpuQuery, gpuQuery: components.gpuQuery, brand, condition, useCase, preferences, sort: namedSort ?? phraseSort ?? implicitSort, exclusiveBounds: exclusiveBounds.length ? exclusiveBounds : undefined });
  if (!parsed.success) throw new Error("Could not interpret the search constraints.");
  return { intent: parsed.data, semanticQuery: buildSemanticQuery(query, claimedSpans) };
}

export function parseLocally(query: string): SearchIntent {
  return parseLocalQuery(query).intent;
}
