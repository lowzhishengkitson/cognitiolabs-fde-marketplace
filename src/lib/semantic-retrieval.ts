import type { Listing } from "@/data/listings";
import { filterCatalogue } from "./search-catalogue";
import type { SearchIntent } from "./search-intent";
import { InvalidEmbeddingError } from "./embedding-errors";

export function listingToEmbeddingText(item: Listing): string {
  return [
    `Title: ${item.title}`, `Brand: ${item.brand}`, `Model: ${item.model}`,
    `Price: SGD ${item.price}`, `CPU: ${item.cpu}`, `GPU: ${item.gpu}`,
    `RAM: ${item.ramGB} GB`, `Storage: ${item.storageGB} GB`,
    `Screen size: ${item.screenSizeInches} inches`, `Weight: ${item.weightKg} kg`,
    `Condition: ${item.condition}`, `Battery health: ${item.batteryHealth}%`,
    `Seller location: ${item.sellerLocation}`, `Description: ${item.description}`,
  ].join("\n");
}

function validVector(vector: readonly number[]): boolean {
  return vector.length > 0 && vector.every((value) => Number.isFinite(value));
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || !validVector(a) || !validVector(b)) throw new InvalidEmbeddingError("Invalid embedding vectors");
  let dot = 0, aNorm = 0, bNorm = 0;
  for (let index = 0; index < a.length; index++) {
    dot += a[index] * b[index];
    aNorm += a[index] ** 2;
    bNorm += b[index] ** 2;
  }
  if (!aNorm || !bNorm) throw new InvalidEmbeddingError("Zero-length embedding vector");
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export type ScoredListing = { listing: Listing; score: number };

export function rankBySimilarity(
  catalogue: readonly Listing[], vectors: readonly (readonly number[])[], queryVector: readonly number[], intent: SearchIntent,
): ScoredListing[] {
  if (catalogue.length !== vectors.length) throw new InvalidEmbeddingError("Catalogue and embedding count differ");
  const scores = catalogue.map((listing, index) => ({ listing, index, score: cosineSimilarity(queryVector, vectors[index]) }));
  const eligible = new Set(filterCatalogue(catalogue, intent).map((item) => item.id));
  return scores.filter(({ listing }) => eligible.has(listing.id))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ listing, score }) => ({ listing, score }));
}

export type EmbedTexts = (texts: string[]) => Promise<number[][]>;

// Process-local cache. The key changes if any seeded listing text or order changes.
// A shared in-flight promise prevents concurrent requests from re-embedding the catalogue.
export function createSemanticRetriever(embedTexts: EmbedTexts) {
  let cached: { key: string; promise: Promise<number[][]> } | null = null;
  return async function retrieveListings(
    query: string, options: { catalogue: readonly Listing[]; intent: SearchIntent },
  ): Promise<ScoredListing[]> {
    if (!options.catalogue.length) return [];
    const texts = options.catalogue.map(listingToEmbeddingText);
    const key = JSON.stringify(options.catalogue.map((listing, index) => [listing.id, texts[index]]));
    if (cached?.key !== key) {
      const promise = embedTexts(texts);
      cached = { key, promise };
      void promise.catch(() => { if (cached?.promise === promise) cached = null; });
    }
    const vectorsPromise = cached.promise;
    const [vectors, queryVectors] = await Promise.all([vectorsPromise, embedTexts([query])]);
    if (queryVectors.length !== 1) throw new InvalidEmbeddingError("Expected one query embedding");
    return rankBySimilarity(options.catalogue, vectors, queryVectors[0], options.intent);
  };
}
