import type { Metadata } from "next";

export const metadata: Metadata = { title: "Project notes | Second Loop" };

const sections = [
  {
    title: "What I built and who it is for",
    points: [
      "Second Loop is a mobile-friendly second-hand laptop marketplace for buyers comparing used laptops for study, work, travel, programming, and gaming. It supports catalogue browsing, detailed listings, natural-language search, two-laptop comparison, and grounded Q&A without requiring sign-in.",
      "TypeScript owns catalogue truth. It applies search constraints and sorts, computes extrema and comparison differences, answers exact specification questions, detects known missing information, and validates model source IDs. Embeddings improve semantic relevance, while the chat model explains grounded facts when interpretation is useful.",
      "Search results show interpreted requirements and deterministic ‘Why this matched’ reasons. Comparison works without AI; comparison Q&A is an explanatory layer over facts already computed by the application.",
    ],
  },
  {
    title: "Seeded / simulated / limited",
    points: [
      "The catalogue contains 50 seeded TypeScript listings. Prices, conditions, descriptions, battery-health figures, and seller locations are illustrative; there are no real sellers or transactions.",
      "The image components support local files under /public/listings and fall back safely when an image is absent. The current catalogue uses neutral placeholders rather than real product photography.",
      "Listings and vectors are not stored in a database. Catalogue embeddings are cached per server process, so a cold start or another server instance may generate them again.",
    ],
  },
  {
    title: "AI tools and models",
    points: [
      "Codex was used as the AI coding tool. Semantic retrieval uses openai/text-embedding-3-small, and grounded explanations use openai/gpt-4o-mini through the CognitioLabs-provided OpenRouter-compatible gateway. CLASSGW_KEY is read only by server-side code.",
      "Catalogue Q&A computes exact and global facts over the correct catalogue scope, using semantic retrieval only for open-ended recommendations. Product Q&A answers exact facts from one authoritative listing without embeddings. Comparison Q&A receives exactly two listings and TypeScript-computed numeric differences.",
      "The production deployment and gateway-backed embedding and chat flows were verified end-to-end after deployment. Automated tests use mocked model requests and do not consume live gateway allowance.",
    ],
  },
  {
    title: "Features intentionally not built",
    points: [
      "Authentication, payments, messaging, delivery and collection logistics, real seller accounts, moderation, and transaction infrastructure were deliberately left outside the assessment scope.",
      "There is no persistent database, vector store, or conversation history. Q&A is a focused one-question interaction rather than a persistent chatbot.",
      "This scope prioritizes a demonstrable buyer journey, deterministic catalogue correctness, grounded model use, and graceful failure behavior.",
    ],
  },
  {
    title: "Known issues / remaining limitations",
    points: [
      "If embedding retrieval or CLASSGW_KEY is unavailable, marketplace search falls back to local deterministic parsing and preference scoring. Hard constraints and explicit sorts remain enforced, but open-ended semantic relevance is more limited.",
      "Interpretive Q&A depends on the provided gateway and reports temporary unavailability rather than fabricating an answer. Deterministic factual answers continue to work without chat where supported.",
      "Seller text is treated as untrusted data, model source IDs are validated server-side, and missing catalogue facts are acknowledged. Battery-health percentage does not establish real battery runtime, and no external product specifications are inferred.",
    ],
  },
];

export default function NotesPage() {
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">Assessment disclosure</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Project notes</h1>
    <p className="mt-3 max-w-2xl leading-7 text-slate-600">What Second Loop implements, where AI is used, and what remains intentionally outside this demo.</p>
    <div className="mt-8 space-y-4">
      {sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
        <div className="mt-3 space-y-3 leading-7 text-slate-600">{section.points.map((point) => <p key={point}>{point}</p>)}</div>
      </section>)}
    </div>
  </main>;
}
