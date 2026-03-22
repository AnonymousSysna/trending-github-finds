import type { Metadata } from "next";
import Link from "next/link";
import { getAvailableTopics } from "@/lib/repos";

export const metadata: Metadata = {
  title: "Browse by Topic — Trending GitHub Repos",
  description: "Explore trending GitHub repositories organized by topic and technology.",
};

export const revalidate = 86400; // 24h

export default async function TopicsPage() {
  const topics = await getAvailableTopics().catch(() => [] as string[]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Browse by Topic</h1>
      <p className="text-gray-400 mb-8">
        Explore what&apos;s trending across different technology areas.
      </p>

      {topics.length === 0 ? (
        <p className="text-gray-500">No topics available yet. Check back after the first pipeline run.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <Link
              key={t}
              href={`/topics/${t}`}
              className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
