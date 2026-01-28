import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { parseSynthesisInput } from "@/lib/agents/synthesis/parse-input";
import { calculateScores } from "@/lib/agents/synthesis/scoring";
import { generateCsv } from "@/lib/agents/synthesis/csv";
import { generateNarratives } from "@/lib/agents/synthesis/generate-narratives";
import { logSynthesis } from "@/lib/agents/synthesis/logger";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { extractedData, includeNarratives, normalizeScores } =
    parseSynthesisInput(body);

  if (!extractedData) {
    return NextResponse.json(
      { error: "extractedData is required (array of extracted company data)." },
      { status: 400 }
    );
  }

  logSynthesis("request.start", {
    count: extractedData.length,
    includeNarratives,
    normalizeScores,
  });

  const scores = calculateScores(extractedData, { normalize: normalizeScores });
  logSynthesis("scores.ready", { total: scores.length });

  const csv = generateCsv(scores);

  let narratives: Array<{ company: string; narrative: string }> | undefined;
  if (includeNarratives) {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GOOGLE_AI_API_KEY for narrative generation." },
        { status: 500 }
      );
    }
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.4,
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
    narratives = await generateNarratives(llm, extractedData, scores);
  }

  return NextResponse.json({
    scores,
    narratives,
    csv,
  });
}
