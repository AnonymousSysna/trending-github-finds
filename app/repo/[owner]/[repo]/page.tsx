import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRepoBySlug, getSimilarRepos } from "@/lib/repos";
import { RepoCard } from "@/components/RepoCard";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";
import { CopyButton } from "@/components/CopyButton";

interface RepoPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({ params }: RepoPageProps): Promise<Metadata> {
  const { owner, repo: repoName } = await params;
  const repo = await getRepoBySlug(owner, repoName);

  if (!repo) return {};

  return {
    title: `${repo.name} by ${repo.owner} â€” Why It's Trending on GitHub`,
    description: repo.aiSummary?.what_it_does
      ? `${repo.aiSummary.what_it_does} Â· ${repo.snapshot?.starsGained24h ?? 0} stars today Â· Discover why developers are excited about ${repo.name}.`
      : repo.description ?? undefined,
    openGraph: {
      type: "article",
    },
  };
}

export default async function RepoDetailPage({ params }: RepoPageProps) {
  const { owner, repo: repoName } = await params;
  const repo = await getRepoBySlug(owner, repoName);

  if (!repo) notFound();

  const similar = await getSimilarRepos(repo.id, repo.topics, repo.language);
  const summary = repo.aiSummary;
  const pushedAgo = repo.pushedAt
    ? Math.round((Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-flex items-center gap-1">
        â† Back to Today&apos;s Trending
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">{repo.owner}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{repo.name}</h1>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-white">
              â˜… {repo.starsTotal.toLocaleString()}
            </div>
            {repo.snapshot?.starsGained24h ? (
              <div className="text-sm text-green-400">
                +{repo.snapshot.starsGained24h.toLocaleString()} today
              </div>
            ) : null}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {repo.language && (
            <Link
              href={`/languages/${repo.language.toLowerCase()}`}
              className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/25 transition-colors"
            >
              {repo.language}
            </Link>
          )}
          {repo.topics.slice(0, 6).map((t) => (
            <Link
              key={t}
              href={`/topics/${t}`}
              className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      {summary ? (
        <div className="space-y-4 mb-8">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-green-400 mb-1.5">
                What it does
              </h2>
              <p className="text-gray-200 leading-relaxed">{summary.what_it_does}</p>
              <p className="text-sm text-gray-400 mt-2">For: {summary.who_should_care}</p>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1.5">
                Why it&apos;s trending now
              </h2>
              <p className="text-gray-300 leading-relaxed">{summary.why_trending}</p>
            </div>
            {summary.install_hint && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1.5">
                  Quick install
                </h2>
                <code className="block bg-black/40 rounded-lg px-4 py-2.5 text-sm text-green-300 font-mono">
                  {summary.install_hint}
                </code>
              </div>
            )}
          </div>
        </div>
      ) : repo.description ? (
        <p className="text-gray-300 text-lg mb-8 leading-relaxed">{repo.description}</p>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Stars", value: repo.starsTotal.toLocaleString() },
          { label: "Forks", value: repo.forksTotal.toLocaleString() },
          { label: "Issues", value: repo.openIssues.toLocaleString() },
          { label: "Last commit", value: pushedAgo != null ? `${pushedAgo}d ago` : "â€”" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/8 bg-white/[0.02] p-3 text-center">
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-3 mb-10">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-white/10 hover:bg-white/15 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          View on GitHub â†—
        </a>
        {summary?.install_hint && (
          <CopyButton text={summary.install_hint} />
        )}
      </div>

      {/* Similar repos */}
      {similar.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">Similar repos you might like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {similar.map((r, i) => (
              <RepoCard key={r.id} repo={r} rank={i + 1} isHiddenGem={r.isHiddenGem} />
            ))}
          </div>
        </section>
      )}

      {/* Email capture */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
        <h2 className="font-semibold text-white mb-1">See what trends tomorrow</h2>
        <p className="text-sm text-gray-400 mb-4">
          Get the top 10 repos delivered to your inbox every morning.
        </p>
        <div className="max-w-sm mx-auto">
          <EmailCaptureForm source="detail-page" />
        </div>
      </div>
    </div>
  );
}

