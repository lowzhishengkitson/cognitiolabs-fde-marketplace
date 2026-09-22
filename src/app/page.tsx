import { MarketplaceSearch } from "@/components/marketplace-search";
import { CatalogueAssistant } from "@/components/catalogue-assistant";
import { listings } from "@/data/listings";

export default function Home() {
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <section className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">Pre-owned, with purpose</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Find your next laptop, without buying new.</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Describe what you need in normal language and compare 50 pre-owned laptops for study, work, travel, and play.</p>
    </section>
    <MarketplaceSearch catalogue={listings} />
    <CatalogueAssistant />
  </main>;
}
