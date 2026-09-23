import "server-only";

export const gatewayConfig = {
  baseURL: process.env.CLASSGW_BASE_URL,
  embeddingModel: "openai/text-embedding-3-small",
  chatModel: "openai/gpt-4o-mini",
} as const;
