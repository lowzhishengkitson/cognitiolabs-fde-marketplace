import type { Listing } from "@/data/listings";
import { parseLocally } from "./local-intent";
import { searchCatalogue } from "./search-catalogue";
import type { ScoredListing } from "./semantic-retrieval";
import type { SearchIntent } from "./search-intent";
import type { FallbackReason } from "./embedding-errors";

export async function searchWithFallback(query: string,
  catalogue: readonly Listing[],
  retrieve: (query: string, options: { catalogue: readonly Listing[]; intent: SearchIntent }) => Promise<ScoredListing[]>,
  onEmbeddingFailure: (error: unknown) => FallbackReason,) 
{
  const intent = parseLocally(query);
  try 
  {
    const matches = await retrieve(query, { catalogue, intent });
    return { interpretedIntent: intent, retrieval: "embedding" as const, listings: matches.map(({ listing }) => listing), scores: matches.map(({ listing, score }) => ({ id: listing.id, score })) };
  } 
  catch (error) 
  {
    const fallbackReason = onEmbeddingFailure(error);
    return { interpretedIntent: intent, retrieval: "local-fallback" as const, fallbackReason, listings: searchCatalogue(catalogue, intent), scores: [] };
  }
}
