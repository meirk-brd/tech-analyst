import "server-only";

import { ChatOpenAI } from "@langchain/openai";

/**
 * Single source of truth for the LLM used by every pipeline stage.
 *
 * We route through OpenRouter's OpenAI-compatible API and request
 * `google/gemini-2.5-flash-lite`. OpenRouter live stats put this model at
 * p95 first-token latency ~1.67s and throughput ~111 tok/s — fastest on
 * long-output prompts in our workload (Llama 3.3 70B was slower on the
 * 12-query generation despite better p95 tail, because our prompts ask
 * for long JSON outputs and the per-token throughput dominates).
 *
 * All call sites use ChatOpenAI's `.invoke([{role,content}])` shape, which
 * matches what the original ChatGoogleGenerativeAI provided — no prompt
 * changes are needed for this swap.
 */
export interface LlmOptions {
  temperature?: number;
}

const MODEL = "google/gemini-2.5-flash-lite";

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
