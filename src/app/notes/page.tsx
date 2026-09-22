import type { Metadata } from "next";
export const metadata: Metadata = { title: "Project notes | Second Loop" };
const sections = [
  { title: "What I built and who it is for", text: "A mobile-friendly browsing prototype for people comparing pre-owned laptops. Expand this section with the target user and product decisions." },
  { title: "Seeded/simulated features", text: "Six local TypeScript listings and their specifications are simulated. Prices, condition, battery health and seller locations are illustrative. Search is a visual preview only." },
  { title: "AI coding tools and models", text: "Document the coding tools and models used during development, including how they helped and what was checked manually." },
  { title: "Features intentionally not built", text: "Authentication, payments, messaging, AI search, catalogue Q&A and database integration are outside this first step." },
  { title: "Known issues and unfinished work", text: "Search does not filter listings. Listing images are placeholders, and there is no seller contact or transaction flow. Update this section as work continues." },
];
export default function NotesPage() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
    <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Public documentation</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Project notes</h1>
    <p className="mt-4 leading-7 text-slate-600">A living record of this assessment prototype.</p>
    <div className="mt-8 space-y-4">{sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-2 leading-7 text-slate-600">{section.text}</p></section>)}</div>
  </main>;
}
