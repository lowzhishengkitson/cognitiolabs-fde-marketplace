# Second Loop

A mobile-first second-hand laptop marketplace prototype for the CognitioLabs Associate FDE assessment.

## Run

Node.js 20 or newer:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Check with `npm run lint`, `npm test` and `npm run build`.

## Architecture

- `src/data/listings.ts`: Listing type, six simulated listings and ID lookup.
- `src/lib/format.ts`: SGD and storage display formatting.
- `src/components/listing-card.tsx`: browse card.
- `src/app/page.tsx` and `src/components/marketplace-search.tsx`: catalogue browsing and interactive search.
- `src/app/api/search/route.ts`: validated search request and response.
- `src/lib/search-intent-server.ts`: server-only intent extraction; optional model call or limited local parser.
- `src/lib/search-intent.ts`: validated SearchIntent schema.
- `src/lib/search-catalogue.ts`: deterministic hard filtering and preference ranking.
- `src/app/listing/[id]/page.tsx`: statically generated detail routes.
- `src/app/notes/page.tsx`: public project notes.
- `src/app/layout.tsx` and `src/app/globals.css`: common navigation and Tailwind styles.

The App Router reads local data directly. Prices and locations are illustrative Singapore-based seed data; images are placeholders. No database, embeddings or catalogue Q&A are included.

## Search configuration

Search works without credentials using a limited server-side phrase parser. To enable LLM intent extraction, set all three variables in a local `.env.local` based on `.env.example`:

- `SEARCH_LLM_ENDPOINT`: full HTTPS URL of an OpenAI-compatible chat completions endpoint.
- `SEARCH_LLM_MODEL`: provider model ID.
- `SEARCH_LLM_API_KEY`: server-side bearer token.

The model must return a JSON object as the first choice's message content. The endpoint format is an adapter assumption until Cognitio gateway details are available. Configured model failures or invalid output produce a safe search error; they do not silently change the user's constraints. Never use a `NEXT_PUBLIC_` prefix for the key.

`POST /api/search` accepts `{ "query": "..." }` and returns `{ intent, source, listings }`. Hard constraints (price range, minimum RAM/storage, maximum weight, brand and condition) remove listings. Use case and preferences only rank remaining listings. Unrecognized local phrases may result in the full catalogue; the returned `intent` and `source` make this visible to callers.
