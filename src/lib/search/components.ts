export type ComponentKind = "cpu" | "gpu";

function canonicalTokens(value: string, kind: ComponentKind): Set<string> {
  const tokens = new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  // These words identify which field to search but are not part names.
  for (const context of ["cpu", "gpu", "processor", "processors", "laptop", "laptops"]) tokens.delete(context);

  if (kind === "gpu") {
    if (tokens.has("geforce") || tokens.has("rtx") || tokens.has("gtx")) tokens.add("nvidia");
    if (tokens.has("radeon") || tokens.has("rx")) tokens.add("amd");
    if (tokens.has("rx")) tokens.add("radeon");
  } else {
    if (tokens.has("ryzen")) tokens.add("amd");
  }
  return tokens;
}

// Queries can be a vendor, family, tier, or exact model. Requiring every
// canonical query token makes broad queries intentionally broad while keeping
// specific model numbers restrictive.
export function matchesComponentQuery(actual: string, query: string | undefined, kind: ComponentKind): boolean {
  if (!query) return true;
  const actualTokens = canonicalTokens(actual, kind);
  const queryTokens = canonicalTokens(query, kind);
  return queryTokens.size > 0 && [...queryTokens].every((token) => actualTokens.has(token));
}
