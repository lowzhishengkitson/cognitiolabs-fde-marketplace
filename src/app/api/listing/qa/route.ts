import { listings } from "@/data/listings";
import { askListingModel } from "@/lib/qa/gateway";
import { answerListingQuestion, listingQaRequestSchema, resolveListingScope } from "@/lib/qa/listing";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send a JSON body with a listing ID and question." }, { status: 400 }); }

  const parsed = listingQaRequestSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Provide a valid listing ID and a question between 1 and 500 characters." }, { status: 400 });

  const listing = resolveListingScope(listings, parsed.data.listingId);
  if (!listing) return Response.json({ error: "That listing does not exist in the catalogue." }, { status: 404 });

  try {
    return Response.json(await answerListingQuestion(parsed.data.question, listing, askListingModel));
  } catch {
    console.warn("Listing Q&A gateway or response failed.");
    return Response.json({ error: "Listing Q&A is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
