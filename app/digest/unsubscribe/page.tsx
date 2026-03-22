"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const params = useSearchParams();
  const success = params.get("success") === "true";
  const error = params.get("error");

  if (success) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-white mb-3">You&apos;ve been unsubscribed</h1>
        <p className="text-gray-400 mb-6">
          You won&apos;t receive any more emails from us. No hard feelings!
        </p>
        <Link href="/" className="text-green-400 hover:text-green-300 transition-colors text-sm">
          ← Back to trending repos
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-3">Invalid unsubscribe link</h1>
        <p className="text-gray-400 mb-6">
          This link may have expired or already been used.
        </p>
        <Link href="/" className="text-green-400 hover:text-green-300 transition-colors text-sm">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-white mb-3">Unsubscribe</h1>
      <p className="text-gray-400">Processing your request...</p>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Suspense>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
