import type { Listing } from "@/data/listings";
import { parseLocalQuery } from "./intent/local";
import { searchCatalogue } from "./catalogue";
import type { ScoredListing } from "./retrieval/semantic";
import type { SearchIntent } from "./intent/schema";
import type { FallbackReason } from "./retrieval/errors";
import { sortListings } from "./sort";
import { getMatchReasonsById } from "./explanations";

export async function searchWithFallback(query: string,
  catalogue: readonly Listing[],
  retrieve: (query: string, options: { catalogue: readonly Listing[]; intent: SearchIntent }) => Promise<ScoredListing[]>,
  onEmbeddingFailure: (error: unknown) => FallbackReason,) 
{
  const { intent, semanticQuery } = parseLocalQuery(query);
  try 
  {
    const matches = sortListings(await retrieve(semanticQuery, { catalogue, intent }), intent.sort, (item) => item.listing);
    const resultListings = matches.map(({ listing }) => listing);
    return { interpretedIntent: intent, semanticQuery, retrieval: "embedding" as const, listings: resultListings, matchReasons: getMatchReasonsById(resultListings, intent), scores: matches.map(({ listing, score }) => ({ id: listing.id, score })) };
  } 
  catch (error) 
  {
    const fallbackReason = onEmbeddingFailure(error);
    const resultListings = searchCatalogue(catalogue, intent);
    return { interpretedIntent: intent, semanticQuery, retrieval: "local-fallback" as const, fallbackReason, listings: resultListings, matchReasons: getMatchReasonsById(resultListings, intent), scores: [] };
  }
}
