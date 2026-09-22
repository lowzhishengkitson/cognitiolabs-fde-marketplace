# Second Loop

Second Loop is a mobile-friendly, second-hand laptop marketplace demo built for the CognitioLabs Associate Forward Deployed Engineer assessment. Buyers can browse 50 seeded listings, open a laptop's details, and describe what they need in everyday language. The public `/notes` page explains the demo's scope and unfinished work.

The app uses **Next.js App Router, TypeScript, Tailwind CSS, Zod, and the official OpenAI JavaScript SDK**. Listings are stored in local TypeScript data. There is no database or account system.

## What you can do

- Browse cards showing price, CPU, RAM, storage, condition, and weight.
- Open `/listing/[id]` for the full specifications, description, and seller location.
- Search with phrases such as `something portable for university programming` or `under $800 with at least 16GB RAM`.
- Ask catalogue-grounded questions or compare laptops, with links to the listings used in the answer.
- Read `/notes` without signing in.

All listing prices and seller details are illustrative. Laptop artwork is a placeholder. Payments, messaging, and authentication are not implemented.

## Run locally

Use Node.js 20 or newer:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On Windows PowerShell, copy `.env.example` to `.env.local` with `Copy-Item .env.example .env.local`. If PowerShell blocks `npm.ps1`, run `npm.cmd` in place of `npm`.

Search works without a key through the limited local parser. Exact Q&A facts and named comparisons are also computed locally; semantic recommendations require a working gateway. To try semantic retrieval and recommendation Q&A, set this variable in `.env.local` and restart the development server:

```dotenv
CLASSGW_KEY=your-candidate-gateway-key
```

The key belongs only on the server. For deployment, set `CLASSGW_KEY` in the hosting provider's server environment. Do not prefix it with `NEXT_PUBLIC_`, commit `.env.local`, or paste the key into the browser. The `.gitignore` excludes `.env` files while retaining `.env.example`.

The SDK is configured for the CognitioLabs-provided OpenRouter-compatible base URL `https://174.138.16.223/openrouter/v1`, embedding model `openai/text-embedding-3-small`, and Q&A chat model `openai/gpt-4o-mini`. Model IDs include vendor prefixes. Search does not use the chat model.

## How search works

1. The homepage sends `{ "query": "..." }` to `POST /api/search`.
2. The local parser extracts **explicit hard constraints** into a validated `SearchIntent`: price range, minimum RAM or storage, maximum weight, brand, and condition. It does not infer a numeric requirement from a vague phrase.
3. If `CLASSGW_KEY` is available, the server embeds the query and a text representation of each seeded listing. The representation includes only catalogue fields such as price, hardware, condition, and description.
4. Deterministic TypeScript filtering removes listings that violate explicit constraints. Cosine similarity ranks the remaining listings by semantic relevance. The model never chooses listing IDs or changes listing facts.
5. If embedding retrieval fails or the key is absent, the existing local search ranks and filters the same seeded catalogue. In this fallback, a vague query may yield the full catalogue because the phrase parser recognizes only a limited set of terms.

The 50 catalogue embeddings are requested together and cached in the server process. Concurrent searches share the same in-flight catalogue request. Each query gets a new embedding. A changed catalogue regenerates the cache; a serverless cold start or another server instance may do so as well. Vectors are not persisted.

The response includes `listings`, `interpretedIntent`, `retrieval` (`embedding` or `local-fallback`), and scores for embedding results. A fallback also includes a coarse `fallbackReason`, such as `missing-key`, `gateway-auth`, or `gateway-network`. No key, authorization header, or provider response text is returned.

### Check which path ran

In development, submit a search and expand **Search details (development)** below the results. In a deployed build, inspect the `/api/search` response in browser developer tools. `retrieval: "embedding"` means vectors were returned for that request; `local-fallback` means deterministic local search ran. An empty `interpretedIntent` means no explicit constraint was recognized; it does not by itself explain why fallback occurred. Inspect `fallbackReason` for that.

The embedding integration has been tested with mocked vectors, but **a real CognitioLabs gateway response has not been verified in this repository's test environment**. Verify it with your candidate key before presenting a deployed demo as model-backed.

## Catalogue Q&A

The question panel sends `{ "question": "..." }` to `POST /api/qa`. Questions are classified as missing-information, named-comparison, exact-factual, or semantic-recommendation. Exact global and filtered extrema are computed over the correct catalogue scope in TypeScript. Named products are resolved from IDs, models, titles, and controlled aliases, and their numeric relationships are computed before an answer is produced.

Exact facts and named numeric comparisons return deterministic answers and computed fact metadata, so the chat model cannot reverse values or global rankings. Only open-ended recommendations use embeddings and `openai/gpt-4o-mini`; the server sends the selected records as JSON, validates source IDs, and treats seller descriptions as untrusted data. Unavailable facts remain explicit. In particular, battery health percentages cannot establish battery runtime. If retrieval or chat fails, semantic Q&A reports temporary unavailability rather than fabricating an answer. Search retains its separate local fallback.

To verify a live response, configure `CLASSGW_KEY`, run `npm run dev`, ask an open-ended recommendation such as “good for travelling and programming,” and inspect `/api/qa` in the browser Network panel. A successful `200` response contains `answer` and real catalogue `sources`; a `503` indicates retrieval or chat failed. Exact questions such as “Which laptop is lightest?” intentionally do not call the gateway. The tests use mocks and do not verify live gateway access.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/data/listings.ts` | Listing type and 50 seeded laptops |
| `src/app/page.tsx`, `src/components/marketplace-search.tsx` | Browse page and interactive search UI |
| `src/app/listing/[id]/page.tsx` | Listing detail page |
| `src/app/api/search/route.ts` | Request validation and search response |
| `src/app/api/qa/route.ts`, `src/components/catalogue-assistant.tsx` | Q&A endpoint and question panel |
| `src/lib/qa/` | Deterministic context selection, grounding prompt, model adapter, and source validation |
| `src/lib/search/intent/` | Intent schema, local parser, and inactive chat adapter |
| `src/lib/search/catalogue.ts` | Deterministic filtering and fallback ranking |
| `src/lib/search/retrieval/` | Server-only embedding client, listing serialization, vector cache, cosine ranking, and safe error categories |
| `src/lib/search/service.ts` | Embedding-first search and local fallback |
| `src/lib/listings/format.ts` | Listing price and storage display formatting |
| `src/tests/search/` | Search and retrieval tests, separate from application code |
| `src/app/notes/page.tsx` | Public assessment notes |

An earlier experimental chat-based intent adapter remains in `src/lib/search/intent/gateway.ts` and related files. **The current `/api/search` route does not call it.** The optional `COGNITIO_*` entries in `.env.example` belong to that unused adapter; only `CLASSGW_KEY` is needed for active semantic search.

## Checks

```bash
npm run lint
npm test
npm run build
```

Tests mock embedding and chat requests and do not consume gateway allowance. They cover catalogue text, cosine similarity, ranking, cache reuse, hard constraints, fallback behavior, Q&A context selection, and source validation.
