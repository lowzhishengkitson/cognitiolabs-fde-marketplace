import { z } from "zod";
import { listings } from "@/data/listings";
import { searchCatalogue } from "@/lib/search-catalogue";
import { extractSearchIntent } from "@/lib/search-intent-server";

const requestSchema = z.strictObject({ query: z.string().trim().min(1).max(500) });

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send a JSON body with a query." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Query must be between 1 and 500 characters." }, { status: 400 });

  try {
    const { intent, source } = await extractSearchIntent(parsed.data.query);
    return Response.json({ interpretedIntent: intent, parser: source, listings: searchCatalogue(listings, intent) });
  } catch {
    return Response.json({ error: "Search could not be interpreted. Try a simpler query." }, { status: 422 });
  }
}
