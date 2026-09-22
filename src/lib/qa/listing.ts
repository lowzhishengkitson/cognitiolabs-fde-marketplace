import { z } from "zod";
import type { Listing } from "@/data/listings";
import { formatPrice, formatStorage } from "@/lib/listings/format";
import {
  catalogueContext,
  GROUNDING_PROMPT,
  parseGroundedAnswer,
  type QaAnswer,
} from "./core";

export const listingQaRequestSchema = z.strictObject({
  listingId: z.string().trim().min(1).max(100),
  question: z.string().trim().min(1).max(500),
});

type ListingFact =
  | "price"
  | "ram"
  | "storage"
  | "cpu"
  | "gpu"
  | "weight"
  | "screenSize"
  | "batteryHealth"
  | "condition"
  | "location";

const factOrder: ListingFact[] = [
  "price", "cpu", "gpu", "ram", "storage", "screenSize", "weight",
  "batteryHealth", "condition", "location",
];

const source = ({ id, title }: Listing) => ({ id, title });
const number = (value: number) => new Intl.NumberFormat("en-SG", { maximumFractionDigits: 2 }).format(value);

function requestedFacts(question: string): ListingFact[] {
  const text = question.toLowerCase();
  const facts = new Set<ListingFact>();
  const mainSpecs = /\b(?:main|key|full)\s+(?:specs|specifications)\b|\bwhat are (?:its|the) specs\b/.test(text);

  if (mainSpecs) ["cpu", "gpu", "ram", "storage", "screenSize", "weight", "batteryHealth", "condition"].forEach((fact) => facts.add(fact as ListingFact));
  if (/\b(?:price|cost)\b|\bhow much is (?:it|this laptop)\b/.test(text)) facts.add("price");
  if (!/\b(?:upgrade|replace|expand)\b/.test(text) && /\b(?:ram|memory)\b/.test(text)) facts.add("ram");
  if (!/\b(?:upgrade|replace|expand)\b/.test(text) && /\b(?:storage|ssd|disk space)\b/.test(text)) facts.add("storage");
  if (/\b(?:cpu|processor)\b/.test(text)) facts.add("cpu");
  if (/\b(?:gpu|graphics card|graphics processor)\b/.test(text)) facts.add("gpu");
  if (/\b(?:weight|weigh|weighs|heavy)\b/.test(text)) facts.add("weight");
  if (/\b(?:screen size|display size)\b|\bhow (?:large|big) is (?:the|its) (?:screen|display)\b/.test(text)) facts.add("screenSize");
  if (/\bbattery health\b/.test(text)) facts.add("batteryHealth");
  if (/\bcondition\b/.test(text)) facts.add("condition");
  if (/\b(?:seller location|collection location|location|located|where.*collect)\b/.test(text)) facts.add("location");

  return factOrder.filter((fact) => facts.has(fact));
}

function missingInformation(question: string): string[] {
  const text = question.toLowerCase();
  const missing: string[] = [];
  if (/\bbattery\s+(?:life|runtime|duration)\b|\bhow (?:long|many hours).*battery\b/.test(text))
    missing.push("Battery runtime is not listed, so it cannot be determined from this catalogue entry.");
  if (/\bwarrant(?:y|ies)\b/.test(text)) missing.push("Warranty information is not listed.");
  if (/\b(?:thunderbolt|usb|hdmi|displayport|ports?)\b/.test(text)) missing.push("Port and Thunderbolt information is not listed.");
  if (/\brefresh rate\b|\b\d+\s*hz\b/.test(text)) missing.push("Display refresh rate is not listed.");
  if (/\b(?:upgrade|upgradeable|replaceable|expandable)\b/.test(text)) missing.push("Component upgradeability is not listed.");
  if (/\b(?:benchmark|fps|frames per second)\b/.test(text)) missing.push("Benchmarks and frame-rate measurements are not listed.");
  if (/\b(?:thermal|temperature|runs? hot|fan noise)\b/.test(text)) missing.push("Measured thermal and fan information is not listed.");
  if (/\b(?:repair history|previous repairs?)\b/.test(text)) missing.push("Repair history is not listed.");
  if (/\b(?:seller rating|seller reliability|trustworthy seller)\b/.test(text)) missing.push("Seller ratings and reliability information are not listed.");
  return missing;
}

function factSentence(fact: ListingFact, listing: Listing): string {
  switch (fact) {
    case "price": return `This listing is priced at ${formatPrice(listing.price)}.`;
    case "ram": return `This listing has ${listing.ramGB}GB of RAM.`;
    case "storage": return `This listing has ${formatStorage(listing.storageGB)} of storage.`;
    case "cpu": return `The listed CPU is ${listing.cpu}.`;
    case "gpu": return `The listed GPU is ${listing.gpu}.`;
    case "weight": return `This listing weighs ${number(listing.weightKg)}kg.`;
    case "screenSize": return `The listed screen size is ${number(listing.screenSizeInches)} inches.`;
    case "batteryHealth": return `The listed battery health is ${listing.batteryHealth}%.`;
    case "condition": return `The listing condition is ${listing.condition}.`;
    case "location": return `The seller location is ${listing.sellerLocation}.`;
  }
}

export type ListingQuestionCategory = "exact-factual" | "missing-information" | "interpretive";

export function classifyListingQuestion(question: string): ListingQuestionCategory {
  const missing = missingInformation(question);
  const facts = requestedFacts(question);
  if (missing.length && !facts.length) return "missing-information";
  if (facts.length || missing.length) return "exact-factual";
  return "interpretive";
}

export function resolveListingScope(catalogue: readonly Listing[], id: string): Listing | null {
  return catalogue.find((item) => item.id === id) ?? null;
}

export const LISTING_GROUNDING_PROMPT = `${GROUNDING_PROMPT}
You are answering about exactly one selected listing. Never discuss or cite any other product. The supplied listing is the complete product scope; do not use semantic retrieval or external product knowledge. Explain relevant trade-offs conservatively and do not promise suitability or application compatibility. The sourceIds array must contain exactly the supplied listing ID.`;

export async function answerListingQuestion(question: string, listing: Listing, answer: QaAnswer) {
  const facts = requestedFacts(question);
  const missing = missingInformation(question);
  const sources = [source(listing)];

  if (facts.length || missing.length) {
    const exact = facts.map((fact) => factSentence(fact, listing));
    return {
      answer: [...exact, ...missing].join(" "),
      sources,
      handledBy: "deterministic" as const,
      facts,
    };
  }

  const context = catalogueContext([listing], { scopeId: listing.id });
  const parsed = parseGroundedAnswer(await answer(question, context), [listing]);
  if (parsed.sources.length !== 1 || parsed.sources[0].id !== listing.id)
    throw new Error("Model did not cite the selected listing");
  return { ...parsed, handledBy: "model" as const, facts: [] as ListingFact[] };
}
