import type { Listing } from "@/data/listings";
import { parseLocally } from "./local-intent";
import { searchCatalogue } from "./search-catalogue";
import type { ScoredListing } from "./semantic-retrieval";
import type { SearchIntent } from "./search-intent";

export async function searchWithFallback(
  query: string,
  catalogue: readonly Listing[],
  retrieve: (query: string, options: { catalogue: readonly Listing[]; intent: SearchIntent }) => Promise<ScoredListing[]>,
  onEmbeddingFailure: () => void,
) {
  const intent = parseLocally(query);
  try {
    const matches = await retrieve(query, { catalogue, intent });
    return { interpretedIntent: intent, retrieval: "embedding" as const, listings: matches.map(({ listing }) => listing), scores: matches.map(({ listing, score }) => ({ id: listing.id, score })) };
  } catch {
    onEmbeddingFailure();
    return { interpretedIntent: intent, retrieval: "local-fallback" as const, listings: searchCatalogue(catalogue, intent), scores: [] };
  }
}
