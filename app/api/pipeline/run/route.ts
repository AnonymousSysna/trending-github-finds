import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Spawn pipeline worker as a background process
  const workerPath = path.join(process.cwd(), "workers", "pipeline.ts");
  const child = spawn("npx", ["tsx", workerPath], {
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();

  return NextResponse.json({
    message: "Pipeline started",
    pid: child.pid,
    timestamp: new Date().toISOString(),
  });
}
