/**
 * Daily ingestion pipeline
 *
 * Steps:
 *   1. Fetch trending candidates from GitHub API
 *   2. Score & rank repos
 *   3. AI summarize (Claude haiku)
 *   4. Persist to DB
 *   5. Send digest emails
 *   6. Alert on failure
 *
 * Run: tsx workers/pipeline.ts
 * Dry run: DRY_RUN=true tsx workers/pipeline.ts
 */

import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

// Load .env.production if it exists, otherwise fall back to .env
const envFile = existsSync(resolve(process.cwd(), ".env.production"))
  ? ".env.production"
  : ".env";
config({ path: resolve(process.cwd(), envFile) });
import { prisma } from "../lib/db";
import { searchTrendingRepos, getRepoReadme, computeTrendScore } from "../lib/github";
import { summarizeBatch } from "../lib/ai";
import { sendDigestBatch } from "../lib/email";
import { cacheInvalidate } from "../lib/redis";

const DRY_RUN = process.env.DRY_RUN === "true";

const LANGUAGES_TO_FETCH = [
  "python", "typescript", "javascript", "rust", "go",
  "java", "cpp", "c", "ruby", "swift",
];
const MIN_STARS = 50;
const MAX_REPOS_PER_PIPELINE = 100;

async function runPipeline() {
  const startedAt = new Date();
  const runDate = new Date();
  runDate.setHours(0, 0, 0, 0);

  console.log(`[Pipeline] Starting${DRY_RUN ? " (DRY RUN)" : ""} at ${startedAt.toISOString()}`);

  let pipelineRun = await prisma.pipelineRun.create({
    data: {
      runDate,
      startedAt,
      status: "running",
    },
  });

  try {
    // ─── Step 1: Fetch candidates ───────────────────────────────────────────
    console.log("[Pipeline] Step 1: Fetching GitHub repos...");
    const seen = new Set<number>();
    const allRepos: Awaited<ReturnType<typeof searchTrendingRepos>> = [];

    // Fetch general trending
    const generalRepos = await searchTrendingRepos({ minStars: MIN_STARS, perPage: 50 });
    for (const r of generalRepos) {
      if (!seen.has(r.id)) { seen.add(r.id); allRepos.push(r); }
    }

    // Fetch per-language
    for (const lang of LANGUAGES_TO_FETCH.slice(0, 5)) {
      if (allRepos.length >= MAX_REPOS_PER_PIPELINE) break;
      try {
        const langRepos = await searchTrendingRepos({ language: lang, minStars: MIN_STARS, perPage: 20 });
        for (const r of langRepos) {
          if (!seen.has(r.id)) { seen.add(r.id); allRepos.push(r); }
        }
        await new Promise((r) => setTimeout(r, 1000)); // rate limit respect
      } catch (err) {
        console.warn(`[Pipeline] Language fetch failed for ${lang}:`, err);
      }
    }

    const candidates = allRepos
      .filter((r) => !r.archived && r.stargazers_count >= MIN_STARS)
      .slice(0, MAX_REPOS_PER_PIPELINE);

    console.log(`[Pipeline] Fetched ${candidates.length} candidates`);

    // ─── Step 2: Upsert repos + get star deltas ──────────────────────────────
    console.log("[Pipeline] Step 2: Upserting repos...");
    const repoRecords: Array<{ id: number; owner: string; name: string; starsTotal: number; starsGained24h: number }> = [];

    for (const gh of candidates) {
      // Get yesterday's star count for delta
      const yesterday = new Date(runDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const existing = await prisma.repo.findUnique({
        where: { githubId: BigInt(gh.id) },
        include: {
          dailySnapshots: {
            where: { snapshotDate: { gte: yesterday } },
            orderBy: { snapshotDate: "desc" },
            take: 1,
          },
        },
      });

      const starsGained24h = existing?.dailySnapshots[0]
        ? gh.stargazers_count - existing.dailySnapshots[0].starsTotal
        : 0;

      const repo = await prisma.repo.upsert({
        where: { githubId: BigInt(gh.id) },
        create: {
          githubId: BigInt(gh.id),
          owner: gh.owner.login,
          name: gh.name,
          description: gh.description,
          language: gh.language,
          topics: gh.topics ?? [],
          starsTotal: gh.stargazers_count,
          forksTotal: gh.forks_count,
          openIssues: gh.open_issues_count,
          license: gh.license?.spdx_id ?? null,
          homepageUrl: gh.homepage,
          htmlUrl: gh.html_url,
          createdAtGh: new Date(gh.created_at),
          pushedAt: new Date(gh.pushed_at),
          archived: gh.archived,
        },
        update: {
          description: gh.description,
          language: gh.language,
          topics: gh.topics ?? [],
          starsTotal: gh.stargazers_count,
          forksTotal: gh.forks_count,
          openIssues: gh.open_issues_count,
          license: gh.license?.spdx_id ?? null,
          homepageUrl: gh.homepage,
          pushedAt: new Date(gh.pushed_at),
          archived: gh.archived,
        },
      });

      repoRecords.push({
        id: repo.id,
        owner: repo.owner,
        name: repo.name,
        starsTotal: repo.starsTotal,
        starsGained24h: Math.max(0, starsGained24h),
      });
    }

    pipelineRun = await prisma.pipelineRun.update({
      where: { id: pipelineRun.id },
      data: { reposFetched: candidates.length },
    });

    // ─── Step 3: Score & rank ────────────────────────────────────────────────
    console.log("[Pipeline] Step 3: Scoring repos...");
    const scored = repoRecords
      .map((r) => {
        const ghRepo = candidates.find((c) => c.owner.login === r.owner && c.name === r.name);
        const trendScore = computeTrendScore({
          starsGained24h: r.starsGained24h,
          starsGained7d: r.starsGained24h * 3, // approximation if no 7d data
          forksGained7d: 0,
          createdAtGh: ghRepo?.created_at ? new Date(ghRepo.created_at) : null,
          starsTotal: r.starsTotal,
        });
        return { ...r, trendScore };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    console.log(`[Pipeline] Scored ${scored.length} repos`);

    // ─── Step 4: AI summarization ────────────────────────────────────────────
    console.log("[Pipeline] Step 4: AI summarizing...");
    const toSummarize = scored.slice(0, 30); // only top 30 to save API cost

    // Fetch READMEs for top repos
    const withReadme = await Promise.all(
      toSummarize.map(async (r) => {
        const readme = await getRepoReadme(r.owner, r.name);
        const ghRepo = candidates.find((c) => c.owner.login === r.owner && c.name === r.name);
        return {
          owner: r.owner,
          name: r.name,
          description: ghRepo?.description ?? null,
          language: ghRepo?.language ?? null,
          topics: ghRepo?.topics ?? [],
          stars: r.starsTotal,
          starsGained24h: r.starsGained24h,
          readme,
        };
      })
    );

    const summaries = DRY_RUN
      ? new Map<string, { what_it_does: string; why_trending: string; who_should_care: string; tags: string[]; hook: string }>()
      : await summarizeBatch(withReadme);

    let summarizedCount = 0;
    for (const [key, summary] of summaries) {
      const [owner, name] = key.split("/");
      await prisma.repo.updateMany({
        where: { owner, name },
        data: {
          aiSummary: summary,
          aiGeneratedAt: new Date(),
        },
      });
      summarizedCount++;
    }

    // ─── Step 5: Persist daily snapshots ────────────────────────────────────
    console.log("[Pipeline] Step 5: Persisting snapshots...");
    for (const r of scored) {
      await prisma.dailySnapshot.upsert({
        where: {
          repoId_snapshotDate: {
            repoId: r.id,
            snapshotDate: runDate,
          },
        },
        create: {
          repoId: r.id,
          snapshotDate: runDate,
          starsTotal: r.starsTotal,
          forksTotal: candidates.find((c) => c.owner.login === r.owner && c.name === r.name)?.forks_count ?? 0,
          starsGained24h: r.starsGained24h,
          trendScore: r.trendScore,
          rank: r.rank,
        },
        update: {
          starsTotal: r.starsTotal,
          starsGained24h: r.starsGained24h,
          trendScore: r.trendScore,
          rank: r.rank,
        },
      });
    }

    // Invalidate caches
    await cacheInvalidate("repos:*");

    // ─── Step 6: Send digest emails ──────────────────────────────────────────
    console.log("[Pipeline] Step 6: Sending digest emails...");
    let emailsSent = 0;

    if (!DRY_RUN) {
      const top10Repos = scored.slice(0, 10);
      const weekday = new Date().getDay();
      const includeWeekly = weekday === 1;

      const [confirmedCount, dailyCount, weeklyCount] = await Promise.all([
        prisma.subscriber.count({ where: { confirmed: true } }),
        prisma.subscriber.count({ where: { confirmed: true, frequency: "daily" } }),
        prisma.subscriber.count({ where: { confirmed: true, frequency: "weekly" } }),
      ]);

      console.log(
        `[Pipeline] Subscribers confirmed=${confirmedCount}, daily=${dailyCount}, weekly=${weeklyCount}, weeklyIncluded=${includeWeekly}`
      );

      const subscribers = await prisma.subscriber.findMany({
        where: {
          confirmed: true,
          OR: [
            { frequency: "daily" },
            // Weekly: only send on Mondays
            ...(includeWeekly ? [{ frequency: "weekly" as const }] : []),
          ],
        },
      });

      console.log(
        `[Pipeline] Eligible subscribers for this run: ${subscribers.length}`
      );

      if (subscribers.length > 0 && top10Repos.length > 0) {
        // Fetch full repo data for email
        const repoData = await prisma.repo.findMany({
          where: { id: { in: top10Repos.map((r) => r.id) } },
          include: {
            dailySnapshots: {
              where: { snapshotDate: { gte: runDate } },
              orderBy: { snapshotDate: "desc" },
              take: 1,
            },
          },
        });

        const emailRepos = top10Repos.map((scored) => {
          const repo = repoData.find((r) => r.id === scored.id)!;
          const snapshot = repo.dailySnapshots[0];
          return {
            id: repo.id,
            owner: repo.owner,
            name: repo.name,
            description: repo.description,
            language: repo.language,
            topics: repo.topics,
            starsTotal: repo.starsTotal,
            forksTotal: repo.forksTotal,
            openIssues: repo.openIssues,
            license: repo.license,
            htmlUrl: repo.htmlUrl,
            homepageUrl: repo.homepageUrl,
            pushedAt: repo.pushedAt,
            aiSummary: repo.aiSummary as Parameters<typeof sendDigestBatch>[0][0] extends infer T ? T extends { email: string } ? never : unknown : never,
            snapshot: snapshot
              ? {
                  starsGained24h: snapshot.starsGained24h,
                  starsGained7d: snapshot.starsGained7d,
                  trendScore: snapshot.trendScore,
                  rank: snapshot.rank,
                }
              : null,
          };
        });

        const date = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const { sent } = await sendDigestBatch(
          subscribers.map((s) => ({
            email: s.email,
            unsubscribeToken: s.unsubscribeToken,
          })),
          emailRepos as Parameters<typeof sendDigestBatch>[1],
          date
        );

        emailsSent = sent;

        // Update last_email_sent
        await prisma.subscriber.updateMany({
          where: { id: { in: subscribers.map((s) => s.id) } },
          data: { lastEmailSent: new Date() },
        });
      } else {
        console.log(
          `[Pipeline] Skipping email send (subscribers=${subscribers.length}, repos=${top10Repos.length})`
        );
      }
    }

    // ─── Step 7: Complete ────────────────────────────────────────────────────
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await prisma.pipelineRun.update({
      where: { id: pipelineRun.id },
      data: {
        completedAt,
        status: "success",
        reposFetched: candidates.length,
        reposScored: scored.length,
        reposSummarized: summarizedCount,
        emailsSent,
        durationMs,
      },
    });

    console.log(
      `[Pipeline] Done in ${durationMs}ms. Scored: ${scored.length}, Summarized: ${summarizedCount}, Emails: ${emailsSent}`
    );
  } catch (err) {
    console.error("[Pipeline] Fatal error:", err);

    await prisma.pipelineRun.update({
      where: { id: pipelineRun.id },
      data: {
        completedAt: new Date(),
        status: "failed",
        errorLog: { error: String(err), stack: err instanceof Error ? err.stack : undefined },
        durationMs: Date.now() - startedAt.getTime(),
      },
    });

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runPipeline();
