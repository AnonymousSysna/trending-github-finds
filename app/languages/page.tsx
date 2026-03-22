import type { Metadata } from "next";
import Link from "next/link";
import { getAvailableLanguages } from "@/lib/repos";

export const metadata: Metadata = {
  title: "Browse by Language — Trending GitHub Repos",
  description: "Explore trending GitHub repositories organized by programming language.",
};

export const revalidate = 86400;

export default async function LanguagesPage() {
  const languages = await getAvailableLanguages().catch(() => [] as string[]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Browse by Language</h1>
      <p className="text-gray-400 mb-8">
        See what&apos;s trending in your favorite programming language.
      </p>

      {languages.length === 0 ? (
        <p className="text-gray-500">No languages available yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <Link
              key={lang}
              href={`/languages/${lang.toLowerCase()}`}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              {lang}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
