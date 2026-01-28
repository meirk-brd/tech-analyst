import "server-only";

import type { LightweightReflectionInput, LightweightReflectionOutput } from "./types";
import { logEnrichment } from "./logger";
import { describeGeminiError, isRetryableGeminiError } from "../extraction/gemini-errors";
import { withRetries } from "../extraction/retry";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LlmLike = {
  invoke: (messages: LlmMessage[]) => Promise<unknown>;
};

const MAX_CONTENT_CHARS = 5000;

function responseToText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const content = (response as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object") {
          const maybeText = (block as { text?: unknown }).text;
          if (typeof maybeText === "string") return maybeText;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_CHARS) return content;
  return content.slice(0, MAX_CONTENT_CHARS) + "\n\n[TRUNCATED]";
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function fallbackResult(): LightweightReflectionOutput {
  return {
    isCompanyPage: false,
    extractedCompanies: [],
  };
}

const systemPrompt = `You analyze web pages to identify companies in a specific market sector.

Your task:
1. Determine if this page is a company's official website (not a news article, blog post, or listicle)
2. Extract any companies mentioned or listed on this page that are relevant to the market sector

Return JSON only:
{
  "isCompanyPage": boolean,
  "companyName": "string or null - the company name if isCompanyPage is true",
  "extractedCompanies": [
    { "name": "Company Name", "url": "https://company.com" }
  ]
}

Rules:
- For listicles/aggregator pages (e.g., "Top 10 AI Labs"): extract all company names and URLs mentioned, set isCompanyPage=false
- For company websites: set isCompanyPage=true, companyName to the company name, extractedCompanies can be empty
- For news articles/blogs about companies: extract companies mentioned, isCompanyPage=false
- Only include companies relevant to the specified market sector
- If a company URL is not available, include name only with url as null
- Return empty extractedCompanies array if no relevant companies found
- Do not hallucinate companies - only extract what's explicitly mentioned`;

export async function reflectForCompanies(
  input: LightweightReflectionInput,
  llm: LlmLike
): Promise<LightweightReflectionOutput> {
  const truncatedContent = truncateContent(input.content);

  const userPrompt = `Market sector: ${input.marketSector}
URL: ${input.url}

Page content:
${truncatedContent}`;

  try {
    const response = await withRetries(
      () =>
        llm.invoke([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]),
      {
        maxAttempts: 3,
        baseDelayMs: 500,
        maxDelayMs: 3000,
        shouldRetry: (error) => isRetryableGeminiError(error),
        onRetry: ({ attempt, delayMs, error }) => {
          const info = describeGeminiError(error);
          logEnrichment("reflect.retry", {
            url: input.url,
            attempt,
            delayMs,
            error: info.message,
          });
        },
      }
    );

    const text = responseToText(response);
    const jsonBlock = extractJsonObject(text);

    if (!jsonBlock) {
      logEnrichment("reflect.parse.miss", { url: input.url });
      return fallbackResult();
    }

    const parsed = JSON.parse(jsonBlock) as LightweightReflectionOutput;

    const result: LightweightReflectionOutput = {
      isCompanyPage: Boolean(parsed.isCompanyPage),
      companyName: parsed.companyName || undefined,
      extractedCompanies: Array.isArray(parsed.extractedCompanies)
        ? parsed.extractedCompanies.filter((c) => c && typeof c.name === "string")
        : [],
    };

    logEnrichment("reflect.done", {
      url: input.url,
      isCompanyPage: result.isCompanyPage,
      companyName: result.companyName,
      extractedCount: result.extractedCompanies.length,
    });

    return result;
  } catch (error) {
    const info = describeGeminiError(error);
    logEnrichment("reflect.error", {
      url: input.url,
      error: info.message,
    });
    return fallbackResult();
  }
}
