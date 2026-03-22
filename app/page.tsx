export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { getTodayTopRepos } from "@/lib/repos";
import { prisma } from "@/lib/db";
import { RepoCard } from "@/components/RepoCard";
import { FilterBar } from "@/components/FilterBar";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";

export const metadata: Metadata = {
  title: "Trending GitHub Repos Today — AI-Summarized for Developers",
  description:
    "Discover the top trending GitHub repositories daily. AI summaries, star momentum scores, and daily email digest.",
};

interface HomeProps {
  searchParams: Promise<{ lang?: string; topic?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { lang, topic } = await searchParams;

  const [repos, subscriberCount] = await Promise.all([
    getTodayTopRepos({ language: lang, topic, limit: 20 }).catch(() => []),
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
            Discover What Developers Are Building Today
          </h1>
          <p className="text-gray-400 text-lg mb-6 max-w-xl mx-auto">
            Top GitHub repos, ranked by momentum. AI-summarized. Delivered daily.
          </p>

          <div className="max-w-md mx-auto">
            <EmailCaptureForm
              source="hero"
              ctaText="Get Daily Digest →"
            />
            <p className="text-xs text-gray-500 mt-2">
              {subscriberCount > 0
                ? `Join ${subscriberCount.toLocaleString()} developers`
                : "Join developers"}{" "}
              · No spam · Unsubscribe anytime
            </p>
          </div>

          <p className="text-xs text-gray-600 mt-4">
            LAST UPDATED: {lastUpdated} · {repos.length} repos analyzed
          </p>
        </section>

        {/* Repo grid */}
        {repos.length === 0 ? (
          <EmptyState lang={lang} topic={topic} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.slice(0, 6).map((repo, i) => (
                <RepoCard key={repo.id} repo={repo} rank={i + 1} />
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
                  <EmailCaptureForm source="mid-page" ctaText="Subscribe Free →" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.slice(6).map((repo, i) => (
                <RepoCard key={repo.id} repo={repo} rank={i + 7} />
              ))}
            </div>
          </>
        )}

        {/* Social proof strip */}
        {repos.length > 0 && (
          <div className="mt-12 text-center text-xs text-gray-600">
            {subscriberCount > 0 && `${subscriberCount.toLocaleString()} subscribers · `}
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
        📧 Get Daily Digest
      </a>
    </div>
  );
}
