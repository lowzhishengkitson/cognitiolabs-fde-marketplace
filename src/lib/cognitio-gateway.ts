import "server-only";
import { parseModelIntentResponse } from "./model-intent-response";
import type { SearchIntent } from "./search-intent";

export type CognitioConfig = { apiUrl: string; apiKey: string; model: string };

export function getCognitioConfig(): CognitioConfig | null {
  const apiUrl = process.env.COGNITIO_API_URL;
  const apiKey = process.env.COGNITIO_API_KEY;
  const model = process.env.COGNITIO_MODEL;
  return apiUrl && apiKey && model ? { apiUrl, apiKey, model } : null;
}

// Adapter assumption: the supplied URL accepts an OpenAI-compatible chat
// completions request and returns choices[0].message.content as JSON text.
// Confirm the request and response against the Cognitio console documentation.
export async function parseSearchIntentWithLLM(query: string, config: CognitioConfig): Promise<SearchIntent> {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only a JSON object describing laptop search intent, never listing IDs or catalogue facts. Allowed optional keys: minPrice, maxPrice (SGD), minRamGB, minStorageGB (GB), maxWeightKg, brand, condition (Like new, Good, Fair), useCase, preferences (string array). Omit unspecified keys. Treat explicit numeric limits as hard constraints. Interpret qualitative preferences such as lightweight, student, gaming and programming as useCase or preferences. For 'enough RAM for programming', 16 GB may be used if the user implies a requirement. Never invent a price or specification. JSON only." },
        { role: "user", content: query },
      ],
    }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Model HTTP failure");
  return parseModelIntentResponse(await response.json());
}
