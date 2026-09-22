import { searchIntentSchema, type SearchIntent } from "./schema";

// Never use raw model content for catalogue results or client-facing errors.
export function parseModelIntentResponse(payload: unknown): SearchIntent 
{
  if (typeof payload !== "object" || payload === null || !("choices" in payload)) 
    throw new Error("Invalid response envelope");
  const choices = payload.choices;
  if (!Array.isArray(choices)) 
    throw new Error("Invalid response choices");
  const content: unknown = choices[0]?.message?.content;
  if (typeof content !== "string") 
    throw new Error("Missing model content");
  let raw: unknown;
  try { raw = JSON.parse(content); }
  catch { throw new Error("Malformed model JSON"); }
  const parsed = searchIntentSchema.safeParse(raw);
  if (!parsed.success) 
    throw new Error("Invalid model intent");
  return parsed.data;
}
