import { searchIntentSchema, type SearchIntent } from "./schema";

// Useful before model credentials are available. Only recognizes explicit patterns.
export function parseLocally(query: string): SearchIntent 
{
  const text = query.toLowerCase();
  const amount = String.raw`(?:s\$|\$|sgd\s*)?(\d+(?:\.\d+)?)(?![\d.])`;
  const numberAfter = (pattern: RegExp) => {
    const match = text.match(pattern);
    return match ? Number(match[1]) : undefined;
  };
  const minPrice = numberAfter(new RegExp(String.raw`(?:over|above|more than|at least|minimum|min)\s+${amount}(?!\s*(?:gb|tb|kg))`, "i"));
  const maxPrice = numberAfter(new RegExp(String.raw`(?:under|below|less than|up to|maximum|max|budget of)\s+${amount}(?!\s*(?:gb|tb|kg))`, "i"));
  const minRamGB = numberAfter(/(?:at least|minimum|min|over|more than)\s+(\d+)\s*gb\s*(?:of\s*)?(?:ram|memory)/i)
    ?? numberAfter(/(?:at least|minimum|min)\s+(\d+)\s*gb\b(?!\s*(?:storage|ssd))/i);
  const storage = text.match(/(?:at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*(tb|gb)\s*(?:of\s*)?(?:storage|ssd|disk)/i);
  const maxWeightKg = numberAfter(/(?:under|below|less than|up to|max(?:imum)?)\s+(\d+(?:\.\d+)?)\s*kg/i);
  const brand = ["Apple", "Lenovo", "ASUS", "Dell", "HP", "Acer"].find((name) => new RegExp(String.raw`\b${name}\b`, "i").test(query));
  const condition = /like.new/i.test(query) ? "Like new" as const : /\bfair\s+condition\b/i.test(query) ? "Fair" as const : /\bgood\s+condition\b/i.test(query) ? "Good" as const : undefined;
  const useCase = /unity|game development|3d/i.test(query) ? "Unity development" : /gam(?:e|ing)/i.test(query) ? "gaming" : /programm|cod(?:e|ing)|developer/i.test(query) ? "programming" : /student|university|school/i.test(query) ? "student" : undefined;
  const preferences = /lightweight|light weight|portable|travel/i.test(query) ? ["lightweight"] : undefined;
  const parsed = searchIntentSchema.safeParse({ minPrice, maxPrice, minRamGB, minStorageGB: storage ? Number(storage[1]) * (storage[2].toLowerCase() === "tb" ? 1000 : 1) : undefined, maxWeightKg, brand, condition, useCase, preferences });
  if (!parsed.success) 
    throw new Error("Could not interpret the search constraints.");
  return parsed.data;
}
