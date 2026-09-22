# Second Loop

A mobile-first second-hand laptop marketplace prototype for the CognitioLabs Associate FDE assessment.

## Run

Node.js 20 or newer:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Check with `npm run lint` and `npm run build`.

## Architecture

- `src/data/listings.ts`: Listing type, six simulated listings and ID lookup.
- `src/lib/format.ts`: SGD and storage display formatting.
- `src/components/listing-card.tsx`: browse card.
- `src/app/page.tsx`: catalogue browse route.
- `src/app/listing/[id]/page.tsx`: statically generated detail routes.
- `src/app/notes/page.tsx`: public project notes.
- `src/app/layout.tsx` and `src/app/globals.css`: common navigation and Tailwind styles.

The App Router reads local data directly. There is no API or database. Prices and locations are illustrative Singapore-based seed data. Search is disabled and images are placeholders.
