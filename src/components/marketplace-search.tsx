"use client";

import { useRef, useState, type FormEvent } from "react";
import { ListingCard } from "@/components/listing-card";
import type { Listing } from "@/data/listings";
import type { SearchIntent } from "@/lib/search/intent/schema";

type SearchResponse = { interpretedIntent: SearchIntent; retrieval: "embedding" | "local-fallback"; fallbackReason?: string; listings: Listing[]; matchReasons: Record<string, string[]>; scores: { id: string; score: number }[] };

const suggestions = [
  "Under $700 for university",
  "Lightweight for travel",
  "16GB RAM, cheapest first",
  "Good for programming",
  "Gaming laptop under $1200",
];

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function intentLabels(intent: SearchIntent): string[] {
  const labels: string[] = [];
  if (intent.minPrice !== undefined) labels.push(`Price ≥ S$${intent.minPrice}`);
  if (intent.maxPrice !== undefined) labels.push(`Budget ≤ S$${intent.maxPrice}`);
  if (intent.minRamGB !== undefined) labels.push(`RAM ≥ ${intent.minRamGB}GB`);
  if (intent.maxRamGB !== undefined) labels.push(`RAM ≤ ${intent.maxRamGB}GB`);
  if (intent.minStorageGB !== undefined) labels.push(`Storage ≥ ${intent.minStorageGB}GB`);
  if (intent.maxStorageGB !== undefined) labels.push(`Storage ≤ ${intent.maxStorageGB}GB`);
  if (intent.minWeightKg !== undefined) labels.push(`Weight ≥ ${intent.minWeightKg}kg`);
  if (intent.maxWeightKg !== undefined) labels.push(`Weight ≤ ${intent.maxWeightKg}kg`);
  if (intent.minScreenSizeInches !== undefined) labels.push(`Screen ≥ ${intent.minScreenSizeInches}″`);
  if (intent.maxScreenSizeInches !== undefined) labels.push(`Screen ≤ ${intent.maxScreenSizeInches}″`);
  if (intent.minBatteryHealth !== undefined) labels.push(`Battery ≥ ${intent.minBatteryHealth}%`);
  if (intent.maxBatteryHealth !== undefined) labels.push(`Battery ≤ ${intent.maxBatteryHealth}%`);
  if (intent.brand) labels.push(`Brand: ${intent.brand}`);
  if (intent.condition) labels.push(`Condition: ${intent.condition}`);
  if (intent.cpuQuery) labels.push(`CPU: ${intent.cpuQuery}`);
  if (intent.gpuQuery) labels.push(`GPU: ${intent.gpuQuery}`);
  if (intent.useCase) labels.push(`Use: ${titleCase(intent.useCase)}`);
  for (const preference of intent.preferences ?? []) labels.push(titleCase(preference));
  return [...new Set(labels)];
}

function sortDescription(intent: SearchIntent): string | undefined {
  if (!intent.sort) return undefined;
  const directions = {
    price: intent.sort.direction === "asc" ? "low to high" : "high to low",
    weightKg: intent.sort.direction === "asc" ? "light to heavy" : "heavy to light",
    ramGB: intent.sort.direction === "asc" ? "low to high" : "high to low",
    storageGB: intent.sort.direction === "asc" ? "low to high" : "high to low",
    screenSizeInches: intent.sort.direction === "asc" ? "small to large" : "large to small",
    batteryHealth: intent.sort.direction === "asc" ? "low to high" : "high to low",
  };
  const fields = { price: "price", weightKg: "weight", ramGB: "RAM", storageGB: "storage", screenSizeInches: "screen size", batteryHealth: "battery health" };
  return `Sorted by ${fields[intent.sort.field]}: ${directions[intent.sort.field]}`;
}

