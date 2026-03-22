import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const lastRun = await prisma.pipelineRun.findFirst({
      orderBy: { startedAt: "desc" },
    });

    const subscriberCount = await prisma.subscriber.count({
      where: { confirmed: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const repoCount = await prisma.dailySnapshot.count({
      where: { snapshotDate: { gte: today } },
    });

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      lastPipeline: lastRun
        ? {
            status: lastRun.status,
            completedAt: lastRun.completedAt,
            reposScored: lastRun.reposScored,
            durationMs: lastRun.durationMs,
          }
        : null,
      todayRepoCount: repoCount,
      subscriberCount,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
}
