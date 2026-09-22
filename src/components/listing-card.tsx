import Link from "next/link";
import type { Listing } from "@/data/listings";
import { formatPrice, formatStorage } from "@/lib/listings/format";
import { ListingImage } from "@/components/listing-image";

export function ListingCard({ listing }: { listing: Listing }) {
  const href = `/listing/${listing.id}`;
  return <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
    <div className="relative border-b border-slate-100">
      <ListingImage src={listing.images?.[0]} alt={`${listing.title} product photo`} sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full" />
      <span className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{listing.condition} condition</span>
    </div>
    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{listing.brand}</p>
      <h3 className="mt-3 text-lg font-bold leading-snug text-slate-950 transition group-hover:text-blue-800"><Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none">{listing.title}</Link></h3>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{formatPrice(listing.price)}</p>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500"><svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18s6-5.1 6-11A6 6 0 1 0 4 7c0 5.9 6 11 6 11Zm0-8.5A2.5 2.5 0 1 0 10 4a2.5 2.5 0 0 0 0 5.5Z" clipRule="evenodd"/></svg><span>{listing.sellerLocation}</span></p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm">
        <div><dt className="text-xs text-slate-500">RAM</dt><dd className="mt-0.5 font-bold text-slate-800">{listing.ramGB}GB</dd></div>
        <div><dt className="text-xs text-slate-500">Storage</dt><dd className="mt-0.5 font-bold text-slate-800">{formatStorage(listing.storageGB)}</dd></div>
        <div><dt className="text-xs text-slate-500">Weight</dt><dd className="mt-0.5 font-bold text-slate-800">{listing.weightKg}kg</dd></div>
      </dl>
      <div className="mt-3 min-w-0 rounded-lg bg-slate-50 px-3 py-2.5">
        <p className="text-xs font-medium text-slate-500">Processor</p>
        <p className="mt-0.5 text-sm font-semibold leading-5 text-slate-800">{listing.cpu}</p>
      </div>
      <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-bold text-blue-700" aria-hidden="true">View details <span className="transition-transform group-hover:translate-x-0.5">→</span></span>
    </div>
  </article>;
}
