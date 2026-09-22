import { ListingCard } from "@/components/listing-card";
import { listings } from "@/data/listings";

export default function Home() {
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <section className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Pre-owned, with purpose</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Find your next laptop.</h1>
      <p className="mt-4 leading-7 text-slate-600">Browse second-hand laptops for work, study, travel and play.</p>
    </section>
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <label htmlFor="catalogue-search" className="mb-2 block text-sm font-semibold">Search listings <span className="font-normal text-slate-500">(preview only)</span></label>
      <input id="catalogue-search" type="search" disabled placeholder="Search by brand, model or use case" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base placeholder:text-slate-400 disabled:cursor-not-allowed" />
    </div>
    <section className="mt-10" aria-labelledby="listings-heading">
      <div className="mb-5 flex items-end justify-between gap-3"><h2 id="listings-heading" className="text-2xl font-bold">Available laptops</h2><p className="text-sm text-slate-500">{listings.length} sample listings</p></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
    </section>
  </main>;
}
