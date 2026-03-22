import { NextRequest, NextResponse } from "next/server";
import { getTodayTopRepos } from "@/lib/repos";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("lang") ?? undefined;
  const topic = searchParams.get("topic") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  try {
    const repos = await getTodayTopRepos({ language, topic, limit });
    return NextResponse.json({ repos, count: repos.length });
  } catch (err) {
    console.error("Repos API error:", err);
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}
