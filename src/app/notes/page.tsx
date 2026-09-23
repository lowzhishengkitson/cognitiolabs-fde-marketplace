import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Project notes | Second Loop",
  description: "Assessment notes for the Second Loop CognitioLabs FDE marketplace.",
};

const github = "https://github.com/lowzhishengkitson/cognitiolabs-fde-marketplace/blob/main/";

function SourceLink({ path, children }: { path: string; children: ReactNode }) {
  return <a href={`${github}${path}`} target="_blank" rel="noreferrer"
    className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-bold leading-5 text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
    <span className="break-words">{children}</span><span aria-hidden="true" className="shrink-0">↗</span>
  </a>;
}

function SectionHeading({ number, title, children }: { number: string; title: string; children?: ReactNode }) {
  return <div className="flex min-w-0 gap-3 sm:gap-4">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-extrabold text-white sm:size-10">{number}</span>
    <div className="min-w-0">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {children ? <p className="mt-2 max-w-3xl leading-7 text-slate-600">{children}</p> : null}
    </div>
  </div>;
}

function Subheading({ children }: { children: ReactNode }) {
  return <h3 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{children}</h3>;
}

function ProcessFlow({ label, steps }: { label: string; steps: readonly string[] }) {
  return <ol aria-label={label} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
    {steps.map((step, index) => <li key={step} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Step {index + 1}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">{step}</p>
    </li>)}
  </ol>;
}

const extractionTechniques = [
  ["Rule-based slot extraction", "Regex and deterministic patterns map explicit language to price, RAM, storage, weight, screen, battery, brand, condition, CPU, GPU, and sort fields. This is rule-based intent extraction—not an LLM parser."],
  ["Typed measurements first", "Hardware measurements are recognized before generic numbers. “At least 15 inch screen” becomes a screen constraint, never a S$15 price; 16GB RAM cannot become a S$16 budget."],
  ["Span claiming and masking", "When a phrase is recognized, its character range is claimed. Later parsers see those characters as spaces, preventing the same number from being interpreted twice."],
  ["Inclusive and strict bounds", "“At least” and “at most” are inclusive. “More than,” “under,” “above,” and “below” are recorded as strict bounds, so the boundary value is not silently admitted."],
  ["Unit normalization", "RAM and storage use decimal catalogue units: 1TB is normalized to 1000GB before filtering. Impossible requests remain valid intent and return no matches."],
  ["CPU/GPU family matching", "Token-aware aliases support exact models and families such as RTX, RTX 3060, GTX, NVIDIA, Radeon, AMD GPU, Intel Arc, Intel CPU, i7, Ryzen, Ryzen 7, AMD CPU, and Apple M-series. CPU and GPU fields never cross-match."],
  ["Qualitative heuristics", "Keywords preserve broad use cases and preferences such as programming, gaming, Unity, student, lightweight, and travel. These are useful heuristics—not deep language understanding."],
  ["Explicit sort extraction", "Phrases such as cheapest, most expensive, lightest, most RAM, largest screen, and highest battery health become deterministic sort instructions that override similarity order."],
] as const;

const responsibilities = [
  ["Explicit constraints", "Deterministic TypeScript / regex parser"],
  ["Intent validation", "Zod schema and contradiction checks"],
  ["Hard catalogue filtering", "TypeScript over catalogue fields"],
  ["Explicit sorting", "TypeScript comparator"],
  ["Semantic relevance", "openai/text-embedding-3-small + cosine similarity"],
  ["Match explanations", "Deterministic TypeScript from intent + listing facts"],
  ["Exact Q&A facts and extrema", "TypeScript"],
  ["Numeric comparisons", "TypeScript"],
  ["Catalogue recommendation wording", "openai/gpt-4o-mini over grounded context"],
  ["Product explanation", "openai/gpt-4o-mini, scoped to one listing"],
  ["Comparison explanation", "openai/gpt-4o-mini, scoped to two listings + computed facts"],
] as const;

