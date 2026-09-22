import "server-only";
import OpenAI from "openai";

let client: OpenAI | undefined;

export function getGatewayClient(): OpenAI {
  const apiKey = process.env.CLASSGW_KEY;
  if (!apiKey) throw new Error("Catalogue gateway is not configured");
  return client ??= new OpenAI({ baseURL: "https://174.138.16.223/openrouter/v1", apiKey, timeout: 10_000, maxRetries: 0 });
}
