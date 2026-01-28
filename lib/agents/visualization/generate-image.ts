import "server-only";

/**
 * @deprecated This module uses AI-based image generation via Google Gemini.
 * It is kept for backward compatibility but is being replaced by Recharts-based
 * programmatic chart rendering. Recharts is default; set USE_RECHARTS=false to use AI.
 *
 * New implementation: ./generate-chart-data.ts + client-side Recharts components
 * See: components/charts/ for the new chart components
 */

import { GoogleGenAI } from "@google/genai";
import type { ImageResult } from "./types";
import { logVisualization } from "./logger";
import { describeGeminiError, isRetryableGeminiError } from "@/lib/agents/extraction/gemini-errors";
import { withRetries } from "@/lib/agents/extraction/retry";

type GenerateImageOptions = {
  model?: string;
};

function buildDataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<ImageResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? "gemini-2.5-flash-image";

  let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
  try {
    response = await withRetries(
      () =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseModalities: ["IMAGE"],
          },
        }),
      {
        maxAttempts: 3,
        baseDelayMs: 800,
        maxDelayMs: 5000,
        shouldRetry: (error) => isRetryableGeminiError(error),
        onRetry: ({ attempt, delayMs, error }) => {
          const info = describeGeminiError(error);
          logVisualization("image.retry", {
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
  } catch (error) {
    const info = describeGeminiError(error);
    logVisualization("image.error", {
      error: info.message,
      status: info.status,
      statusText: info.statusText,
      code: info.code,
      cause: info.cause?.message,
      details: info.errorDetails,
    });
    throw error;
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const textParts: string[] = [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || "image/png";
      const base64 = part.inlineData.data;
      return {
        mimeType,
        base64,
        dataUrl: buildDataUrl(mimeType, base64),
      };
    }
    if (part.text) {
      textParts.push(part.text);
    }
  }

  const text = textParts.join("\n").trim();
  throw new Error(
    text
      ? `No image data returned from model. Text response: ${text}`
      : "No image data returned from model."
  );
}
