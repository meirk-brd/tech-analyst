import "server-only";

import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";
import type { ScoredCompany } from "./types";
import { logSynthesis } from "./logger";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LlmLike = {
  invoke: (messages: LlmMessage[]) => Promise<unknown>;
};

function responseToText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const content = (response as { content?: unknown }).content;
  if (typeof content === "string") return content.trim();
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
      .join("\n")
      .trim();
  }
  return "";
}

function fallbackNarrative(company: ExtractedCompanyData, score: ScoredCompany): string {
  const model = company.businessModel || "Unknown";
  const topFeature = company.keyFeatures?.[0] || "a focused product set";
  return `${company.company} offers a ${model} platform with ${topFeature}. It scores ${score.vision} on vision and ${score.execution} on execution, placing it among ${score.quadrant}.`;
}

export async function generateNarratives(
  llm: LlmLike,
  data: ExtractedCompanyData[],
  scores: ScoredCompany[]
): Promise<Array<{ company: string; narrative: string }>> {
  const systemPrompt =
    "Write a concise 2-3 sentence analyst narrative about the company's market position. Be factual and avoid hype.";

  const tasks = scores.map(async (score) => {
    const company = data.find((item) => item.company === score.company);
    if (!company) {
      logSynthesis("narrative.missing-company", { company: score.company });
      return { company: score.company, narrative: "" };
    }

    const userPrompt = [
      "Company profile:",
      JSON.stringify({
        company: company.company,
        url: company.url,
        businessModel: company.businessModel,
        keyFeatures: company.keyFeatures,
        technicalCapabilities: company.technicalCapabilities,
        pricingTiers: company.pricingTiers,
        vision: score.vision,
        execution: score.execution,
        quadrant: score.quadrant,
      }),
    ].join("\n");

    try {
      const response = await llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      const text = responseToText(response);
      if (!text) {
        logSynthesis("narrative.fallback.empty", { company: score.company });
      } else {
        logSynthesis("narrative.llm", { company: score.company });
      }
      return {
        company: score.company,
        narrative: text || fallbackNarrative(company, score),
      };
    } catch {
      logSynthesis("narrative.fallback.error", { company: score.company });
      return {
        company: score.company,
        narrative: fallbackNarrative(company, score),
      };
    }
  });

  return Promise.all(tasks);
}
