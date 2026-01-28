import "server-only";

import { headers } from "next/headers";
import { connectToDatabase } from "./db/mongodb";

const RATE_LIMIT = 5;

export interface RateLimitInfo {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}

export interface RateLimitDoc {
  _id?: string;
  ip: string;
  count: number;
  createdAt: Date;
}

export async function getRateLimitInfo(ip: string): Promise<RateLimitInfo> {
  const db = await connectToDatabase();
  const collection = db.collection<RateLimitDoc>("rate_limits");

  // Atomic increment - upsert if not exists
  const result = await collection.findOneAndUpdate(
    { ip },
    {
      $inc: { count: 1 },
      $setOnInsert: { createdAt: new Date() },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  const current = result?.count ?? 1;

  return {
    allowed: current <= RATE_LIMIT,
    current,
    limit: RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - current),
  };
}

export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Vercel provides the real IP in x-forwarded-for
  // First IP in the list is the client's real IP
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Fallback headers (Vercel also sets x-real-ip)
  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Last resort fallback
  return "127.0.0.1";
}

export async function setupRateLimitIndex(): Promise<void> {
  const db = await connectToDatabase();

  // Create index on IP for fast lookups
  await db.collection<RateLimitDoc>("rate_limits").createIndex(
    { ip: 1 },
    { unique: true }
  );
}
