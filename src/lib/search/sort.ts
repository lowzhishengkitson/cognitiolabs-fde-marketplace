import type { Listing } from "@/data/listings";
import type { SearchIntent } from "./intent/schema";

// Stable ties retain the incoming relevance order (or seed order in local search).
export function sortListings<T>(items: readonly T[], sort: SearchIntent["sort"], listing: (item: T) => Listing): T[] {
  if (!sort) return [...items];
  const multiplier = sort.direction === "asc" ? 1 : -1;
  return items.map((item, index) => ({ item, index })).sort((a, b) =>
    (listing(a.item)[sort.field] - listing(b.item)[sort.field]) * multiplier || a.index - b.index,
  ).map(({ item }) => item);
}
