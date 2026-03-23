export interface RepoWithSnapshot {
  id: number;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  starsTotal: number;
  forksTotal: number;
  openIssues: number;
  license: string | null;
  htmlUrl: string;
  homepageUrl: string | null;
  pushedAt: Date | null;
  aiSummary: AiSummary | null;
  isHiddenGem: boolean;
  isStartupRelevant: boolean;
  snapshot: {
    starsGained24h: number;
    starsGained7d: number;
    trendScore: number;
    rank: number | null;
  } | null;
}

export interface AiSummary {
  what_it_does: string;
  why_trending: string;
  who_should_care: string;
  tags: string[];
  hook: string;
  install_hint?: string | null;
}
