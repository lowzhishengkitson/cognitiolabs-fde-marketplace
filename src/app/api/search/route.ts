import { z } from "zod";
import { listings } from "@/data/listings";
import { retrieveListings } from "@/lib/search/retrieval/embedding-client";
import { searchWithFallback } from "@/lib/search/service";
import { classifyEmbeddingFailure } from "@/lib/search/retrieval/errors";

const requestSchema = z.strictObject({ query: z.string().trim().min(1).max(500) });

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send a JSON body with a query." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Query must be between 1 and 500 characters." }, { status: 400 });

  try {
    const result = await searchWithFallback(
      parsed.data.query, listings, retrieveListings,
      // Log only a coarse reason, never the query, credentials or provider response.
      (error) => {
        const reason = classifyEmbeddingFailure(error);
        console.warn("Embedding retrieval failed; using local search:", reason);
        return reason;
      },
    );
    return Response.json(result);
  } catch {
    return Response.json({ error: "Search could not be interpreted. Try a simpler query." }, { status: 422 });
  }
}
