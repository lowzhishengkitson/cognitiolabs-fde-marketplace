import { parseLocally } from "./local";
import type { SearchIntent } from "./schema";

export type IntentSource = "llm" | "local-fallback";

export async function resolveSearchIntent(query: string,
  modelParser: (() => Promise<SearchIntent>) | null,
  onModelFailure: () => void,): Promise<{ intent: SearchIntent; source: IntentSource }> 
{
  if (modelParser) 
  {
    try 
    { 
      return { intent: await modelParser(), source: "llm" }; 
    }
    catch 
    { 
      onModelFailure(); 
    }
  }
  return { intent: parseLocally(query), source: "local-fallback" };
}
