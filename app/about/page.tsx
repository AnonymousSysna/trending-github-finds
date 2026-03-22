import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Trending GitHub Finds",
  description: "Learn about Trending GitHub Finds and how we surface the best repos.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white mb-4">About</h1>

      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-gray-300 leading-relaxed">
        <p>
          <strong className="text-white">Trending GitHub Finds</strong> is a daily digest of the
          most exciting GitHub repositories, ranked by momentum and summarized by AI.
        </p>

        <p>
          The average developer spends 30+ minutes daily across Twitter, HN, and GitHub Explore
          trying to stay current. We collapse that to a single daily visit with zero noise.
        </p>

        <h2 className="text-lg font-semibold text-white mt-6 mb-2">What makes us different</h2>
        <ul className="space-y-2 list-disc pl-5 text-gray-400">
          <li>We score by <strong className="text-white">momentum</strong>, not raw star count — a repo with 500 new stars today ranks above one with 50,000 total</li>
          <li>AI summaries answer <em>"why should I care?"</em> not just "what is it?"</li>
          <li>Developer-native design: dark mode, fast, no marketing fluff</li>
          <li>Daily email digest is the retention hook — no app required</li>
        </ul>

        <h2 className="text-lg font-semibold text-white mt-6 mb-2">Our mission</h2>
        <p>
          Help developers stay current with what&apos;s being built, so they can build better things.
        </p>
      </div>
    </div>
  );
}
