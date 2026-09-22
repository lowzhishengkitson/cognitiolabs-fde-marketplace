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
- `src/lib/search-intent-server.ts`: server-only model-first intent orchestration with local fallback.
- `src/lib/cognitio-gateway.ts`: isolated provider request and environment configuration.
- `src/lib/model-intent-response.ts`: strict validation of the model response.
- `src/lib/local-intent.ts` and `src/lib/intent-fallback.ts`: existing phrase parser and fallback path.
- `src/lib/search-intent.ts`: validated SearchIntent schema.
- `src/lib/search-catalogue.ts`: deterministic hard filtering and preference ranking.
- `src/app/listing/[id]/page.tsx`: statically generated detail routes.
- `src/app/notes/page.tsx`: public project notes.
- `src/app/layout.tsx` and `src/app/globals.css`: common navigation and Tailwind styles.

The App Router reads local data directly. Prices and locations are illustrative Singapore-based seed data; images are placeholders. No database, embeddings or catalogue Q&A are included.

## Search configuration

Search works without credentials using a limited server-side phrase parser. To attempt LLM intent extraction, set all three variables in a local `.env.local` based on `.env.example`:

- `COGNITIO_API_URL`: full gateway request URL.
- `COGNITIO_MODEL`: gateway model ID.
- `COGNITIO_API_KEY`: server-side key.

The gateway adapter currently assumes an OpenAI-compatible chat completions request, bearer authorization, JSON-object response mode and JSON text in `choices[0].message.content`. **This has not been verified against the actual Cognitio gateway.** Consult the setup instructions and console on your candidate page, then adjust only `src/lib/cognitio-gateway.ts` and, if needed, the response decoder. No real gateway response has been tested. Never use a `NEXT_PUBLIC_` prefix for the key or commit `.env.local`.

`POST /api/search` accepts `{ "query": "..." }` and returns `{ interpretedIntent, parser, listings }`, with `parser` set to `llm` or `local-fallback`. Hard constraints (price range, minimum RAM/storage, maximum weight, brand and condition) remove listings. Use case and preferences only rank remaining listings. If configuration is missing or the model request or validation fails, search uses the local parser. Unrecognized local phrases may result in the full catalogue; inspect `interpretedIntent` to understand that limitation.

In development, submit a search and expand **Search interpretation (development)** below the results. On a deployed build, inspect the `/api/search` response in browser developer tools to see `parser` and `interpretedIntent`. A response marked `llm` verifies a successful model response for that request; `local-fallback` does not.
