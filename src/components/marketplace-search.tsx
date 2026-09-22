"use client";

import { useRef, useState, type FormEvent } from "react";
import { ListingCard } from "@/components/listing-card";
import type { Listing } from "@/data/listings";
import type { SearchIntent } from "@/lib/search/intent/schema";

type SearchResponse = { interpretedIntent: SearchIntent; retrieval: "embedding" | "local-fallback"; fallbackReason?: string; listings: Listing[]; scores: { id: string; score: number }[] };

export function MarketplaceSearch({ catalogue }: { catalogue: Listing[] }) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: trimmed }), signal: controller.signal });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error((data as { error?: string }).error ?? "Search failed. Please try again.");
      setResults(data as SearchResponse);
      setActiveQuery(trimmed);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Search failed. Please try again.");
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false); }
    }
  }

  function clear() {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
    setQuery(""); setActiveQuery(""); setResults(null); setError("");
  }

  const displayed = results?.listings ?? catalogue;
  return <>
    <form onSubmit={submit} role="search" className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <label htmlFor="catalogue-search" className="mb-2 block text-sm font-semibold">Describe the laptop you need</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="catalogue-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} placeholder="Lightweight, under $800, at least 16GB RAM…" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-blue-700" />
        <button type="submit" disabled={loading || !query.trim()} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Searching…" : "Search"}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Results come from the 50 sample listings.</p>
    </form>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <section className="mt-10" aria-labelledby="listings-heading" aria-busy={loading}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="listings-heading" className="text-2xl font-bold">{results ? "Search results" : "Available laptops"}</h2>{activeQuery && <p className="mt-1 text-sm text-slate-500">For “{activeQuery}”</p>}</div>
        <div className="flex items-center gap-3"><p className="text-sm text-slate-500">{displayed.length} {results ? "matches" : "sample listings"}</p>{(results || loading) && <button type="button" onClick={clear} className="text-sm font-semibold text-blue-700 hover:underline">Clear search</button>}</div>
      </div>
      {process.env.NODE_ENV === "development" && results && <details className="mb-5 rounded-lg border border-slate-200 bg-white p-3 text-sm"><summary className="cursor-pointer font-medium">Search details (development)</summary><p className="mt-2">Retrieval: {results.retrieval}</p>{results.fallbackReason && <p className="mt-1">Fallback reason: {results.fallbackReason}</p>}<pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify({ interpretedIntent: results.interpretedIntent, scores: results.scores }, null, 2)}</pre></details>}
      {displayed.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{displayed.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h3 className="text-lg font-semibold">No laptops match those constraints</h3><p className="mt-2 text-slate-600">Try a higher budget or fewer requirements.</p><button onClick={clear} className="mt-4 font-semibold text-blue-700 hover:underline">Show all laptops</button></div>}
    </section>
  </>;
}
