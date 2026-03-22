import type { Metadata } from "next";
import { getTodayTopRepos } from "@/lib/repos";
import { RepoCard } from "@/components/RepoCard";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = slug.replace(/-/g, " ");
  return {
    title: `Best Trending ${topic} Repos on GitHub Today`,
    description: `Top trending ${topic} repositories on GitHub right now, ranked by star momentum with AI-powered summaries.`,
  };
}

export const revalidate = 3600;

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const repos = await getTodayTopRepos({ topic: slug, limit: 20 }).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">
        Trending <span className="text-green-400">#{slug}</span> repos today
      </h1>
      <p className="text-gray-400 text-sm mb-6">Ranked by star momentum</p>

      {repos.length === 0 ? (
        <p className="text-gray-500">No repos found for this topic yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo, i) => (
            <RepoCard key={repo.id} repo={repo} rank={i + 1} />
          ))}
        </div>
      )}

      <div className="mt-10 p-6 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
        <p className="font-semibold text-white mb-1">Get daily #{slug} updates</p>
        <div className="max-w-sm mx-auto mt-4">
          <EmailCaptureForm source={`topic-${slug}`} />
        </div>
      </div>
    </div>
  );
}
