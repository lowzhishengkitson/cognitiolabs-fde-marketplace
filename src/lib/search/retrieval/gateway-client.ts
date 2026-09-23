import "server-only";
import OpenAI from "openai";
import { gatewayConfig } from "@/lib/ai/config";

let client: OpenAI | undefined;

export function getGatewayClient(): OpenAI {
  const apiKey = process.env.CLASSGW_KEY;
  if (!apiKey) throw new Error("Catalogue gateway is not configured");
  return client ??= new OpenAI({ baseURL: gatewayConfig.baseURL, apiKey, timeout: 10_000, maxRetries: 0 });
}
