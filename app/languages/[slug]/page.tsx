import type { Metadata } from "next";
import { getTodayTopRepos } from "@/lib/repos";
import { RepoCard } from "@/components/RepoCard";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lang = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `Trending ${lang} Repositories Today | Trending GitHub Finds`,
    description: `The fastest-growing ${lang} repos on GitHub today, ranked by star momentum with AI-powered summaries.`,
  };
}

export const revalidate = 3600;

export default async function LanguagePage({ params }: Props) {
  const { slug } = await params;
  const lang = slug.charAt(0).toUpperCase() + slug.slice(1);
  const repos = await getTodayTopRepos({ language: lang, limit: 20 }).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">
        Trending <span className="text-blue-400">{lang}</span> repos today
      </h1>
      <p className="text-gray-400 text-sm mb-6">Ranked by star momentum</p>

      {repos.length === 0 ? (
        <p className="text-gray-500">No {lang} repos found today.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo, i) => (
            <RepoCard key={repo.id} repo={repo} rank={i + 1} isHiddenGem={repo.isHiddenGem} />
          ))}
        </div>
      )}

      <div className="mt-10 p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
        <p className="font-semibold text-white mb-1">Get daily {lang} updates</p>
        <div className="max-w-sm mx-auto mt-4">
          <EmailCaptureForm source={`lang-${slug}`} />
        </div>
      </div>
    </div>
  );
}

