export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { getTodayTopRepos, type RepoFilter } from "@/lib/repos";
import { prisma } from "@/lib/db";
import { RepoCard } from "@/components/RepoCard";
import { FilterBar } from "@/components/FilterBar";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";

export const metadata: Metadata = {
  title: "GitHub Trending Repos Worth Building With | GitHubFinds",
  description:
    "Daily ranked repos by momentum, not just stars. Hidden gems, startup tools, and underrated projects — curated for developers who ship.",
};

interface HomeProps {
  searchParams: Promise<{ lang?: string; topic?: string; filter?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { lang, topic, filter: rawFilter } = await searchParams;
  const filter: RepoFilter | undefined =
    rawFilter === "hidden-gems" || rawFilter === "startup-ideas"
      ? rawFilter
      : undefined;

  const [repos, subscriberCount] = await Promise.all([
    getTodayTopRepos({ language: lang, topic, filter, limit: 20 }).catch(() => []),
    prisma.subscriber.count({ where: { confirmed: true } }).catch(() => 0),
  ]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });

  return (
    <>
      {/* Filter bar */}
      <Suspense>
        <FilterBar />
      </Suspense>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero section */}
        <section className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 text-balance">
            GitHub&apos;s Most Interesting Repos, Ranked by Momentum
          </h1>
          <p className="text-gray-400 text-lg mb-6 max-w-xl mx-auto">
            Not just what&apos;s popular — what&apos;s worth your attention. Daily picks for developers who build things.
          </p>

          <div className="max-w-md mx-auto">
            <EmailCaptureForm
              source="hero"
              ctaText="Get Daily Digest â†’"
            />
            <p className="text-xs text-gray-500 mt-2">
              {subscriberCount > 0
                ? `Join ${subscriberCount.toLocaleString()} developers`
                : "Join developers"}{" "}
              Â· No spam Â· Unsubscribe anytime
            </p>
          </div>

          <p className="text-xs text-gray-600 mt-4">
            LAST UPDATED: {lastUpdated} Â· {repos.length} repos analyzed
          </p>
        </section>

        {/* Repo grid */}
        {repos.length === 0 ? (
          <EmptyState lang={lang} topic={topic} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.slice(0, 6).map((repo, i) => (
                <RepoCard key={repo.id} repo={repo} rank={i + 1} isHiddenGem={repo.isHiddenGem} />
              ))}
            </div>

            {/* Mid-page email capture */}
            {repos.length > 6 && (
              <div className="my-8 p-6 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
                <p className="text-white font-semibold mb-1">
                  Don&apos;t miss tomorrow&apos;s picks
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Get the top 10 repos delivered to your inbox every morning.
                </p>
                <div className="max-w-sm mx-auto">
                  <EmailCaptureForm source="mid-page" ctaText="Subscribe Free â†’" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.slice(6).map((repo, i) => (
                <RepoCard key={repo.id} repo={repo} rank={i + 7} isHiddenGem={repo.isHiddenGem} />
              ))}
            </div>
          </>
        )}

        {/* Social proof strip */}
        {repos.length > 0 && (
          <div className="mt-12 text-center text-xs text-gray-600">
            {subscriberCount > 0 && `${subscriberCount.toLocaleString()} subscribers Â· `}
            Updated daily at 6AM UTC
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <StickyMobileCTA />
    </>
  );
}

function EmptyState({ lang, topic }: { lang?: string; topic?: string }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <p className="text-lg mb-2">No repos found{lang ? ` for ${lang}` : ""}{topic ? ` in #${topic}` : ""}.</p>
      <p className="text-sm">The daily pipeline runs at 6AM UTC. Check back soon!</p>
    </div>
  );
}

function StickyMobileCTA() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-[#0a0a0a]/95 border-t border-white/10 backdrop-blur-sm"
      style={{ display: "var(--sticky-visible, flex)" }}
    >
      <a
        href="/digest"
        className="w-full text-center bg-green-500 text-black font-semibold text-sm py-3 rounded-lg"
      >
        ðŸ“§ Get Daily Digest
      </a>
    </div>
  );
}

