import Link from "next/link";
export default function ListingNotFound() {
  return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl" aria-hidden="true">⌕</div><h1 className="mt-4 text-3xl font-bold">Listing not found</h1><p className="mt-3 text-slate-600">That sample listing is unavailable or may have moved.</p><Link href="/#catalogue" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Browse laptops</Link></main>;
}
