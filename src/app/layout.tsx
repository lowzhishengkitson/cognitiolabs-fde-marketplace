import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Second Loop | Pre-owned laptops", description: "Browse sample second-hand laptops." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-screen antialiased">
    <header className="border-b border-slate-200 bg-white">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-1 px-4 py-2 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center rounded-md text-xl font-extrabold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">second<span className="text-blue-700">loop</span><span className="sr-only"> home</span></Link>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/#catalogue" className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Browse</Link>
          <Link href="/notes" className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Project notes</Link>
        </div>
      </nav>
    </header>
    {children}
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><p className="font-bold text-slate-800">Second Loop</p><p className="mt-1">Demo marketplace · Seeded listings only</p></div>
        <Link href="/notes" className="w-fit rounded-md font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">Project notes</Link>
      </div>
    </footer>
  </body></html>;
}
