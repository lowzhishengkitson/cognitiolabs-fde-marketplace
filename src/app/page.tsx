import { MarketplaceSearch } from "@/components/marketplace-search";
import { listings } from "@/data/listings";

export default function Home() {
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <section className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Pre-owned, with purpose</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Find your next laptop.</h1>
      <p className="mt-4 leading-7 text-slate-600">Browse second-hand laptops for work, study, travel and play.</p>
    </section>
    <MarketplaceSearch catalogue={listings} />
  </main>;
}