export function MarketplaceSearch({ catalogue }: { catalogue: Listing[] }) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  async function runSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: trimmed }), signal: controller.signal });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error("Search is temporarily unavailable.");
      setResults(data as SearchResponse);
      setActiveQuery(trimmed);
    } catch {
      if (!controller.signal.aborted) setError("We couldn’t complete that search. Your query is still here, so you can try again.");
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false); }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function applySuggestion(suggestion: string) {
    if (loading) return;
    setQuery(suggestion);
    void runSearch(suggestion);
  }

  function clear() {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
    setQuery(""); setActiveQuery(""); setResults(null); setError("");
    input.current?.focus();
  }

  function simplify() {
    input.current?.focus();
    input.current?.select();
  }

  const displayed = results?.listings ?? catalogue;
  const labels = results ? intentLabels(results.interpretedIntent) : [];
  const ordering = results ? sortDescription(results.interpretedIntent) : undefined;

  return <div className="mt-7 sm:mt-9">
    <section aria-labelledby="search-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <h2 id="search-heading" className="text-lg font-bold text-slate-950 sm:text-xl">Search the marketplace</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Include your budget, specifications, use case, or preferred ordering.</p>
      </div>
      <form onSubmit={submit} role="search" className="mt-4">
        <label htmlFor="catalogue-search" className="sr-only">Describe the laptop you need</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input ref={input} id="catalogue-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} placeholder="e.g. Lightweight, under $800, at least 16GB RAM" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-inner shadow-slate-100 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
          <button type="submit" disabled={loading || !query.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {loading ? "Searching…" : "Search laptops"}
          </button>
        </div>
      </form>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Try an example</p>
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={loading} onClick={() => applySuggestion(suggestion)} className="min-h-10 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50">{suggestion}</button>)}
        </div>
      </div>
    </section>

    <div className="min-h-6" aria-live="polite">
      {loading && <p className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-800"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />Updating results while you browse…</p>}
      {error && <div role="alert" className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"><p>{error}</p><button type="button" onClick={() => void runSearch(query)} disabled={loading} className="min-h-10 self-start rounded-lg border border-red-300 bg-white px-4 font-semibold hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:self-auto">Try again</button></div>}
    </div>

    <section id="catalogue" className="scroll-mt-6 pt-7 sm:pt-9" aria-labelledby="listings-heading" aria-busy={loading}>
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="listings-heading" className="text-2xl font-bold tracking-tight text-slate-950">
            {results ? `${displayed.length} ${displayed.length === 1 ? "laptop matches" : "laptops match"} your search` : "Browse all laptops"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{activeQuery ? <>Results for “<span className="font-medium text-slate-800">{activeQuery}</span>”</> : `${catalogue.length} pre-owned sample listings`}</p>
          {ordering && <p className="mt-1 text-sm font-semibold text-blue-800">{ordering}</p>}
        </div>
        {results && <button type="button" onClick={clear} className="min-h-10 w-fit rounded-lg px-1 text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">Clear search</button>}
      </div>

      {labels.length > 0 && <div className="mb-5" aria-label="Interpreted search requirements">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Your requirements</p>
        <ul className="flex flex-wrap gap-2">{labels.map((label) => <li key={label} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900">{label}</li>)}</ul>
      </div>}

      {process.env.NODE_ENV === "development" && results && <details className="mb-5 rounded-xl border border-slate-200 bg-white p-3 text-sm"><summary className="cursor-pointer font-medium">Search details (development)</summary><p className="mt-2">Retrieval: {results.retrieval}</p>{results.fallbackReason && <p className="mt-1">Fallback reason: {results.fallbackReason}</p>}<pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify({ interpretedIntent: results.interpretedIntent, scores: results.scores }, null, 2)}</pre></details>}

      {displayed.length
        ? <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-70" : ""}`}>{displayed.map((listing) => <ListingCard key={listing.id} listing={listing} matchReasons={results?.matchReasons[listing.id]} />)}</div>
        : <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl" aria-hidden="true">⌕</div><h3 className="mt-4 text-lg font-bold">No laptops match those requirements.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Try removing a constraint, raising your budget, or returning to the full catalogue.</p><div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><button type="button" onClick={simplify} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Try fewer requirements</button><button type="button" onClick={clear} className="min-h-11 rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Clear search</button></div></div>}
    </section>
  </div>;
}
