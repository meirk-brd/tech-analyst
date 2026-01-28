import "server-only";

import { MongoClient, ObjectId, type Db } from "mongodb";
import type { ChartDataResult } from "@/lib/agents/visualization/generate-chart-data";

const uri = process.env.MONGODB_URI;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

function requireMongoUri(value: string | undefined): string {
  if (!value) {
    throw new Error(
      "Missing MONGODB_URI. Set it in .env.local or your deployment environment."
    );
  }
  return value;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;

  const connectionString = requireMongoUri(uri);
  const client = new MongoClient(connectionString);
  await client.connect();

  cachedClient = client;
  return client;
}

export async function connectToDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = await getMongoClient();
  cachedDb = client.db("tech-analyst");
  return cachedDb;
}

export type CacheCategory = "pricing" | "docs" | "about" | "enrichment";

export interface CompanyCache {
  _id?: string;
  url: string;
  data: Partial<Record<CacheCategory, string>>;
  scrapedAt: Date;
  expiresAt: Date;
}

export interface AnalysisSession {
  _id?: string;
  marketSector: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    companies?: Array<{ name: string; url: string }>;
    extractedData?: unknown[];
    scores?: unknown[];
    visualizations?: {
      quadrant: string;
      wave: string;
      radar: string;
      chartData?: ChartDataResult;
    };
    csv?: string;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitDoc {
  _id?: string;
  ip: string;
  count: number;
  createdAt: Date;
}

export async function setupIndexes(): Promise<void> {
  const db = await connectToDatabase();

  await db.collection<CompanyCache>("company_cache").createIndex({ url: 1 }, { unique: true });
  await db
    .collection<CompanyCache>("company_cache")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db.collection<AnalysisSession>("analysis_sessions").createIndex({ marketSector: 1 });
  await db.collection<AnalysisSession>("analysis_sessions").createIndex({ createdAt: -1 });
  await db.collection<AnalysisSession>("analysis_sessions").createIndex({ status: 1 });

  // Rate limiting index
  await db.collection<RateLimitDoc>("rate_limits").createIndex(
    { ip: 1 },
    { unique: true }
  );
}

export async function getCachedPage(url: string): Promise<CompanyCache | null> {
  const db = await connectToDatabase();
  return db.collection<CompanyCache>("company_cache").findOne({
    url,
    expiresAt: { $gt: new Date() },
  });
}

export async function cachePage(url: string, data: CompanyCache["data"]): Promise<void> {
  const db = await connectToDatabase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.collection<CompanyCache>("company_cache").updateOne(
    { url },
    {
      $set: {
        url,
        data,
        scrapedAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true }
  );
}

export async function createSession(marketSector: string): Promise<string> {
  const db = await connectToDatabase();
  const result = await db.collection<AnalysisSession>("analysis_sessions").insertOne({
    marketSector,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return result.insertedId.toString();
}

export async function updateSession(
  sessionId: string,
  updates: Partial<AnalysisSession>
): Promise<void> {
  const db = await connectToDatabase();
  await db.collection<AnalysisSession>("analysis_sessions").updateOne(
    { _id: new ObjectId(sessionId) as any },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );
}

export interface SessionListItem {
  id: string;
  marketSector: string;
  createdAt: Date;
  companyCount: number;
}

export async function listSessions(limit = 20): Promise<SessionListItem[]> {
  const db = await connectToDatabase();
  const sessions = await db
    .collection<AnalysisSession>("analysis_sessions")
    .find({ status: "completed" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return sessions.map((session) => ({
    id: session._id!.toString(),
    marketSector: session.marketSector,
    createdAt: session.createdAt,
    companyCount: session.result?.scores?.length ?? 0,
  }));
}

export async function getSession(id: string): Promise<AnalysisSession | null> {
  const db = await connectToDatabase();

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const session = await db
    .collection<AnalysisSession>("analysis_sessions")
    .findOne({ _id: objectId as any });

  return session;
}
