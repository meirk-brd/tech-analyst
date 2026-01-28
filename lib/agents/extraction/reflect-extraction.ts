import "server-only";

import type { ExtractedCompanyData, ScrapeResult } from "./types";
import { logExtraction } from "./logger";
import { describeGeminiError, isRetryableGeminiError } from "./gemini-errors";
import { withRetries } from "./retry";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LlmLike = {
  invoke: (messages: LlmMessage[]) => Promise<unknown>;
};

type ReflectionInput = {
  company: string;
  url: string;
  pricing?: ScrapeResult | null;
  docs?: ScrapeResult | null;
  about?: ScrapeResult | null;
};

const MAX_SECTION_CHARS = 7000;

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

function truncateContent(content: string | undefined): string {
  if (!content) return "";
  if (content.length <= MAX_SECTION_CHARS) return content;
  return content.slice(0, MAX_SECTION_CHARS) + "\n\n[TRUNCATED]";
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function fallbackResult(input: ReflectionInput): ExtractedCompanyData {
  return {
    company: input.company,
    url: input.url,
    businessModel: "Unknown",
    pricingTiers: [],
    keyFeatures: [],
    technicalCapabilities: {
      integrations: [],
    },
    enterpriseCustomers: [],
    sources: {
      pricing: input.pricing?.url,
      docs: input.docs?.url,
      about: input.about?.url,
    },
    notes: "LLM extraction failed or insufficient content.",
  };
}

export async function reflectOnScrapedPages(
  input: ReflectionInput,
  llm: LlmLike
): Promise<ExtractedCompanyData> {
  const payload = {
    company: input.company,
    url: input.url,
    pricing: truncateContent(input.pricing?.content),
    docs: truncateContent(input.docs?.content),
    about: truncateContent(input.about?.content),
  };

  const systemPrompt = [
    "You extract structured company data from scraped website content.",
    "Return ONLY valid JSON. No markdown. No commentary.",
    "If a field is missing, use null, empty array, or 'Unknown'.",
    "Be concise and factual. Do not hallucinate.",
    "Schema:",
    "{",
    '  "company": string,',
    '  "url": string,',
    '  "businessModel": "SaaS" | "Open Source" | "License" | "Freemium" | "Managed Service" | "Unknown",',
    '  "pricingTiers": string[],',
    '  "keyFeatures": string[],',
    '  "technicalCapabilities": {',
    '    "scalability": string | null,',
    '    "security": string | null,',
    '    "integrations": string[]',
    "  },",
    '  "headquarters": string | null,',
    '  "foundingYear": number | null,',
    '  "enterpriseCustomers": string[],',
    '  "sources": { "pricing": string | null, "docs": string | null, "about": string | null }',
    "}",
  ].join("\n");

  const userPrompt = [
    `Company: ${input.company}`,
    `Website: ${input.url}`,
    "",
    "Pricing page content:",
    payload.pricing || "[missing]",
    "",
    "Docs/features page content:",
    payload.docs || "[missing]",
    "",
    "About/company page content:",
    payload.about || "[missing]",
  ].join("\n");

  try {
    const response = await withRetries(
      () =>
        llm.invoke([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]),
      {
        maxAttempts: 3,
        baseDelayMs: 800,
        maxDelayMs: 5000,
        shouldRetry: (error) => isRetryableGeminiError(error),
        onRetry: ({ attempt, delayMs, error }) => {
          const info = describeGeminiError(error);
          logExtraction("reflect.retry", {
            company: input.company,
            attempt,
            delayMs,
            error: info.message,
            status: info.status,
            statusText: info.statusText,
            code: info.code,
            cause: info.cause?.message,
          });
        },
      }
    );
    const text = responseToText(response);
    const jsonBlock = extractJsonObject(text);
    if (!jsonBlock) {
      logExtraction("reflect.parse.miss", { company: input.company });
      return fallbackResult(input);
    }
    const parsed = JSON.parse(jsonBlock) as ExtractedCompanyData;
    return {
      company: parsed.company || input.company,
      url: parsed.url || input.url,
      businessModel: parsed.businessModel || "Unknown",
      pricingTiers: parsed.pricingTiers || [],
      keyFeatures: parsed.keyFeatures || [],
      technicalCapabilities: parsed.technicalCapabilities || { integrations: [] },
      headquarters: parsed.headquarters ?? undefined,
      foundingYear: parsed.foundingYear ?? null,
      enterpriseCustomers: parsed.enterpriseCustomers || [],
      sources: parsed.sources || {
        pricing: input.pricing?.url,
        docs: input.docs?.url,
        about: input.about?.url,
      },
      notes: parsed.notes,
    };
  } catch (error) {
    const info = describeGeminiError(error);
    logExtraction("reflect.error", {
      company: input.company,
      error: info.message,
      status: info.status,
      statusText: info.statusText,
      code: info.code,
      cause: info.cause?.message,
      details: info.errorDetails,
    });
    return fallbackResult(input);
  }
}
