import "server-only";
import { parseModelIntentResponse } from "./model-response";
import type { SearchIntent } from "./schema";

export type CognitioConfig = { apiUrl: string; apiKey: string; model: string };

export function getCognitioConfig(): CognitioConfig | null 
{
  const apiUrl = process.env.COGNITIO_API_URL;
  const apiKey = process.env.COGNITIO_API_KEY;
  const model = process.env.COGNITIO_MODEL;
  return apiUrl && apiKey && model ? { apiUrl, apiKey, model } : null;
}

// Adapter assumption: the supplied URL accepts an OpenAI-compatible chat
// completions request and returns choices[0].message.content as JSON text.
// Confirm the request and response against the Cognitio console documentation.
export async function parseSearchIntentWithLLM(query: string, config: CognitioConfig): Promise<SearchIntent> 
{
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `Return only a JSON object describing laptop search intent.
Allowed optional fields: minPrice, maxPrice, minRamGB, maxRamGB, minStorageGB, maxStorageGB, minWeightKg, maxWeightKg, minScreenSizeInches, maxScreenSizeInches, minBatteryHealth, maxBatteryHealth, brand, condition, cpuQuery, gpuQuery, useCase, preferences, sort, exclusiveBounds.
Prices are SGD. RAM and storage are GB; convert 1 TB to 1000 GB. condition is "Like new", "Good", or "Fair". preferences is a string array.
sort is {"field":"price"|"weightKg"|"ramGB"|"storageGB"|"screenSizeInches"|"batteryHealth","direction":"asc"|"desc"}.
All min/max bounds are inclusive by default. For strict phrases such as more than, above, under, below, or less than, also put that bound's exact field name in exclusiveBounds. For example, "more than 16GB RAM" is {"minRamGB":16,"exclusiveBounds":["minRamGB"]}.
Omit unspecified fields. Explicit numeric constraints and CPU/GPU requirements are hard constraints. cpuQuery and gpuQuery may contain an exact model, a hardware family, or a vendor when CPU/GPU context is clear. Examples: "RTX" becomes gpuQuery "RTX"; "NVIDIA GPU" becomes gpuQuery "NVIDIA"; "Intel CPU" becomes cpuQuery "Intel"; "Ryzen" becomes cpuQuery "Ryzen". Preserve the requested specificity and never invent a full part name. Do not interpret ambiguous "AMD laptop" as CPU or GPU. Do not invent numeric thresholds for qualitative words. Qualitative requests such as lightweight, programming, student, gaming, or portable may become useCase/preferences. Superlatives such as cheapest, lightest, largest screen, most RAM, most storage, and highest battery health must become deterministic sorts. Never return listing IDs or catalogue facts. Return JSON only.` },
        { role: "user", content: query },
      ],
    }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) 
    throw new Error("Model HTTP failure");
  return parseModelIntentResponse(await response.json());
}
