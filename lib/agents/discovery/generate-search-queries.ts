import "server-only";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LlmLike = {
  invoke: (messages: LlmMessage[]) => Promise<unknown>;
};

const MAX_QUERIES = 12;
const MIN_QUERIES = 10;

function normalizeQuery(query: string): string {
  return query
    .trim()
    .replace(/^[-*\d.\s]+/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");
}

function extractJsonArray(text: string): string[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
    }
    return null;
  } catch {
    return null;
  }
}

function dedupeAndClamp(queries: string[]): string[] {
  const seen = new Set<string>();
  const cleaned = [];
  for (const raw of queries) {
    const query = normalizeQuery(raw);
    if (!query) continue;
    const key = query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(query);
  }
  return cleaned.slice(0, MAX_QUERIES);
}

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

export async function generateSearchQueries(
  llm: LlmLike,
  marketSector: string
): Promise<string[]> {
  const sector = marketSector.trim();
  if (!sector) {
    throw new Error("marketSector is required to generate search queries.");
  }

  const systemPrompt = [
    "You generate Google search queries to discover top companies in a market sector.",
    "Follow Google search best practices:",
    "- Use concise keyword phrases (not full sentences).",
    "- Include exact-match quotes for the sector where helpful.",
    "- Use OR for synonyms (e.g., vendors OR providers).",
    "- Mix intent types: lists, comparisons, enterprise, open-source, startups, pricing.",
    "- Prefer queries that surface company names and vendor lists.",
    "- Avoid punctuation-heavy or overly long queries.",
    `Return ${MIN_QUERIES}-${MAX_QUERIES} unique queries as a JSON array of strings.`,
  ].join("\n");

  const userPrompt = [
    `Market sector: ${sector}`,
    "Goal: find ~30 relevant companies/vendors/platforms.",
    "Write the queries now.",
  ].join("\n");

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const content = responseToText(response);
  const fromJson = extractJsonArray(content);
  const base = fromJson ?? content.split("\n");
  const deduped = dedupeAndClamp(base);

  if (deduped.length >= MIN_QUERIES) {
    return deduped;
  }

  const fallback = [
    `"${sector}" vendors`,
    `"${sector}" companies`,
    `"${sector}" platforms`,
    `"${sector}" software`,
    `"${sector}" providers`,
    `best ${sector} tools`,
    `top ${sector} vendors`,
    `${sector} market leaders`,
    `${sector} startups`,
    `${sector} open source`,
    `${sector} enterprise`,
    `${sector} pricing`,
  ];

  return dedupeAndClamp([...deduped, ...fallback]).slice(0, MIN_QUERIES);
}
