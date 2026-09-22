import { listings } from "@/data/listings";
import { answerComparisonQuestion, comparisonQaRequestSchema, resolveComparisonScope } from "@/lib/qa/comparison";
import { askComparisonModel } from "@/lib/qa/gateway";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send a JSON body with two listing IDs and a question." }, { status: 400 }); }
  const parsed = comparisonQaRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Provide two different listing IDs and a question between 1 and 500 characters." }, { status: 400 });

  let scope;
  try { scope = resolveComparisonScope(listings, parsed.data.listingIds); }
  catch { return Response.json({ error: "Both comparison listings must exist in the catalogue." }, { status: 400 }); }

  try {
    return Response.json(await answerComparisonQuestion(parsed.data.question, scope, askComparisonModel));
  } catch {
    console.warn("Comparison Q&A gateway or response failed.");
    return Response.json({ error: "Comparison Q&A is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
