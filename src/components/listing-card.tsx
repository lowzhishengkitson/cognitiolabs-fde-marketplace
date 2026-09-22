import Link from "next/link";
import type { Listing } from "@/data/listings";
import { formatPrice, formatStorage } from "@/lib/listings/format";

export function ListingCard({ listing }: { listing: Listing }) {
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100 text-6xl text-slate-500" aria-hidden="true">▱</div>
    <div className="p-5">
      <div className="flex justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-blue-700"><span>{listing.brand}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{listing.condition}</span></div>
      <h2 className="mt-3 text-lg font-semibold"><Link className="hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-700" href={`/listing/${listing.id}`}>{listing.title}</Link></h2>
      <p className="mt-2 text-2xl font-bold">{formatPrice(listing.price)}</p>
      <p className="mt-1 text-sm text-slate-500">{listing.sellerLocation}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div><dt className="text-slate-500">CPU</dt><dd>{listing.cpu}</dd></div>
        <div><dt className="text-slate-500">Memory</dt><dd>{listing.ramGB} GB RAM</dd></div>
        <div><dt className="text-slate-500">Storage</dt><dd>{formatStorage(listing.storageGB)}</dd></div>
        <div><dt className="text-slate-500">Weight</dt><dd>{listing.weightKg} kg</dd></div>
      </dl>
      <Link className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline" href={`/listing/${listing.id}`}>View details →</Link>
    </div>
  </article>;
}
