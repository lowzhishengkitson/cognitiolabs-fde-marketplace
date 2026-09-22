import "server-only";
import { getCognitioConfig, parseSearchIntentWithLLM } from "./cognitio-gateway";
import { resolveSearchIntent } from "./intent-fallback";

export async function extractSearchIntent(query: string) 
{
  const config = getCognitioConfig();
  return resolveSearchIntent(query,
    config ? () => parseSearchIntentWithLLM(query, config) : null,
    () => console.warn("Search intent model failed; using local fallback."),
  );
}
