import "server-only";
import OpenAI from "openai";
import { InvalidEmbeddingError, MissingEmbeddingKeyError } from "./embedding-errors";
import { createSemanticRetriever } from "./semantic-retrieval";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const GATEWAY_BASE_URL = "https://174.138.16.223/openrouter/v1";

let client: OpenAI | undefined;
function getClient(): OpenAI 
{
  const apiKey = process.env.CLASSGW_KEY;
  if (!apiKey) 
    throw new MissingEmbeddingKeyError("Embedding gateway is not configured");

  return client ??= new OpenAI({ baseURL: GATEWAY_BASE_URL, apiKey, timeout: 10_000, maxRetries: 0 });
}

async function embedTexts(texts: string[]): Promise<number[][]> 
{
  if (!texts.length) 
    return [];
  
  const response = await getClient().embeddings.create({ model: EMBEDDING_MODEL, input: texts, encoding_format: "float" });
  const ordered = response.data.slice().sort((a, b) => a.index - b.index);
  
  if (ordered.length !== texts.length || ordered.some((item, index) => item.index !== index)) 
    throw new InvalidEmbeddingError("Incomplete embedding response");
  
  return ordered.map((item) => item.embedding);
}

export const retrieveListings = createSemanticRetriever(embedTexts);
