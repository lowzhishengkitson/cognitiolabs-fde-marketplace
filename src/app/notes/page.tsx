import type { Metadata } from "next";
export const metadata: Metadata = { title: "Project notes | Second Loop" };
const sections = [
  { title: "What I built and who it is for", text: "A mobile-friendly marketplace for people comparing pre-owned laptops. Search is designed to use a model to interpret the query as structured intent, validate that intent, then filter and rank with deterministic TypeScript. A limited local parser remains the fallback." },
  { title: "Seeded/simulated features", text: "Six local TypeScript listings are seeded. Prices, condition, battery health and seller locations are illustrative. The search model integration has not yet been verified against a live Cognitio gateway response." },
  { title: "AI coding tools and models", text: "This prototype was developed with Codex. A specific search model has not yet been verified; server-side Cognitio configuration requires the candidate gateway documentation and credentials. Structured model output is validated before use. The API response reports whether the LLM or local fallback parsed the query." },
  { title: "Features intentionally not built", text: "Embeddings and vector search are not used. Authentication, payments, messaging and database integration are outside this version." },
  { title: "Known issues and unfinished work", text: "Catalogue Q&A is unfinished. The unverified gateway adapter assumes an OpenAI-compatible chat endpoint; its request and response must be checked against the candidate console. The local parser recognizes only common phrases and may miss nuanced requests. Images are placeholders." },
];
export default function NotesPage() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
    <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Public documentation</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Project notes</h1>
    <p className="mt-4 leading-7 text-slate-600">A living record of this assessment prototype.</p>
    <div className="mt-8 space-y-4">{sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-2 leading-7 text-slate-600">{section.text}</p></section>)}</div>
  </main>;
}
