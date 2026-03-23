import { prisma } from "./db";
import { cacheGet, cacheSet, CACHE_KEYS } from "./redis";
import type { RepoWithSnapshot } from "./types";

async function getLatestSnapshotDate(): Promise<Date | null> {
  const latest = await prisma.dailySnapshot.findFirst({
    orderBy: { snapshotDate: "desc" },
    select: { snapshotDate: true },
  });
  return latest?.snapshotDate ?? null;
}

export async function getTodayTopRepos(
  options: {
    language?: string;
    topic?: string;
    limit?: number;
    useCache?: boolean;
  } = {}
): Promise<RepoWithSnapshot[]> {
  const { language, topic, limit = 20, useCache = true } = options;

  const cacheKey = CACHE_KEYS.filteredRepos(language, topic);

  if (useCache) {
    const cached = await cacheGet<RepoWithSnapshot[]>(cacheKey);
    if (cached) return cached.slice(0, limit);
  }

  const snapshotDate = await getLatestSnapshotDate();
  if (!snapshotDate) return [];

  const snapshots = await prisma.dailySnapshot.findMany({
    where: {
      snapshotDate,
      repo: {
        archived: false,
        ...(language ? { language } : {}),
        ...(topic ? { topics: { has: topic } } : {}),
      },
    },
    orderBy: { rank: "asc" },
    take: limit,
    include: {
      repo: true,
    },
  });

  const results: RepoWithSnapshot[] = snapshots.map((s) => ({
    id: s.repo.id,
    owner: s.repo.owner,
    name: s.repo.name,
    description: s.repo.description,
    language: s.repo.language,
    topics: s.repo.topics,
    starsTotal: s.repo.starsTotal,
    forksTotal: s.repo.forksTotal,
    openIssues: s.repo.openIssues,
    license: s.repo.license,
    htmlUrl: s.repo.htmlUrl,
    homepageUrl: s.repo.homepageUrl,
    pushedAt: s.repo.pushedAt,
    aiSummary: s.repo.aiSummary as RepoWithSnapshot["aiSummary"],
    snapshot: {
      starsGained24h: s.starsGained24h,
      starsGained7d: s.starsGained7d,
      trendScore: s.trendScore,
      rank: s.rank,
    },
  }));

  if (useCache && results.length > 0) {
    await cacheSet(cacheKey, results, 3600);
  }

  return results;
}

export async function getRepoBySlug(
  owner: string,
  name: string
): Promise<RepoWithSnapshot | null> {
  const repo = await prisma.repo.findFirst({
    where: {
      owner: { equals: owner, mode: "insensitive" },
      name: { equals: name, mode: "insensitive" },
    },
    include: {
      dailySnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
      },
    },
  });

  if (!repo) return null;

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
    aiSummary: repo.aiSummary as RepoWithSnapshot["aiSummary"],
    snapshot: snapshot
      ? {
          starsGained24h: snapshot.starsGained24h,
          starsGained7d: snapshot.starsGained7d,
          trendScore: snapshot.trendScore,
          rank: snapshot.rank,
        }
      : null,
  };
}

export async function getSimilarRepos(
  repoId: number,
  topics: string[],
  language: string | null,
  limit = 3
): Promise<RepoWithSnapshot[]> {
  if (topics.length === 0 && !language) return [];

  const snapshotDate = await getLatestSnapshotDate();
  if (!snapshotDate) return [];

  const snapshots = await prisma.dailySnapshot.findMany({
    where: {
      snapshotDate,
      repo: {
        id: { not: repoId },
        archived: false,
        OR: [
          ...(topics.length > 0
            ? [{ topics: { hasSome: topics } }]
            : []),
          ...(language ? [{ language }] : []),
        ],
      },
    },
    orderBy: { rank: "asc" },
    take: limit,
    include: { repo: true },
  });

  return snapshots.map((s) => ({
    id: s.repo.id,
    owner: s.repo.owner,
    name: s.repo.name,
    description: s.repo.description,
    language: s.repo.language,
    topics: s.repo.topics,
    starsTotal: s.repo.starsTotal,
    forksTotal: s.repo.forksTotal,
    openIssues: s.repo.openIssues,
    license: s.repo.license,
    htmlUrl: s.repo.htmlUrl,
    homepageUrl: s.repo.homepageUrl,
    pushedAt: s.repo.pushedAt,
    aiSummary: s.repo.aiSummary as RepoWithSnapshot["aiSummary"],
    snapshot: {
      starsGained24h: s.starsGained24h,
      starsGained7d: s.starsGained7d,
      trendScore: s.trendScore,
      rank: s.rank,
    },
  }));
}

export async function getAvailableLanguages(): Promise<string[]> {
  const result = await prisma.repo.findMany({
    where: { language: { not: null }, archived: false },
    select: { language: true },
    distinct: ["language"],
    orderBy: { language: "asc" },
  });
  return result.map((r) => r.language!).filter(Boolean);
}

export async function getAvailableTopics(): Promise<string[]> {
  const repos = await prisma.repo.findMany({
    where: { archived: false },
    select: { topics: true },
  });
  const topicCounts = new Map<string, number>();
  for (const repo of repos) {
    for (const t of repo.topics) {
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, 50);
}
