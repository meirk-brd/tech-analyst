import "server-only";

import { ChatOpenAI } from "@langchain/openai";

/**
 * Single source of truth for the LLM used by every pipeline stage.
 *
 * We route through OpenRouter's OpenAI-compatible API and request
 * `meta-llama/llama-3.3-70b-instruct`. OpenRouter picks the fastest
 * available provider (typically Groq) — based on live throughput stats
 * this is ~6x faster on p95 latency than the previous `gemini-2.5-flash`,
 * which was the dominant wall-time contributor across the pipeline
 * (extraction's parallel fan-out was bottlenecked on Gemini's slow tail).
 *
 * All call sites use ChatOpenAI's `.invoke([{role,content}])` shape, which
 * matches what the previous ChatGoogleGenerativeAI provided — no prompt
 * changes were needed for the swap.
 */
export interface LlmOptions {
  temperature?: number;
}

const MODEL = "meta-llama/llama-3.3-70b-instruct";

export function getLlm(options: LlmOptions = {}): ChatOpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Set it in the Vercel project's environment variables.",
    );
  }
  return new ChatOpenAI({
    model: MODEL,
    temperature: options.temperature ?? 0,
    apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        // OpenRouter uses these headers for analytics + routing — purely
        // informational, no behavior impact.
        "HTTP-Referer": "https://tech-analyst.vercel.app",
        "X-Title": "tech-analyst",
      },
    },
  });
}
