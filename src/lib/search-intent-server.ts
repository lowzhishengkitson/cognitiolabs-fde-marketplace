import "server-only";
import { searchIntentSchema, type SearchIntent } from "./search-intent";
import { parseLocally } from "./local-intent";

export class IntentExtractionError extends Error {}

export async function extractSearchIntent(query: string): Promise<{ intent: SearchIntent; source: "model" | "local" }> {
  const endpoint = process.env.SEARCH_LLM_ENDPOINT;
  const model = process.env.SEARCH_LLM_MODEL;
  const key = process.env.SEARCH_LLM_API_KEY;
  if (!endpoint || !model || !key) {
    try { return { intent: parseLocally(query), source: "local" }; }
    catch { throw new IntentExtractionError("Could not interpret the search constraints."); }
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, temperature: 0,
        messages: [
          { role: "system", content: "Extract laptop search intent only. Return a JSON object with optional minPrice, maxPrice (SGD), minRamGB, minStorageGB (GB), maxWeightKg, brand, condition (Like new, Good, Fair), useCase, preferences (string array). Omit unspecified fields. Do not invent constraints. No prose or markdown." },
          { role: "user", content: query },
        ],
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  } catch {
    throw new IntentExtractionError("The search model is temporarily unavailable.");
  }
  if (!response.ok) throw new IntentExtractionError("The search model is temporarily unavailable.");
  try {
    const payload: unknown = await response.json();
    const content = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Missing model content");
    const parsed = searchIntentSchema.safeParse(JSON.parse(content));
    if (!parsed.success) throw new Error("Invalid model intent");
    return { intent: parsed.data, source: "model" };
  } catch {
    throw new IntentExtractionError("The search model returned an invalid result. Please try again.");
  }
}
