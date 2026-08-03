import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, generateObject, streamText } from "ai";
import { z } from "zod";
import { env } from "../../config/env";
import { PREFILL_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT, buildPrefillUserPrompt, buildSummaryUserPrompt } from "./prompts";

const enrichmentSchema = z.object({
  summary: z.string().max(500),
  suggestedTags: z.array(z.string().max(30)).max(10),
  keyPoints: z.array(z.string().max(200)).max(5),
});

const prefillSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(300),
  suggestedTags: z.array(z.string().max(30)).max(10),
});

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;
export type PrefillResult = z.infer<typeof prefillSchema>;


export type SummaryInput = {
  title?: string;
  description?: string;
  url?: string;
};

function isAiAvailable(): boolean {
  return env.AI_ENABLED && env.GOOGLE_GENERATIVE_AI_API_KEY.length > 0;
}

function getGoogle() {
  return createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
}

function getChatModel() {
  return getGoogle()(env.AI_MODEL);
}

function getEmbeddingModel() {
  return getGoogle().embeddingModel(env.AI_EMBEDDING_MODEL);
}

export async function generateSummary(
  input: SummaryInput
): Promise<EnrichmentResult | null> {
  if (!isAiAvailable()) return null;

  const { object } = await generateObject({
    model: getChatModel(),
    schema: enrichmentSchema,
    system: SUMMARY_SYSTEM_PROMPT,
    prompt: buildSummaryUserPrompt({
      title: input.title ?? "",
      description: input.description ?? "",
      url: input.url ?? "",
    }),
  });

  return object;
}

export async function generatePrefill(url: string): Promise<PrefillResult | null> {
  if (!isAiAvailable()) return null;
  const { object } = await generateObject({
    model: getChatModel(),
    schema: prefillSchema,
    system: PREFILL_SYSTEM_PROMPT,
    prompt: buildPrefillUserPrompt(url),
  });
  return {
    title: object.title.trim(),
    description: object.description.trim(),
    suggestedTags: object.suggestedTags.map((t) => t.trim().toLowerCase()).filter(Boolean),
  };
}


export async function generateEmbedding(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[] | null> {
  if (!isAiAvailable() || !text.trim()) return null;

  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: 768,
        taskType,
      },
    },
  });

  return embedding;
}

export function getLanguageModel() {
  return getChatModel();
}
