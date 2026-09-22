import Link from "next/link";
export default function ListingNotFound() {
  return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Listing not found</h1><p className="mt-3 text-slate-600">That sample listing is unavailable.</p><Link href="/" className="mt-6 inline-block font-semibold text-blue-700 hover:underline">Browse laptops →</Link></main>;
}
