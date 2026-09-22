import type { Metadata } from "next";
export const metadata: Metadata = { title: "Project notes | Second Loop" };
const sections = [
  { title: "What I built and who it is for", text: "A mobile-friendly marketplace for people comparing pre-owned laptops. Search embeds the query and catalogue, ranks matches by cosine similarity, and applies deterministic constraints for explicit requirements such as price and RAM. Local search is used if embedding retrieval fails." },
  { title: "Seeded/simulated features", text: "Six local TypeScript listings are seeded. Prices, condition, battery health and seller locations are illustrative. Catalogue vectors are cached in each server process, so a serverless cold start may embed them again." },
  { title: "AI coding tools and models", text: "This prototype was developed with Codex. Search is configured to request openai/text-embedding-3-small through the CognitioLabs-provided OpenRouter gateway using a server-side key. A real gateway response has not yet been verified. The API marks each search as embedding or local-fallback." },
  { title: "Features intentionally not built", text: "Embeddings and vector search are not used. Authentication, payments, messaging and database integration are outside this version." },
  { title: "Known issues and unfinished work", text: "Catalogue Q&A is unfinished. The embedding gateway has not been tested with a real key in this environment. Local parsing recognizes only common explicit constraints and can miss nuanced limits. Images are placeholders." },
];
export default function NotesPage() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
    <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Public documentation</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Project notes</h1>
    <p className="mt-4 leading-7 text-slate-600">A living record of this assessment prototype.</p>
    <div className="mt-8 space-y-4">{sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-2 leading-7 text-slate-600">{section.text}</p></section>)}</div>
  </main>;
}
