import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, listings } from "@/data/listings";
import { formatPrice, formatStorage } from "@/lib/format";

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
    ["Brand", item.brand], ["Model", item.model], ["CPU", item.cpu], ["GPU", item.gpu],
    ["RAM", `${item.ramGB} GB`], ["Storage", formatStorage(item.storageGB)],
    ["Screen size", `${item.screenSizeInches} inches`], ["Weight", `${item.weightKg} kg`],
    ["Condition", item.condition], ["Battery health", `${item.batteryHealth}%`],
    ["Seller location", item.sellerLocation],
  ];
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">← Back to listings</Link>
    <div className="mt-7 grid gap-8 lg:grid-cols-5">
      <div className="flex min-h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-blue-100 text-8xl text-slate-500 lg:col-span-3" aria-label="Laptop illustration placeholder"><span aria-hidden="true">▱</span></div>
      <div className="lg:col-span-2"><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">{item.brand} · {item.condition}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
        <p className="mt-5 text-3xl font-bold">{formatPrice(item.price)}</p>
        <p className="mt-2 text-sm text-slate-500">Listed in {item.sellerLocation} · Sample listing</p>
        <div className="mt-7 border-t border-slate-200 pt-6"><h2 className="text-lg font-semibold">About this laptop</h2><p className="mt-3 leading-7 text-slate-600">{item.description}</p></div>
      </div>
    </div>
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="specifications-heading">
      <h2 id="specifications-heading" className="text-xl font-bold">Specifications & condition</h2>
      <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">{specs.map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-t border-slate-100 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
    </section>
  </main>;
}