export default function NotesPage() {
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">CognitioLabs FDE assessment</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Project notes</h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">A transparent account of what Second Loop does, where models help, where deterministic code stays authoritative, and which parts remain intentionally simulated.</p>
      <nav aria-label="Project notes sections" className="mt-6 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["#built", "1. What I built"], ["#seeded", "2. Seeded / limited"],
          ["#models", "3. Tools & models"], ["#not-built", "4. Not built"],
          ["#limitations", "5. Limitations"],
        ].map(([href, label]) => <a key={href} href={href} className="flex min-h-11 items-center rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{label}</a>)}
      </nav>
    </header>

    <section id="built" className="scroll-mt-6 py-12">
      <SectionHeading number="1" title="What I built and who it is for">
        Second Loop is a mobile-first second-hand laptop marketplace demo for buyers comparing used laptops for study, programming, work, travel, and gaming.
      </SectionHeading>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Browse with no sign-in", "Explore 50 seeded listings, inspect product details, and use the marketplace without an account."],
          ["Search in normal language", "Combine exact requirements, fuzzy needs, explicit ordering, and transparent “Why this matched” reasons."],
          ["Compare and ask", "Compare two real catalogue records, ask catalogue-wide questions, or ask within one product or comparison scope."],
        ].map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        </article>)}
      </div>

      <div className="mt-12 space-y-6">
        <div>
          <Subheading>How natural-language search works</Subheading>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">Search is hybrid: <strong className="text-slate-900">deterministic intent extraction</strong> handles exact constraints, while <strong className="text-slate-900">semantic embeddings</strong> handle the remaining fuzzy meaning. The system does not ask a chat model to decide prices, capacities, measurements, or sorting. That makes numeric behavior reproducible, preserves impossible requests, and lets tests assert exact outcomes; embeddings are better used for phrases such as “good for university travel.”</p>
        </div>
        <ProcessFlow label="Search execution flow" steps={[
          "Natural-language query", "Extract and validate explicit intent", "Hard-filter the seeded catalogue",
          "Embed the unclaimed semantic remainder", "Rank eligible listings by cosine similarity",
          "Apply an explicit sort override", "Create deterministic match reasons",
        ]} />
        <div className="flex flex-wrap gap-2">
          <SourceLink path="src/lib/search/intent/local.ts#L6-L55">View typed intent extraction</SourceLink>
          <SourceLink path="src/lib/search/intent/local.ts#L80-L117">View span removal and parser order</SourceLink>
          <SourceLink path="src/lib/search/intent/schema.ts#L20-L51">View intent validation</SourceLink>
          <SourceLink path="src/lib/search/service.ts#L10-L27">View the search service and fallback</SourceLink>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-slate-950">Intent extraction techniques</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {extractionTechniques.map(([title, body]) => <article key={title} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="font-bold text-slate-900">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceLink path="src/lib/search/intent/local.ts#L57-L78">View component intent recognition</SourceLink>
          <SourceLink path="src/lib/search/components.ts#L3-L25">View token-aware CPU/GPU matching</SourceLink>
          <SourceLink path="src/lib/search/intent/local.ts#L136-L184">View use-case and sort extraction</SourceLink>
          <SourceLink path="src/lib/search/catalogue.ts#L6-L32">View inclusive/strict filtering</SourceLink>
        </div>
      </div>

      <aside className="mt-12 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50" aria-labelledby="search-example-title">
        <div className="border-b border-blue-200 px-4 py-3 sm:px-5"><h3 id="search-example-title" className="font-bold text-blue-950">One query, two kinds of understanding</h3></div>
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Query</p>
            <blockquote className="mt-2 break-words rounded-xl bg-white p-4 font-mono text-sm leading-6 text-slate-800 shadow-sm">“RTX laptop under $1200 with at least 16GB RAM for university travel”</blockquote>
          </div>
          <dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
            {[["GPU", "RTX"], ["Maximum price", "S$1,200"], ["Minimum RAM", "16GB"], ["Semantic remainder", "laptop for university travel"]].map(([term, value]) => <div key={term} className="min-w-0 rounded-xl bg-white p-3 shadow-sm"><dt className="font-bold text-slate-500">{term}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value}</dd></div>)}
          </dl>
        </div>
        <p className="px-4 pb-5 text-sm leading-6 text-blue-950 sm:px-5">The explicit spans are claimed and removed, the hard constraints filter the catalogue, and only eligible laptops are ranked against the semantic remainder. If the query also says “cheapest first,” price order wins over similarity.</p>
      </aside>

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
        <div className="min-w-0">
          <Subheading>How semantic search works</Subheading>
          <div className="mt-4 space-y-4 leading-7 text-slate-600">
            <p>Each listing is serialized from real catalogue fields: title, brand, model, price, CPU, GPU, RAM, storage, screen size, weight, condition, battery health, seller location, and description.</p>
            <p>The cleaned semantic query and those listing representations are embedded with <strong className="text-slate-900">openai/text-embedding-3-small</strong>. Cosine similarity measures vector direction: a higher value means the query and listing text are semantically closer. Similarity can order only the listings that passed the TypeScript hard filters; it cannot reintroduce an ineligible product.</p>
            <p>All 50 listing texts are embedded in one batch and cached in the server process. Concurrent requests share the in-flight cache promise. This is appropriate for a small seeded demo, but cold starts or another server instance can regenerate vectors because there is no persistent vector database.</p>
            <p>If the gateway or key is unavailable, search falls back to deterministic filtering and local preference scoring. Exact requirements and explicit sorts still work, but fuzzy semantic ranking is less capable.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SourceLink path="src/lib/search/retrieval/semantic.ts#L7-L52">View serialization, cosine similarity, and ranking</SourceLink>
            <SourceLink path="src/lib/search/retrieval/semantic.ts#L56-L79">View batch embedding cache</SourceLink>
            <SourceLink path="src/lib/search/retrieval/embedding-client.ts#L1-L23">View the embedding model call</SourceLink>
          </div>
        </div>
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="matched-title">
          <h3 id="matched-title" className="text-lg font-bold text-slate-950">Why this matched</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Explanations are generated deterministically from the parsed intent and actual listing fields—not by another model call.</p>
          <ul className="mt-4 space-y-3 text-sm leading-6">
            <li><span className="font-bold text-emerald-700" aria-hidden="true">✓</span> Under your S$1,200 budget</li>
            <li><span className="font-bold text-emerald-700" aria-hidden="true">✓</span> Meets your 16GB RAM minimum</li>
            <li><span className="font-bold text-blue-700" aria-hidden="true">≈</span> Relevant to your university/travel request</li>
          </ul>
          <p className="mt-4 text-xs leading-5 text-slate-500"><strong>✓</strong> is a catalogue fact or hard requirement. <strong>≈</strong> is softer semantic or preference relevance; raw embedding scores are not shown as facts.</p>
          <div className="mt-4"><SourceLink path="src/lib/search/explanations.ts#L14-L48">View deterministic match explanations</SourceLink></div>
        </aside>
      </div>

      <div className="mt-16">
        <Subheading>How catalogue-grounded Q&amp;A works</Subheading>
        <p className="mt-3 max-w-4xl leading-7 text-slate-600">Catalogue Q&amp;A is deliberately not “top-k embeddings, then let a model decide.” A semantic subset can omit the true global lightest, cheapest, or heaviest laptop. The application first classifies the question, then selects an execution path where TypeScript remains authoritative for exact facts.</p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-100 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Question classification</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Exact factual", "Full or filtered catalogue scope → TypeScript min/max facts"],
              ["Named comparison", "Resolve named listings → TypeScript numeric relationships"],
              ["Missing information", "Return a deterministic limitation instead of guessing"],
              ["Semantic recommendation", "Retrieve grounded catalogue context → chat explanation"],
            ].map(([title, body]) => <article key={title} className="min-w-0 rounded-xl bg-white p-4 shadow-sm"><h4 className="font-bold text-slate-950">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Exact facts and extrema", "For “Which laptop is lightest?” or “Which under S$800 has the best battery health?”, TypeScript applies hard constraints to the correct catalogue scope and computes the requested minimum or maximum. The chat model does not choose the result."],
            ["Named comparisons", "Names and aliases resolve to catalogue records before relationships are computed. A 76% battery value cannot be described as higher than 84%, because the relationship is supplied by TypeScript rather than left to model arithmetic."],
            ["Missing information", "Questions about battery runtime, warranty, ports, or other absent facts receive an explicit limitation. Battery health is a listed percentage; it does not establish how many hours the battery lasts."],
            ["Semantic recommendations", "For “What suits a student who travels and programs?”, hard constraints still apply, embeddings retrieve relevant real listings, and the chat model explains trade-offs from that supplied context."],
          ].map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceLink path="src/lib/qa/core.ts#L29-L90">View named resolution and extrema</SourceLink>
          <SourceLink path="src/lib/qa/core.ts#L132-L160">View question classification and scoped retrieval</SourceLink>
          <SourceLink path="src/lib/qa/core.ts#L176-L202">View Q&amp;A execution paths</SourceLink>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold text-slate-950">Grounding and security boundaries</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Catalogue fields and TypeScript-computed facts are authoritative.</li>
            <li>Seller descriptions are untrusted data; prompt-like text inside them is not an instruction.</li>
            <li>Returned source IDs are validated against the exact context supplied to the model. Unknown or out-of-scope IDs are rejected.</li>
            <li>Missing information is acknowledged. The model is told not to invent benchmarks, runtime, warranty, thermals, display quality, upgradeability, seller trustworthiness, or external specifications.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <SourceLink path="src/lib/qa/core.ts#L163-L171">View source validation and grounding prompt</SourceLink>
            <SourceLink path="src/lib/qa/gateway.ts#L8-L44">View grounded chat calls</SourceLink>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold text-slate-950">Product and comparison Q&amp;A</h3>
          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-900">Product scope:</strong> the current listing is already known, so no embedding retrieval is needed. Exact specifications and known missing fields are answered deterministically; interpretive questions send only that one listing to the model.</p>
            <p><strong className="text-slate-900">Comparison scope:</strong> exactly two selected listings are resolved server-side. Price, RAM, storage, weight, screen, and battery differences are computed in TypeScript; interpretive chat receives those authoritative facts and no unrelated products.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SourceLink path="src/lib/qa/listing.ts#L87-L123">View product Q&amp;A routing</SourceLink>
            <SourceLink path="src/lib/qa/comparison.ts#L31-L48">View comparison fact computation</SourceLink>
            <SourceLink path="src/lib/qa/comparison.ts#L83-L92">View comparison Q&amp;A grounding</SourceLink>
          </div>
        </article>
      </div>
    </section>

    <section id="seeded" className="scroll-mt-6 border-t border-slate-200 py-12">
      <SectionHeading number="2" title="What is seeded, simulated, or limited">The catalogue is deliberately controlled demo data, which makes retrieval and factual checks reproducible for the assessment.</SectionHeading>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["50 seeded listings", "Stored in local TypeScript. Prices, condition, descriptions, battery health, and seller locations are illustrative."],
          ["Illustrative presentation", "There are no real sellers or transactions. Listing components support local images, but current listings use neutral placeholders."],
          ["No persistent data layer", "There is no database or persistent vector store. Catalogue changes require a code update."],
          ["Process-local vectors", "Embeddings are reused inside a running server process; serverless cold starts or other instances can generate them again."],
          ["Single-question assistants", "Catalogue, product, and comparison Q&A are focused one-question interactions, not persistent chat histories."],
          ["Assessment-sized scope", "These choices keep the demo focused on retrieval, correctness, grounding, comparison, and the mobile buyer journey."],
        ].map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
      </div>
      <div className="mt-4"><SourceLink path="src/data/listings.ts#L1-L20">View the listing schema and seeded catalogue</SourceLink></div>
    </section>

    <section id="models" className="scroll-mt-6 border-t border-slate-200 py-12">
      <SectionHeading number="3" title="AI coding tools and models">Models are used where language similarity or explanation helps. Deterministic code owns catalogue truth, constraints, and arithmetic.</SectionHeading>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["AI coding tool", "Codex", "Used to assist implementation, review, and testing. Codex is not part of the submitted application’s runtime."],
          ["Search model", "openai/text-embedding-3-small", "Embeds the cleaned semantic query and listing text for relevance ranking. It does not parse numeric constraints."],
          ["Q&A model", "openai/gpt-4o-mini", "Produces grounded explanations and recommendation wording when deterministic computation alone is insufficient. It does not own arithmetic or catalogue facts."],
        ].map(([label, title, body]) => <article key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{label}</p><h3 className="mt-2 break-words font-mono text-base font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
      </div>
      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
        <h3 className="font-bold text-blue-950">CognitioLabs model gateway</h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-950">Both models are called through the CognitioLabs-provided OpenRouter-compatible gateway. Calls use the official OpenAI JavaScript SDK on the server and authenticate with <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">CLASSGW_KEY</code>; the browser never receives the key. Model IDs retain their vendor prefixes. The deployed gateway-backed embedding and chat flows were verified end to end during production QA.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceLink path="src/lib/search/retrieval/gateway-client.ts#L1-L11">View the server-only gateway client</SourceLink>
          <SourceLink path="src/lib/ai/config.ts#L1-L7">View gateway and model defaults</SourceLink>
          <SourceLink path="src/lib/qa/gateway.ts#L8-L44">View grounded chat calls</SourceLink>
        </div>
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-bold text-slate-950">Who is responsible for what?</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">The boundary is deliberate: models help with language; deterministic code owns facts and arithmetic.</p>
        <dl className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {responsibilities.map(([responsibility, implementation], index) => <div key={responsibility} className={`grid min-w-0 gap-1 p-4 sm:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] sm:gap-6 ${index ? "border-t border-slate-200" : ""}`}><dt className="font-bold text-slate-900">{responsibility}</dt><dd className="break-words text-sm leading-6 text-slate-600 sm:text-base">{implementation}</dd></div>)}
        </dl>
      </div>
    </section>

    <section id="not-built" className="scroll-mt-6 border-t border-slate-200 py-12">
      <SectionHeading number="4" title="What I intentionally did not build, and why">This is an assessment demo rather than a production marketplace, so effort was concentrated on the buyer journey and trustworthy AI integration.</SectionHeading>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">Outside this scope</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            {["Authentication", "Real seller accounts", "Payments", "Messaging", "Shipping and collection logistics", "Persistent database", "Persistent vector database", "Production moderation and fraud systems", "Persistent chat history"].map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true" className="text-slate-400">—</span><span>{item}</span></li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">What the time went toward instead</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            {["Browse and detail usability", "Natural-language search quality", "Deterministic correctness", "Catalogue grounding", "Model integration and fallback behavior", "Two-laptop comparison", "Mobile usability"].map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true" className="font-bold text-blue-700">✓</span><span>{item}</span></li>)}
          </ul>
        </div>
      </div>
    </section>

    <section id="limitations" className="scroll-mt-6 border-t border-slate-200 py-12">
      <SectionHeading number="5" title="Known issues and unfinished parts">These are current constraints of the final demo, not features hidden behind the interface.</SectionHeading>
      <div className="mt-8 space-y-3">
        {[
          ["The catalogue is small and seeded", "Its 50 entries are useful for controlled evaluation, but cannot represent real inventory breadth or live availability."],
          ["The fallback is intentionally narrower", "When embeddings fail, hard constraints and explicit sorts remain correct, but local keyword scoring understands fewer fuzzy expressions than semantic retrieval."],
          ["The embedding cache is per process", "It is not shared across server instances or persisted across cold starts."],
          ["Vague queries can remain broad", "Semantic ranking can improve order, but it does not invent a requirement the buyer did not state."],
          ["Model-backed paths depend on the gateway", "Interpretive catalogue, product, and comparison answers report temporary unavailability rather than fabricating a response. Supported deterministic facts continue to work without chat."],
          ["Q&A is single-turn", "There is no persistent conversation memory, user account, or saved history."],
        ].map(([title, body]) => <article key={title} className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] sm:gap-6 sm:p-5"><h3 className="font-bold text-slate-950">{title}</h3><p className="text-sm leading-6 text-slate-600 sm:text-base">{body}</p></article>)}
      </div>
    </section>
  </main>;
}
