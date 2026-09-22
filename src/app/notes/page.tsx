import type { Metadata } from "next";

export const metadata: Metadata = { title: "Project notes | Second Loop" };

const sections = [
  {
    title: "What I built and who it is for",
    points: [
      "Second Loop is a phone-friendly second-hand laptop marketplace demo for people comparing options for study, work, travel, and gaming. Anyone can browse listings and open a detail page without signing in.",
      "Search accepts a natural-language query. The server embeds the query and seeded listings, filters explicit constraints such as a maximum price or minimum RAM in TypeScript, then orders eligible listings by cosine similarity. The model does not choose listing IDs or change catalogue facts.",
      "Catalogue Q&A answers questions and comparisons from selected seeded listings. Broad numeric questions use deterministic checks over the full catalogue; open-ended questions use semantic retrieval to find relevant records. Answers link to their supporting listings.",
    ],
  },
  {
    title: "Seeded and simulated features",
    points: [
      "The 50 laptops, prices, condition descriptions, battery health figures, and seller locations are illustrative local TypeScript data. There are no real sellers or transactions, and the laptop artwork is a placeholder.",
      "Catalogue embeddings are cached in memory per server process. A serverless cold start or another instance may generate them again; no vectors or listings are stored in a database.",
    ],
  },
  {
    title: "AI coding tools and models",
    points: [
      "I used Codex to develop this prototype and checked search and Q&A with automated tests using mocked model requests. Semantic retrieval uses openai/text-embedding-3-small and catalogue Q&A uses openai/gpt-4o-mini through the CognitioLabs-provided gateway. The key stays on the server.",
      "Q&A supplies actual catalogue records as JSON and instructs the model to treat seller text as untrusted data. Missing facts must be acknowledged; battery health does not establish battery runtime. Real gateway responses have not yet been verified in this environment.",
    ],
  },
  {
    title: "Features intentionally not built",
    points: [
      "I prioritized a browsable catalogue, item details, and searchable results. Authentication, payments, messaging, logistics, and database integration are outside this demo's current scope.",
      "Q&A is a single-question interaction, without persistent conversations. Authentication, payments, messaging, and real seller transactions are not implemented.",
    ],
  },
  {
    title: "Known issues and unfinished work",
    points: [
      "If embedding retrieval fails or the key is missing, search falls back to a limited local phrase parser and deterministic ranking. A vague query may show all listings because the parser recognizes only common explicit constraints and a few preferences.",
      "The search API labels results as embedding or local-fallback and provides a coarse fallback reason. Q&A instead reports temporary unavailability if its gateway fails. I still need to verify real embedding and chat gateway responses and the deployed experience with the candidate key; listing images remain placeholders.",
    ],
  },
];

export default function NotesPage() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
    <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Public documentation</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Project notes</h1>
    <p className="mt-4 leading-7 text-slate-600">What I built, how search works, and what remains to be done.</p>
    <div className="mt-8 space-y-4">
      {sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{section.title}</h2>
        <div className="mt-3 space-y-3 leading-7 text-slate-600">{section.points.map((point) => <p key={point}>{point}</p>)}</div>
      </section>)}
    </div>
  </main>;
}
