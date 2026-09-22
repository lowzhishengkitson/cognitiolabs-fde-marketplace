export class MissingEmbeddingKeyError extends Error {}
export class InvalidEmbeddingError extends Error {}

export type FallbackReason =
  | "missing-key"
  | "gateway-auth"
  | "gateway-rate-limit"
  | "gateway-unavailable"
  | "gateway-network"
  | "invalid-embedding"
  | "gateway-error";

// A deliberately coarse code: never return the provider message or response.
export function classifyEmbeddingFailure(error: unknown): FallbackReason 
{
  if (error instanceof MissingEmbeddingKeyError) 
    return "missing-key";
  if (error instanceof InvalidEmbeddingError) 
    return "invalid-embedding";
  if (typeof error === "object" && error !== null) 
  {
    const status = "status" in error ? error.status : undefined;
    if (status === 401 || status === 403) 
      return "gateway-auth";

    if (status === 429) 
      return "gateway-rate-limit";
    
    if (typeof status === "number" && status >= 500) 
      return "gateway-unavailable";
    
    const name = "name" in error ? error.name : undefined;
    if (name === "APIConnectionError" || name === "APIConnectionTimeoutError") 
      return "gateway-network";
  }
  return "gateway-error";
}
