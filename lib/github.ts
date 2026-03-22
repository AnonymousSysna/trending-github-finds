const GITHUB_API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;

const headers: HeadersInit = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "trending-github-finds/1.0",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  license: { spdx_id: string } | null;
  created_at: string;
  pushed_at: string;
  archived: boolean;
  readme?: string;
}

export async function searchTrendingRepos(
  options: {
    language?: string;
    topic?: string;
    minStars?: number;
    perPage?: number;
  } = {}
): Promise<GitHubRepo[]> {
  const { language, topic, minStars = 50, perPage = 50 } = options;

  // Build search query: repos updated in last 7 days with significant stars
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  let q = `stars:>${minStars} pushed:>${sevenDaysAgo} archived:false`;
  if (language) q += ` language:${language}`;
  if (topic) q += ` topic:${topic}`;

  const params = new URLSearchParams({
    q,
    sort: "stars",
    order: "desc",
    per_page: String(perPage),
  });

  const res = await fetch(`${GITHUB_API}/search/repositories?${params}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items ?? [];
}

export async function getRepoReadme(
  owner: string,
  repo: string
): Promise<string> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: { ...headers, Accept: "application/vnd.github.raw" },
    });
    if (!res.ok) return "";
    const text = await res.text();
    // Truncate to 3000 chars for AI processing
    return text.slice(0, 3000);
  } catch {
    return "";
  }
}

export async function getRepoDetails(
  owner: string,
  repo: string
): Promise<GitHubRepo | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Compute a trend score from repo data
export function computeTrendScore(repo: {
  starsGained24h: number;
  starsGained7d: number;
  forksGained7d: number;
  createdAtGh: Date | null;
  starsTotal: number;
}): number {
  const { starsGained24h, starsGained7d, forksGained7d, createdAtGh, starsTotal } = repo;

  // Age penalty: newer repos get a boost (< 30 days old)
  const ageMs = createdAtGh
    ? Date.now() - createdAtGh.getTime()
    : 365 * 24 * 60 * 60 * 1000;
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  const recencyScore = ageDays < 30 ? 100 : ageDays < 90 ? 50 : 0;
  const agePenalty = ageDays > 365 ? Math.min(starsTotal * 0.001, 50) : 0;

  return (
    starsGained24h * 3 +
    starsGained7d * 0.5 +
    forksGained7d * 1.5 +
    recencyScore -
    agePenalty
  );
}
