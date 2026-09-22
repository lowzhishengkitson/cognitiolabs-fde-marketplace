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
- `src/lib/embedding-client.ts`: server-only OpenAI SDK client for the CognitioLabs gateway.
- `src/lib/semantic-retrieval.ts`: catalogue text, cosine similarity, batch vector cache and reusable retrieval.
- `src/lib/search-service.ts`: semantic search with deterministic local fallback.
- `src/app/listing/[id]/page.tsx`: statically generated detail routes.
- `src/app/notes/page.tsx`: public project notes.
- `src/app/layout.tsx` and `src/app/globals.css`: common navigation and Tailwind styles.

The App Router reads local data directly. Prices and locations are illustrative Singapore-based seed data; images are placeholders. No database, embeddings or catalogue Q&A are included.

## Search configuration

Search works without credentials using a limited server-side phrase parser and deterministic ranking. To enable semantic retrieval, set `CLASSGW_KEY` in a local `.env.local` based on `.env.example`. Configure the same variable as a **server-side** environment variable in deployment. Never use a `NEXT_PUBLIC_` prefix or commit the key.

The OpenAI JavaScript SDK uses `https://174.138.16.223/openrouter/v1` with model `openai/text-embedding-3-small`. The vendor prefix is part of the model ID. The provided chat model `openai/gpt-4o-mini` is not used by this retrieval flow or by catalogue Q&A yet.

The earlier optional, unverified intent adapter remains isolated for future work. It is not called by the current search route. Its separate variables are:

- `COGNITIO_API_URL`: full gateway request URL.
- `COGNITIO_MODEL`: gateway model ID.
- `COGNITIO_API_KEY`: server-side key.

That earlier chat adapter has not been verified against the actual gateway. The embedding integration has been tested with mocked vectors, but **no real gateway response has been verified** in this environment.

`POST /api/search` accepts `{ "query": "..." }` and returns `{ interpretedIntent, retrieval, listings, scores }`, with `retrieval` set to `embedding` or `local-fallback`. The local parser extracts explicit hard constraints (price range, minimum RAM/storage, maximum weight, brand and condition), which always exclude ineligible listings. The embedding ranks the remaining listings by cosine similarity. If the embedding request fails or `CLASSGW_KEY` is absent, the existing deterministic filtering and preference ranking handle the search. Unrecognized local constraints may result in overly broad matches.

Catalogue embeddings are generated in one request, cached in memory as a shared in-flight promise and regenerated if listing text changes. Query embeddings are generated per search. Each serverless cold start may recreate the catalogue cache; vectors are not persisted or shared across instances.

In development, submit a search and expand **Search details (development)** below the results. On a deployed build, inspect the `/api/search` response in browser developer tools to see `retrieval`, `interpretedIntent` and scores. A response marked `embedding` verifies that the embedding request returned vectors for that request; `local-fallback` does not. Test the deployed site with a real key before claiming gateway functionality.
