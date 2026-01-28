import { NextResponse } from "next/server";

import { listSessions } from "@/lib/db/mongodb";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

  try {
    const sessions = await listSessions(limit);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
