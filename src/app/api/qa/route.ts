import { listings } from "@/data/listings";
import { qaRequestSchema, answerCatalogueQuestion } from "@/lib/qa/core";
import { askCatalogueModel } from "@/lib/qa/gateway";
import { retrieveListings } from "@/lib/search/retrieval/embedding-client";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send a JSON body with a question." }, { status: 400 }); }
  const parsed = qaRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Question must be between 1 and 500 characters." }, { status: 400 });
  try {
    const result = await answerCatalogueQuestion(parsed.data.question, listings, retrieveListings, askCatalogueModel);
    return Response.json(result);
  } catch {
    console.warn("Catalogue Q&A gateway or response failed.");
    return Response.json({ error: "Catalogue Q&A is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
