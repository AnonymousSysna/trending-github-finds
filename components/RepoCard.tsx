import Link from "next/link";
import type { RepoWithSnapshot } from "@/lib/types";

interface RepoCardProps {
  repo: RepoWithSnapshot;
  rank: number;
  isHiddenGem?: boolean;
}

export function RepoCard({ repo, rank, isHiddenGem }: RepoCardProps) {
  const summary = repo.aiSummary;
  const starsToday = repo.snapshot?.starsGained24h ?? 0;
  const hiddenGem = isHiddenGem ?? repo.isHiddenGem;

  return (
    <article className="group relative rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all p-5">
      {/* Rank + badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
            #{rank}
          </span>
          {hiddenGem ? (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Hidden Gem
            </span>
          ) : (
            starsToday > 500 && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                Trending
              </span>
            )
          )}
        </div>
        {starsToday > 0 && (
          <span className="text-xs text-green-400 font-medium">
            +{starsToday.toLocaleString()} today
          </span>
        )}
      </div>

      {/* Repo title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/repo/${repo.owner}/${repo.name}`}
          className="font-semibold text-white hover:text-green-400 transition-colors leading-snug"
        >
          <span className="text-gray-400">{repo.owner}/</span>
          <span>{repo.name}</span>
        </Link>
        <span className="shrink-0 text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          â˜… {repo.starsTotal.toLocaleString()}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {repo.language && (
          <Link
            href={`/languages/${repo.language.toLowerCase()}`}
            className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded hover:bg-blue-500/25 transition-colors"
          >
            {repo.language}
          </Link>
        )}
        {(summary?.tags ?? repo.topics).slice(0, 4).map((tag) => (
          <Link
            key={tag}
            href={`/topics/${tag}`}
            className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            {tag}
          </Link>
        ))}
      </div>

      {/* Hook / description */}
      {summary ? (
        <p className="text-sm text-gray-300 italic mb-2 leading-relaxed">
          &ldquo;{summary.hook}&rdquo;
        </p>
      ) : repo.description ? (
        <p className="text-sm text-gray-400 mb-2 leading-relaxed line-clamp-2">
          {repo.description}
        </p>
      ) : null}

      {/* Why trending */}
      {summary?.why_trending && (
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          <span className="font-medium text-gray-400">WHY NOW: </span>
          {summary.why_trending}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          View on GitHub â†—
        </a>
        <Link
          href={`/repo/${repo.owner}/${repo.name}`}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
        >
          Details â†’
        </Link>
      </div>
    </article>
  );
}


