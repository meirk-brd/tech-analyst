import { NextResponse } from "next/server";

import { getSession } from "@/lib/db/mongodb";
import type { ProgressSnapshot } from "@/lib/db/mongodb";

const INITIALIZING: ProgressSnapshot = {
  status: "processing",
  stage: "discovery",
  message: "Initializing…",
  updatedAt: new Date(0),
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  try {
    const session = await getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // If processing has started but no substage emit has landed yet, hand
    // back a synthetic Initializing snapshot. Keeps the polling client's
    // state machine simple — it only ever sees real ProgressSnapshot shapes.
    const progress = session.progress ?? {
      ...INITIALIZING,
      // Reflect terminal session states even when no progress was written
      // (e.g. a pre-existing session created before this feature shipped).
      status:
        session.status === "completed"
          ? "completed"
          : session.status === "failed"
            ? "failed"
            : "processing",
    };

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Failed to read progress:", error);
    return NextResponse.json(
      { error: "Failed to read progress" },
      { status: 500 },
    );
  }
}
