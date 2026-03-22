export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Subscribe to the Daily GitHub Digest",
  description:
    "Top 10 trending GitHub repos, every morning. Plain-English AI summaries. No fluff.",
};

export default async function DigestPage() {
  const count = await prisma.subscriber.count({ where: { confirmed: true } }).catch(() => 0);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-white mb-3">
        The GitHub Digest Developers Actually Read
      </h1>
      <div className="text-gray-400 mb-8 space-y-1">
        <p>✓ Top 10 repos, every morning</p>
        <p>✓ Plain-English AI summaries</p>
        <p>✓ No fluff. Unsubscribe anytime.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <EmailCaptureForm
          source="digest-page"
          placeholder="Your email address"
          ctaText="Start Getting My Digest →"
          showFrequency
        />
      </div>

      {count > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          Join {count.toLocaleString()} developers already subscribed
        </p>
      )}
    </div>
  );
}
