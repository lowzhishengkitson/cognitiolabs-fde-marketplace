import type { Listing } from "@/data/listings";
import { parseLocally } from "./intent/local";
import { searchCatalogue } from "./catalogue";
import type { ScoredListing } from "./retrieval/semantic";
import type { SearchIntent } from "./intent/schema";
import type { FallbackReason } from "./retrieval/errors";

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
