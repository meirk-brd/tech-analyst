import { NextResponse } from "next/server";

import { getExtractionApp } from "@/lib/agents/extraction/extraction-graph";
import { parseCompanies } from "@/lib/agents/extraction/parse-companies";
import { logExtraction } from "@/lib/agents/extraction/logger";
import { getExtractionMaxConcurrency } from "@/lib/agents/extraction/concurrency";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const companies = parseCompanies(body);

  if (!companies) {
    return NextResponse.json(
      { error: "companies is required (array of { name, url })." },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GOOGLE_AI_API_KEY." },
      { status: 500 }
    );
  }

  logExtraction("request.start", { totalCompanies: companies.length });

  const app = getExtractionApp();
  const result = await app.invoke(
    {
      companies,
      status: "pending",
    },
    {
      configurable: {
        thread_id: crypto.randomUUID(),
        max_concurrency: getExtractionMaxConcurrency(),
      },
    }
  );

  return NextResponse.json({
    companies: companies.length,
    extracted: result.extractedData?.length ?? 0,
    data: result.extractedData ?? [],
  });
}
