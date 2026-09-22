import "server-only";
import { InvalidEmbeddingError, MissingEmbeddingKeyError } from "./errors";
import { createSemanticRetriever } from "./semantic";
import { getGatewayClient } from "./gateway-client";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

async function embedTexts(texts: string[]): Promise<number[][]> 
{
  if (!texts.length) 
    return [];
  
  if (!process.env.CLASSGW_KEY) throw new MissingEmbeddingKeyError("Embedding gateway is not configured");
  const response = await getGatewayClient().embeddings.create({ model: EMBEDDING_MODEL, input: texts, encoding_format: "float" });
  const ordered = response.data.slice().sort((a, b) => a.index - b.index);
  
  if (ordered.length !== texts.length || ordered.some((item, index) => item.index !== index)) 
    throw new InvalidEmbeddingError("Incomplete embedding response");
  
  return ordered.map((item) => item.embedding);
}

export const retrieveListings = createSemanticRetriever(embedTexts);
