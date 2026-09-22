import type { Metadata } from "next";
import Link from "next/link";
import { listings } from "@/data/listings";
import { ListingImage } from "@/components/listing-image";
import { buildComparisonRows, buildComparisonSummary, parseComparisonIds, resolveComparisonListings } from "@/lib/listings/comparison";
import { formatPrice } from "@/lib/listings/format";

export const metadata: Metadata = { title: "Compare laptops | Second Loop", description: "Compare two seeded Second Loop laptop listings side-by-side." };

type Props = { searchParams: Promise<{ ids?: string | string[] }> };

export default async function ComparePage({ searchParams }: Props) {
  const requestedIds = parseComparisonIds((await searchParams).ids);
  const resolved = resolveComparisonListings(listings, requestedIds);
  const issues = [...resolved.invalidIds.map((id) => `Unknown listing: ${id}`), ...resolved.duplicateIds.map((id) => `Duplicate listing ignored: ${id}`), ...resolved.excessIds.map((id) => `Only two laptops can be compared; ignored: ${id}`)];

  if (resolved.listings.length !== 2) return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/#catalogue" className="inline-flex min-h-10 items-center rounded-lg text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">← Back to listings</Link>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="compare-heading">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Laptop comparison</p>
      <h1 id="compare-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Choose two different laptops</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">A comparison needs two valid, distinct catalogue listings. Return to the marketplace and use the Compare controls on the cards.</p>
      {issues.length > 0 && <ul className="mt-5 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
      <Link href="/#catalogue" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Browse laptops</Link>
    </section>
  </main>;

  const [first, second] = resolved.listings;
  const rows = buildComparisonRows(first, second);
  const summary = buildComparisonSummary(first, second);

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/#catalogue" className="inline-flex min-h-10 items-center rounded-lg text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">← Back to listings</Link>
    <header className="mt-5 max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Side-by-side facts</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Compare two laptops</h1>
      <p className="mt-3 leading-7 text-slate-600">Catalogue specifications are compared deterministically. Highlights identify factual numeric differences, not an overall winner.</p>
    </header>

    {issues.length > 0 && <ul className="mt-5 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}

    <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Compared laptops">
      {[first, second].map((listing) => <article key={listing.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ListingImage src={listing.images?.[0]} alt={`${listing.title} product photo`} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full border-b border-slate-100" />
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{listing.brand} · {listing.condition}</p>
          <h2 className="mt-2 break-words text-xl font-bold text-slate-950">{listing.title}</h2>
          <p className="mt-3 text-2xl font-extrabold text-slate-950">{formatPrice(listing.price)}</p>
          <Link href={`/listing/${listing.id}`} className="mt-4 inline-flex min-h-10 items-center rounded-lg text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">View full listing →</Link>
        </div>
      </article>)}
    </section>

    {summary.length > 0 && <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="font-bold text-slate-950">Factual differences</h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">{summary.map((statement) => <li key={statement} className="flex gap-2"><span className="text-blue-700" aria-hidden="true">•</span><span>{statement}</span></li>)}</ul>
    </section>}

    <section className="mt-8" aria-labelledby="spec-comparison-heading">
      <h2 id="spec-comparison-heading" className="text-2xl font-bold text-slate-950">Specification comparison</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => <section key={row.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby={`comparison-${row.key}`}>
          <h3 id={`comparison-${row.key}`} className="text-sm font-bold text-slate-950">{row.label}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {row.values.map((value, index) => {
              const highlighted = row.preferredIndex === index;
              return <div key={`${row.key}-${index}`} className={`min-w-0 rounded-lg border px-3 py-3 ${highlighted ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
                <p className="text-xs font-semibold text-slate-500">{resolved.listings[index].model}</p>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 break-words font-semibold text-slate-900">{value}</p>{highlighted && row.advantage && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-800">{row.advantage}</span>}{row.tied && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.7rem] font-bold text-slate-600">Same</span>}</div>
              </div>;
            })}
          </div>
        </section>)}
      </div>
    </section>
  </main>;
}
