export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";

export default async function AdminPage() {
  // Simple auth check — in production, add middleware
  const lastRun = await prisma.pipelineRun.findFirst({
    orderBy: { startedAt: "desc" },
  });

  const [totalSubs, confirmedSubs, todayRepoCount, recentRuns] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { confirmed: true } }),
    prisma.dailySnapshot.count({
      where: {
        snapshotDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.pipelineRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total subscribers", value: totalSubs },
          { label: "Confirmed", value: confirmedSubs },
          { label: "Repos today", value: todayRepoCount },
          {
            label: "Last pipeline",
            value: lastRun?.status ?? "—",
            colored: lastRun?.status === "success" ? "text-green-400" : lastRun?.status === "failed" ? "text-red-400" : "",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className={`text-2xl font-bold ${s.colored ?? "text-white"}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent pipeline runs */}
      <h2 className="text-lg font-semibold text-white mb-3">Recent pipeline runs</h2>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Repos</th>
              <th className="text-right px-4 py-3">Emails</th>
              <th className="text-right px-4 py-3">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {recentRuns.map((run) => (
              <tr key={run.id} className="text-gray-300">
                <td className="px-4 py-3">
                  {run.startedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      run.status === "success"
                        ? "text-green-400"
                        : run.status === "failed"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{run.reposScored ?? "—"}</td>
                <td className="px-4 py-3 text-right">{run.emailsSent ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trigger pipeline */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">Trigger pipeline</h2>
        <p className="text-gray-400 text-sm mb-3">
          Run via cron or manually:
        </p>
        <code className="block bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-green-300 font-mono">
          curl -X POST /api/pipeline/run -H &quot;x-cron-secret: $CRON_SECRET&quot;
        </code>
      </div>
    </div>
  );
}
