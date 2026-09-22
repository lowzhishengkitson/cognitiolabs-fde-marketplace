import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, listings } from "@/data/listings";
import { formatPrice, formatStorage } from "@/lib/listings/format";
import { ListingImage } from "@/components/listing-image";

type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() { return listings.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getListing((await params).id);
  return { title: item ? `${item.title} | Second Loop` : "Listing not found | Second Loop" };
}

export default async function ListingPage({ params }: Props) {
  const item = getListing((await params).id);
  if (!item) notFound();
  const specs = [
    ["CPU", item.cpu], ["GPU", item.gpu],
    ["RAM", `${item.ramGB} GB`], ["Storage", formatStorage(item.storageGB)],
    ["Screen size", `${item.screenSizeInches} inches`], ["Weight", `${item.weightKg} kg`],
    ["Battery health", `${item.batteryHealth}%`], ["Condition", item.condition],
  ];
  const keySpecs = [
    ["RAM", `${item.ramGB}GB`], ["Storage", formatStorage(item.storageGB)],
    ["Weight", `${item.weightKg}kg`], ["Battery", `${item.batteryHealth}%`],
    ["Screen", `${item.screenSizeInches}″`],
  ];
  return <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
    <Link href="/#catalogue" className="inline-flex min-h-10 items-center rounded-lg text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">← Back to listings</Link>
    <div className="mt-5 grid min-w-0 gap-7 lg:grid-cols-5 lg:gap-10">
      <ListingImage src={item.image} alt={`${item.title} product photo`} sizes="(min-width: 1024px) 60vw, 100vw" priority className="aspect-[4/3] w-full rounded-2xl border border-slate-200 lg:col-span-3" />
      <div className="lg:col-span-2 lg:py-3">
        <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{item.brand}</p><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{item.condition}</span></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{item.title}</h1>
        <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">{formatPrice(item.price)}</p>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500"><svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18s6-5.1 6-11A6 6 0 1 0 4 7c0 5.9 6 11 6 11Zm0-8.5A2.5 2.5 0 1 0 10 4a2.5 2.5 0 0 0 0 5.5Z" clipRule="evenodd"/></svg>Listed in {item.sellerLocation} · Sample listing</p>
        <dl className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-3">
          {keySpecs.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-bold">{value}</dd></div>)}
        </dl>
      </div>
    </div>
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2" aria-labelledby="about-heading">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Seller-provided demo text</p>
        <h2 id="about-heading" className="mt-2 text-xl font-bold text-slate-950">About this laptop</h2>
        <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
      </section>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="location-heading">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700" aria-hidden="true"><svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor"><path fillRule="evenodd" d="M10 18s6-5.1 6-11A6 6 0 1 0 4 7c0 5.9 6 11 6 11Zm0-8.5A2.5 2.5 0 1 0 10 4a2.5 2.5 0 0 0 0 5.5Z" clipRule="evenodd"/></svg></div>
        <h2 id="location-heading" className="mt-4 text-sm font-semibold text-slate-500">Seller location</h2>
        <p className="mt-1 text-lg font-bold text-slate-950">{item.sellerLocation}</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">Location is part of this seeded demo listing. No seller account information is available.</p>
      </aside>
    </div>
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="specifications-heading">
      <h2 id="specifications-heading" className="text-xl font-bold text-slate-950">Specifications and condition</h2>
      <dl className="mt-4 grid gap-x-10 sm:grid-cols-2">{specs.map(([label, value]) => <div key={label} className="flex min-w-0 justify-between gap-4 border-t border-slate-100 py-3.5 text-sm"><dt className="shrink-0 text-slate-500">{label}</dt><dd className="min-w-0 break-words text-right font-semibold text-slate-800">{value}</dd></div>)}</dl>
    </section>
  </main>;
}
